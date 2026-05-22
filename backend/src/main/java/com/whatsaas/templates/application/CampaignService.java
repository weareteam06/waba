package com.whatsaas.templates.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.common.config.MessagingProperties;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.templates.application.dto.*;
import com.whatsaas.templates.domain.*;
import com.whatsaas.templates.infrastructure.*;
import com.whatsaas.whatsapp.application.WhatsAppAccountService;
import java.time.Instant;
import java.util.List;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class CampaignService {
    private final WhatsAppCampaignRepository campaigns;
    private final CampaignRecipientRepository recipients;
    private final WhatsAppTemplateRepository templates;
    private final WhatsAppAccountService accounts;
    private final ObjectMapper mapper;
    private final RabbitTemplate rabbit;
    private final MessagingProperties messaging;

    public CampaignService(WhatsAppCampaignRepository campaigns, CampaignRecipientRepository recipients,
                           WhatsAppTemplateRepository templates, WhatsAppAccountService accounts, ObjectMapper mapper,
                           RabbitTemplate rabbit, MessagingProperties messaging) {
        this.campaigns = campaigns; this.recipients = recipients; this.templates = templates; this.accounts = accounts;
        this.mapper = mapper; this.rabbit = rabbit; this.messaging = messaging;
    }

    @Transactional
    public CampaignResponse create(CampaignCreateRequest request) {
        Long tenantId = TenantContext.currentTenantId();
        WhatsAppTemplate template = templates.findByTenantIdAndId(tenantId, request.templateId()).orElseThrow(() ->
                new DomainException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND", "Template not found."));
        if (template.getApprovalStatus() != TemplateApprovalStatus.APPROVED) throw new DomainException(HttpStatus.CONFLICT,
                "TEMPLATE_NOT_APPROVED", "Campaign template must be Meta approved.");
        accounts.requireOutboundAccount(tenantId, request.phoneNumberId().trim());
        WhatsAppCampaign campaign = campaigns.save(new WhatsAppCampaign(tenantId, template.getId(),
                request.phoneNumberId().trim(), request.name().trim(), request.scheduledAt(), request.recipients().size()));
        for (CampaignRecipientRequest item : request.recipients()) recipients.save(new CampaignRecipient(campaign.getId(),
                tenantId, item.recipient().trim(), json(item.parameters())));
        return CampaignResponse.from(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> list() {
        return campaigns.findTop100ByTenantIdOrderByCreatedAtDesc(TenantContext.currentTenantId()).stream()
                .map(CampaignResponse::from).toList();
    }

    @Scheduled(fixedDelayString = "${app.templates.scheduler-delay:5000}")
    @Transactional
    public void enqueueDue() {
        for (WhatsAppCampaign campaign : campaigns.findTop100ByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                CampaignStatus.SCHEDULED, Instant.now())) {
            campaign.startQueueing();
            for (CampaignRecipient recipient : recipients.findByCampaignIdAndStatus(campaign.getId(),
                    CampaignRecipientStatus.PENDING)) {
                recipient.queued(); campaign.queued();
                CampaignRecipientSendEvent event = new CampaignRecipientSendEvent(campaign.getTenantId(), campaign.getId(),
                        recipient.getId());
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCommit() {
                        rabbit.convertAndSend(messaging.exchange(), messaging.campaignRoutingKey(), event);
                    }
                });
            }
        }
    }
    private String json(Object value) { try { return mapper.writeValueAsString(value == null ? mapper.createArrayNode() : value); } catch (Exception ex) { throw new IllegalArgumentException("Recipient parameters invalid.", ex); } }
}
