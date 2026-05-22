package com.whatsaas.inbox.application.dto;

import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import java.time.Instant;

public record InboxMessageResponse(Long id, Long conversationId, String clientMessageId, String metaMessageId,
                                   String direction, String type, String body, String status, String mediaMimeType,
                                   String mediaUrl, Instant createdAt) {

    public static InboxMessageResponse from(WhatsAppMessage message) {
        return new InboxMessageResponse(message.getId(), message.getConversationId(), null, message.getMetaMessageId(),
                message.getDirection().name(), message.getType().name(), message.getBody(), message.getStatus().name(),
                message.getMediaMimeType(), mediaUrl(message), message.getCreatedAt());
    }

    private static String mediaUrl(WhatsAppMessage message) {
        return message.getMediaPath() == null ? null : "/api/v1/inbox/messages/" + message.getId() + "/media";
    }
}
