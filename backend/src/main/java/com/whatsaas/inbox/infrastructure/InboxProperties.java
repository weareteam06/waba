package com.whatsaas.inbox.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.inbox")
public record InboxProperties(String redisTopic) {
}
