package com.whatsaas.templates.infrastructure;

import com.whatsaas.templates.domain.CampaignRecipient;
import com.whatsaas.templates.domain.CampaignRecipientStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRecipientRepository extends JpaRepository<CampaignRecipient, Long> {
    List<CampaignRecipient> findByCampaignIdAndStatus(Long campaignId, CampaignRecipientStatus status);
    Optional<CampaignRecipient> findByTenantIdAndId(Long tenantId, Long id);
}
