package com.whatsaas.templates.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.common.audit.AuditService;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.templates.application.dto.*;
import com.whatsaas.templates.domain.*;
import com.whatsaas.templates.infrastructure.*;
import com.whatsaas.whatsapp.application.WhatsAppAccountService;
import com.whatsaas.whatsapp.domain.WhatsAppAccount;
import com.whatsaas.whatsapp.infrastructure.MetaCloudApiClient;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TemplateService {
    private final WhatsAppTemplateRepository templates;
    private final TemplateAnalyticsRepository analytics;
    private final WhatsAppAccountService accounts;
    private final MetaCloudApiClient meta;
    private final ObjectMapper mapper;
    private final AuditService audit;

    public TemplateService(WhatsAppTemplateRepository templates, TemplateAnalyticsRepository analytics,
                           WhatsAppAccountService accounts, MetaCloudApiClient meta, ObjectMapper mapper,
                           AuditService audit) {
        this.templates = templates; this.analytics = analytics; this.accounts = accounts; this.meta = meta;
        this.mapper = mapper; this.audit = audit;
    }

    @Transactional
    public TemplateResponse create(TemplateUpsertRequest request) {
        WhatsAppAccount account = account(request.phoneNumberId());
        WhatsAppTemplate template = templates.save(new WhatsAppTemplate(TenantContext.currentTenantId(),
                account.getWabaId(), request.name(), request.language(), request.category(), json(request.components())));
        JsonNode created = meta.createTemplate(account.getWabaId(), template.getName(), template.getLanguage(),
                template.getCategory().name(), request.components());
        template.update(template.getCategory().name(), created.path("status").asText("PENDING"),
                template.getComponentsJson(), created.path("id").asText(null));
        audit.record("TEMPLATE_CREATED", "WhatsAppTemplate", template.getId(), "{}");
        return TemplateResponse.from(template);
    }

    @Transactional
    public TemplateResponse update(Long id, TemplateUpsertRequest request) {
        WhatsAppTemplate template = require(id);
        if (template.getMetaTemplateId() != null) {
            throw new DomainException(HttpStatus.CONFLICT, "TEMPLATE_META_MANAGED",
                    "Submitted Meta templates are updated by creating a new revision or syncing Meta state.");
        }
        template.updateDraft(request.category(), json(request.components()));
        return TemplateResponse.from(template);
    }

    @Transactional
    public void delete(Long id) {
        WhatsAppTemplate template = require(id);
        if (template.getMetaTemplateId() != null) meta.deleteTemplate(template.getWabaId(), template.getName());
        templates.delete(template);
        audit.record("TEMPLATE_DELETED", "WhatsAppTemplate", id, "{}");
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> list(TemplateCategory category, TemplateApprovalStatus status) {
        List<WhatsAppTemplate> items = category != null && status != null
                ? templates.findByTenantIdAndCategoryAndApprovalStatusOrderByUpdatedAtDesc(TenantContext.currentTenantId(),
                category, status) : templates.findByTenantIdOrderByUpdatedAtDesc(TenantContext.currentTenantId());
        return items.stream().map(TemplateResponse::from).toList();
    }

    @Transactional
    public List<TemplateResponse> sync(TemplateSyncRequest request) {
        WhatsAppAccount account = account(request.phoneNumberId());
        JsonNode remote = meta.listTemplates(account.getWabaId());
        for (JsonNode item : remote.path("data")) {
            WhatsAppTemplate template = templates.findByTenantIdAndWabaIdAndNameAndLanguage(TenantContext.currentTenantId(),
                    account.getWabaId(), item.path("name").asText(), item.path("language").asText())
                    .orElseGet(() -> templates.save(new WhatsAppTemplate(TenantContext.currentTenantId(),
                            account.getWabaId(), item.path("name").asText(), item.path("language").asText(),
                            WhatsAppTemplate.category(item.path("category").asText()), json(item.path("components")))));
            template.update(item.path("category").asText(), item.path("status").asText(), json(item.path("components")),
                    item.path("id").asText(null));
        }
        audit.record("TEMPLATES_SYNCED", "WhatsAppAccount", account.getId(), "{}");
        return list(null, null);
    }

    @Transactional
    public List<TemplateAnalyticsResponse> refreshAnalytics(Long templateId) {
        WhatsAppTemplate template = require(templateId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        JsonNode payload = meta.templateAnalytics(template.getWabaId(), List.of(template.getMetaTemplateId()),
                today.minusDays(7).atStartOfDay().toEpochSecond(ZoneOffset.UTC),
                today.plusDays(1).atStartOfDay().toEpochSecond(ZoneOffset.UTC));
        long delivered = metric(payload, "delivered");
        long read = metric(payload, "read");
        long sent = metric(payload, "sent");
        analytics.findByTemplateIdAndSnapshotDate(templateId, today).orElseGet(() -> analytics.save(
                new TemplateAnalyticsSnapshot(template.getTenantId(), templateId, sent, 0, delivered, read, today)));
        return history(templateId);
    }

    @Transactional(readOnly = true)
    public List<TemplateAnalyticsResponse> history(Long templateId) {
        require(templateId);
        return analytics.findByTenantIdAndTemplateIdOrderBySnapshotDateDesc(TenantContext.currentTenantId(), templateId)
                .stream().map(TemplateAnalyticsResponse::from).toList();
    }

    private long metric(JsonNode payload, String name) {
        return payload.findValues(name).stream().mapToLong(node -> node.isNumber() ? node.asLong() : 0).sum();
    }
    private WhatsAppAccount account(String phoneNumberId) { return accounts.requireOutboundAccount(TenantContext.currentTenantId(), phoneNumberId.trim()); }
    private WhatsAppTemplate require(Long id) { return templates.findByTenantIdAndId(TenantContext.currentTenantId(), id).orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND", "Template not found.")); }
    private String json(JsonNode node) { try { return mapper.writeValueAsString(node); } catch (Exception ex) { throw new IllegalArgumentException("Template JSON invalid.", ex); } }
}
