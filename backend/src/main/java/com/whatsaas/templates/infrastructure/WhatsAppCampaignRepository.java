package com.whatsaas.templates.infrastructure;

import com.whatsaas.templates.domain.CampaignStatus;
import com.whatsaas.templates.domain.WhatsAppCampaign;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppCampaignRepository extends JpaRepository<WhatsAppCampaign, Long> {
    Optional<WhatsAppCampaign> findByTenantIdAndId(Long tenantId, Long id);
    List<WhatsAppCampaign> findTop100ByTenantIdOrderByCreatedAtDesc(Long tenantId);
    List<WhatsAppCampaign> findTop100ByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(CampaignStatus status,
                                                                                                Instant now);
}
