package com.whatsaas.inbox.application;

import com.whatsaas.inbox.infrastructure.InboxProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class InboxRealtimePublisher {

    private final StringRedisTemplate redisTemplate;
    private final InboxProperties inboxProperties;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public InboxRealtimePublisher(StringRedisTemplate redisTemplate, InboxProperties inboxProperties,
                                  com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.inboxProperties = inboxProperties;
        this.objectMapper = objectMapper;
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
        try {
            redisTemplate.convertAndSend(inboxProperties.redisTopic(), objectMapper.writeValueAsString(event));
        } catch (Exception ex) {
            throw new IllegalStateException("Inbox realtime event could not be published.", ex);
        }
    }
}
