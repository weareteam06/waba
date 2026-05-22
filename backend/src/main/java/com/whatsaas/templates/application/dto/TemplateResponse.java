package com.whatsaas.templates.application.dto;

import com.whatsaas.templates.domain.WhatsAppTemplate;
import java.time.Instant;

public record TemplateResponse(Long id, String wabaId, String metaTemplateId, String name, String language,
                               String category, String approvalStatus, String componentsJson, Instant syncedAt) {
    public static TemplateResponse from(WhatsAppTemplate template) {
        return new TemplateResponse(template.getId(), template.getWabaId(), template.getMetaTemplateId(),
                template.getName(), template.getLanguage(), template.getCategory().name(),
                template.getApprovalStatus().name(), template.getComponentsJson(), template.getSyncedAt());
    }
}
