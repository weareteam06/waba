package com.whatsaas.templates.infrastructure;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.common.config.MessagingProperties;
import com.whatsaas.templates.application.CampaignRecipientSendEvent;
import com.whatsaas.templates.domain.CampaignRecipient;
import com.whatsaas.templates.domain.WhatsAppCampaign;
import com.whatsaas.templates.domain.WhatsAppTemplate;
import com.whatsaas.whatsapp.infrastructure.MetaCloudApiClient;
import com.whatsaas.whatsapp.infrastructure.MetaProviderException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CampaignRecipientConsumer {
    private final CampaignRecipientRepository recipients; private final WhatsAppCampaignRepository campaigns;
    private final WhatsAppTemplateRepository templates; private final MetaCloudApiClient meta; private final ObjectMapper mapper;
    private final CampaignRateLimiter limiter; private final TemplateCampaignProperties properties;
    private final RabbitTemplate rabbit; private final MessagingProperties messaging;
    public CampaignRecipientConsumer(CampaignRecipientRepository recipients, WhatsAppCampaignRepository campaigns,
                                     WhatsAppTemplateRepository templates, MetaCloudApiClient meta, ObjectMapper mapper,
                                     CampaignRateLimiter limiter, TemplateCampaignProperties properties,
                                     RabbitTemplate rabbit, MessagingProperties messaging) {
        this.recipients = recipients; this.campaigns = campaigns; this.templates = templates; this.meta = meta;
        this.mapper = mapper; this.limiter = limiter; this.properties = properties; this.rabbit = rabbit; this.messaging = messaging;
    }
    @RabbitListener(queues = "${app.messaging.campaign-queue}")
    @Transactional
    public void send(CampaignRecipientSendEvent event) throws Exception {
        CampaignRecipient recipient = recipients.findByTenantIdAndId(event.tenantId(), event.recipientId()).orElseThrow();
        WhatsAppCampaign campaign = campaigns.findByTenantIdAndId(event.tenantId(), event.campaignId()).orElseThrow();
        WhatsAppTemplate template = templates.findByTenantIdAndId(event.tenantId(), campaign.getTemplateId()).orElseThrow();
        if (!limiter.allow(event.tenantId(), campaign.getPhoneNumberId())) { retry(event); return; }
        try {
            JsonNode components = mapper.readTree(recipient.getParametersJson());
            recipient.sent(meta.sendTemplate(campaign.getPhoneNumberId(), recipient.getRecipient(), template.getName(),
                    template.getLanguage(), components).messageId());
            campaign.sent();
        } catch (MetaProviderException ex) {
            recipient.fail(ex.getMessage());
            if (recipient.getAttempts() < properties.maxRecipientAttempts()) retry(event); else campaign.failed();
        }
    }
    private void retry(CampaignRecipientSendEvent event) {
        rabbit.convertAndSend(messaging.exchange(), messaging.campaignRetryRoutingKey(), event);
    }
}
