package com.whatsaas.templates.application.dto;

import com.whatsaas.templates.domain.TemplateAnalyticsSnapshot;
import java.time.LocalDate;

public record TemplateAnalyticsResponse(LocalDate snapshotDate, long accepted, long failed, long delivered, long read) {
    public static TemplateAnalyticsResponse from(TemplateAnalyticsSnapshot snapshot) {
        return new TemplateAnalyticsResponse(snapshot.getSnapshotDate(), snapshot.getAcceptedCount(),
                snapshot.getFailedCount(), snapshot.getDeliveredCount(), snapshot.getReadCount());
    }
}
