package com.whatsaas.inbox.application;

import com.whatsaas.inbox.infrastructure.InboxProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class InboxRealtimePublisher {

    private static final Logger log = LoggerFactory.getLogger(InboxRealtimePublisher.class);

    private final StringRedisTemplate redisTemplate;
    private final InboxProperties inboxProperties;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public InboxRealtimePublisher(StringRedisTemplate redisTemplate, InboxProperties inboxProperties,
                                  com.fasterxml.jackson.databind.ObjectMapper objectMapper,
                                  SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.inboxProperties = inboxProperties;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(InboxRealtimeEvent event) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(event);
                }
            });
            return;
        }
        send(event);
    }

    private void send(InboxRealtimeEvent event) {
        messagingTemplate.convertAndSend(destination(event), event);
        try {
            redisTemplate.convertAndSend(inboxProperties.redisTopic(), objectMapper.writeValueAsString(event));
        } catch (Exception ex) {
            log.warn("Inbox realtime event was delivered locally but could not be published to Redis.", ex);
        }
    }

    private String destination(InboxRealtimeEvent event) {
        return "/topic/inbox/tenant/" + event.tenantId();
    }
}
