package com.whatsaas.notifications.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.push")
public record PushNotificationProperties(String vapidPublicKey) {
}
