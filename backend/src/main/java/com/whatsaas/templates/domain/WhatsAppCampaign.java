package com.whatsaas.templates.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "whatsapp_campaigns")
public class WhatsAppCampaign extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "template_id", nullable = false)
    private Long templateId;
    @Column(name = "phone_number_id", nullable = false, length = 80)
    private String phoneNumberId;
    @Column(nullable = false, length = 180)
    private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private CampaignStatus status;
    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;
    @Column(name = "started_at")
    private Instant startedAt;
    @Column(name = "completed_at")
    private Instant completedAt;
    @Column(name = "total_recipients", nullable = false)
    private int totalRecipients;
    @Column(name = "queued_count", nullable = false)
    private int queuedCount;
    @Column(name = "sent_count", nullable = false)
    private int sentCount;
    @Column(name = "failed_count", nullable = false)
    private int failedCount;

    protected WhatsAppCampaign() {}
    public WhatsAppCampaign(Long tenantId, Long templateId, String phoneNumberId, String name, Instant scheduledAt,
                            int totalRecipients) {
        this.tenantId = tenantId; this.templateId = templateId; this.phoneNumberId = phoneNumberId; this.name = name;
        this.scheduledAt = scheduledAt; this.totalRecipients = totalRecipients; this.status = CampaignStatus.SCHEDULED;
    }
    public void startQueueing() { this.status = CampaignStatus.QUEUING; this.startedAt = Instant.now(); }
    public void queued() { this.queuedCount++; this.status = CampaignStatus.RUNNING; }
    public void sent() { this.sentCount++; completeIfDone(); }
    public void failed() { this.failedCount++; completeIfDone(); }
    private void completeIfDone() {
        if (sentCount + failedCount >= totalRecipients) { this.status = CampaignStatus.COMPLETED; this.completedAt = Instant.now(); }
    }
    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public Long getTemplateId() { return templateId; }
    public String getPhoneNumberId() { return phoneNumberId; }
    public String getName() { return name; }
    public CampaignStatus getStatus() { return status; }
    public Instant getScheduledAt() { return scheduledAt; }
    public int getTotalRecipients() { return totalRecipients; }
    public int getQueuedCount() { return queuedCount; }
    public int getSentCount() { return sentCount; }
    public int getFailedCount() { return failedCount; }
}
