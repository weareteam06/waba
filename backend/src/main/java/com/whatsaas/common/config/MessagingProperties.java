package com.whatsaas.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.messaging")
public record MessagingProperties(String exchange, String messageRoutingKey, String messageQueue,
                                  String messageRetryRoutingKey, String messageRetryQueue, String webhookRoutingKey,
                                  String webhookQueue, String campaignRoutingKey, String campaignQueue,
                                  String campaignRetryRoutingKey, String campaignRetryQueue) {
}
