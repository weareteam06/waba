package com.whatsaas.notifications.application.dto;

public record PushSubscriptionStatusResponse(String vapidPublicKey, boolean configured) {
}
