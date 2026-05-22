package com.whatsaas.common.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(String issuer, String secret, Duration accessTokenTtl, Duration refreshTokenTtl) {
}
