package com.whatsaas.whatsapp.application.dto;

import com.whatsaas.whatsapp.domain.WhatsAppMessage;

public record MessageResponse(Long id, String metaMessageId, String phoneNumberId, String recipient, String body,
                              String direction, String type, String status, int sendAttempts, String lastError) {

    public static MessageResponse from(WhatsAppMessage message) {
        return new MessageResponse(message.getId(), message.getMetaMessageId(), message.getPhoneNumberId(),
                message.getRecipient(), message.getBody(), message.getDirection().name(), message.getType().name(),
                message.getStatus().name(), message.getSendAttempts(), message.getLastError());
    }
}
