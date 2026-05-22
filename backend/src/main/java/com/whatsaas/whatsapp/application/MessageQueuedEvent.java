package com.whatsaas.whatsapp.application;

public record MessageQueuedEvent(Long tenantId, Long messageId) {
}
