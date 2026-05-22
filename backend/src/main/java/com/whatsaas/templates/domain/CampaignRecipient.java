package com.whatsaas.templates.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "whatsapp_campaign_recipients")
public class CampaignRecipient extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(nullable = false, length = 40)
    private String recipient;
    @Column(name = "parameters_json", nullable = false, columnDefinition = "json")
    private String parametersJson;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private CampaignRecipientStatus status;
    @Column(nullable = false)
    private int attempts;
    @Column(name = "meta_message_id", length = 160)
    private String metaMessageId;
    @Column(name = "last_error", length = 2048)
    private String lastError;
    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    protected CampaignRecipient() {}
    public CampaignRecipient(Long campaignId, Long tenantId, String recipient, String parametersJson) {
        this.campaignId = campaignId; this.tenantId = tenantId; this.recipient = recipient;
        this.parametersJson = parametersJson; this.status = CampaignRecipientStatus.PENDING;
    }
    public void queued() { this.status = CampaignRecipientStatus.QUEUED; }
    public void sent(String metaMessageId) { this.status = CampaignRecipientStatus.SENT; this.metaMessageId = metaMessageId; this.lastError = null; this.lastAttemptAt = Instant.now(); this.attempts++; }
    public void fail(String error) { this.status = CampaignRecipientStatus.FAILED; this.lastError = error; this.lastAttemptAt = Instant.now(); this.attempts++; }
    public Long getId() { return id; }
    public Long getCampaignId() { return campaignId; }
    public Long getTenantId() { return tenantId; }
    public String getRecipient() { return recipient; }
    public String getParametersJson() { return parametersJson; }
    public CampaignRecipientStatus getStatus() { return status; }
    public int getAttempts() { return attempts; }
}
