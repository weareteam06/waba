package com.whatsaas.templates.infrastructure;

import java.time.Duration;
import java.time.Instant;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class CampaignRateLimiter {
    private final StringRedisTemplate redis;
    private final TemplateCampaignProperties properties;
    public CampaignRateLimiter(StringRedisTemplate redis, TemplateCampaignProperties properties) {
        this.redis = redis; this.properties = properties;
    }
    public boolean allow(Long tenantId, String phoneNumberId) {
        long minute = Instant.now().getEpochSecond() / 60;
        String key = "campaign-rate:" + tenantId + ":" + phoneNumberId + ":" + minute;
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) redis.expire(key, Duration.ofMinutes(2));
        return count != null && count <= properties.campaignRatePerMinute();
    }
}
