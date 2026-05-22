package com.whatsaas.whatsapp.infrastructure;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.whatsapp")
public record MetaCloudProperties(String graphBaseUrl, String graphVersion, String accessToken, String appSecret,
                                  String webhookVerifyToken, String mediaDownloadDirectory, int maxSendAttempts,
                                  Duration retryDelay) {
}
