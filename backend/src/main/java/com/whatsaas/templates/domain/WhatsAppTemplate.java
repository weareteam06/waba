package com.whatsaas.templates.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "whatsapp_templates")
public class WhatsAppTemplate extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "waba_id", nullable = false, length = 80)
    private String wabaId;
    @Column(name = "meta_template_id", unique = true, length = 120)
    private String metaTemplateId;
    @Column(nullable = false, length = 512)
    private String name;
    @Column(nullable = false, length = 32)
    private String language;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private TemplateCategory category;
    @Enumerated(EnumType.STRING) @Column(name = "approval_status", nullable = false, length = 40)
    private TemplateApprovalStatus approvalStatus;
    @Column(name = "components_json", nullable = false, columnDefinition = "json")
    private String componentsJson;
    @Column(name = "synced_at")
    private Instant syncedAt;

    protected WhatsAppTemplate() {}

    public WhatsAppTemplate(Long tenantId, String wabaId, String name, String language, TemplateCategory category,
                            String componentsJson) {
        this.tenantId = tenantId;
        this.wabaId = wabaId;
        this.name = name;
        this.language = language;
        this.category = category;
        this.componentsJson = componentsJson;
        this.approvalStatus = TemplateApprovalStatus.DRAFT;
    }

    public void update(String category, String status, String componentsJson, String metaTemplateId) {
        this.category = category(category);
        this.approvalStatus = status(status);
        this.componentsJson = componentsJson;
        this.metaTemplateId = metaTemplateId;
        this.syncedAt = Instant.now();
    }

    public void updateDraft(TemplateCategory category, String componentsJson) {
        this.category = category;
        this.componentsJson = componentsJson;
    }

    public static TemplateCategory category(String value) {
        try { return TemplateCategory.valueOf(value); } catch (Exception ex) { return TemplateCategory.UNKNOWN; }
    }

    public static TemplateApprovalStatus status(String value) {
        try { return TemplateApprovalStatus.valueOf(value); } catch (Exception ex) { return TemplateApprovalStatus.UNKNOWN; }
    }

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public String getWabaId() { return wabaId; }
    public String getMetaTemplateId() { return metaTemplateId; }
    public String getName() { return name; }
    public String getLanguage() { return language; }
    public TemplateCategory getCategory() { return category; }
    public TemplateApprovalStatus getApprovalStatus() { return approvalStatus; }
    public String getComponentsJson() { return componentsJson; }
    public Instant getSyncedAt() { return syncedAt; }
}
