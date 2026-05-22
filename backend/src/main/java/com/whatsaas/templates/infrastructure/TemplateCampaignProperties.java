package com.whatsaas.templates.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.templates")
public record TemplateCampaignProperties(int campaignRatePerMinute, int maxRecipientAttempts) {
}
