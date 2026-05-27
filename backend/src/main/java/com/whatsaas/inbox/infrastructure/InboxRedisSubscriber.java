package com.whatsaas.inbox.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.inbox.application.InboxRealtimeEvent;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class InboxRedisSubscriber {

    private static final Logger log = LoggerFactory.getLogger(InboxRedisSubscriber.class);

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public InboxRedisSubscriber(ObjectMapper objectMapper, SimpMessagingTemplate messagingTemplate) {
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    public void handleMessage(byte[] message) {
        try {
            InboxRealtimeEvent event = objectMapper.readValue(new String(message, StandardCharsets.UTF_8),
                    InboxRealtimeEvent.class);
            messagingTemplate.convertAndSend("/topic/inbox/tenant/" + event.tenantId(), event);
        } catch (Exception ex) {
            log.warn("Inbox Redis event could not be dispatched.", ex);
        }
    }
}
