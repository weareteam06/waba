package com.whatsaas.templates.infrastructure;

import com.whatsaas.templates.domain.TemplateAnalyticsSnapshot;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateAnalyticsRepository extends JpaRepository<TemplateAnalyticsSnapshot, Long> {
    List<TemplateAnalyticsSnapshot> findByTenantIdAndTemplateIdOrderBySnapshotDateDesc(Long tenantId, Long templateId);
    Optional<TemplateAnalyticsSnapshot> findByTemplateIdAndSnapshotDate(Long templateId, LocalDate snapshotDate);
}
