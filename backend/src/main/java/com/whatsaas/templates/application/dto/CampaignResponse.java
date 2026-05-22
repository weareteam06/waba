package com.whatsaas.templates.application.dto;

import com.whatsaas.templates.domain.WhatsAppCampaign;
import java.time.Instant;

public record CampaignResponse(Long id, String name, Long templateId, String phoneNumberId, String status,
                               Instant scheduledAt, int totalRecipients, int queued, int sent, int failed) {
    public static CampaignResponse from(WhatsAppCampaign campaign) {
        return new CampaignResponse(campaign.getId(), campaign.getName(), campaign.getTemplateId(),
                campaign.getPhoneNumberId(), campaign.getStatus().name(), campaign.getScheduledAt(),
                campaign.getTotalRecipients(), campaign.getQueuedCount(), campaign.getSentCount(),
                campaign.getFailedCount());
    }
}
