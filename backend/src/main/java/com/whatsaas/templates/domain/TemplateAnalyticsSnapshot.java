package com.whatsaas.templates.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "whatsapp_template_analytics")
public class TemplateAnalyticsSnapshot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "template_id", nullable = false)
    private Long templateId;
    @Column(name = "accepted_count", nullable = false)
    private long acceptedCount;
    @Column(name = "failed_count", nullable = false)
    private long failedCount;
    @Column(name = "delivered_count", nullable = false)
    private long deliveredCount;
    @Column(name = "read_count", nullable = false)
    private long readCount;
    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TemplateAnalyticsSnapshot() {}
    public TemplateAnalyticsSnapshot(Long tenantId, Long templateId, long acceptedCount, long failedCount,
                                     long deliveredCount, long readCount, LocalDate snapshotDate) {
        this.tenantId = tenantId; this.templateId = templateId; this.acceptedCount = acceptedCount;
        this.failedCount = failedCount; this.deliveredCount = deliveredCount; this.readCount = readCount;
        this.snapshotDate = snapshotDate; this.createdAt = Instant.now();
    }
    public Long getTemplateId() { return templateId; }
    public long getAcceptedCount() { return acceptedCount; }
    public long getFailedCount() { return failedCount; }
    public long getDeliveredCount() { return deliveredCount; }
    public long getReadCount() { return readCount; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
}
