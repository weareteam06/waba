package com.whatsaas.templates.application;

public record CampaignRecipientSendEvent(Long tenantId, Long campaignId, Long recipientId) {
}
