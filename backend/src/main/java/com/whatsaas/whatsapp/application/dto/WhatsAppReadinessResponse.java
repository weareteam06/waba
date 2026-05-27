package com.whatsaas.whatsapp.application.dto;

public record WhatsAppReadinessResponse(
        String graphVersion,
        boolean accessTokenConfigured,
        boolean appSecretConfigured,
        boolean webhookVerifyTokenConfigured,
        String webhookPath,
        String mediaDownloadDirectory,
        int maxSendAttempts) {
}
