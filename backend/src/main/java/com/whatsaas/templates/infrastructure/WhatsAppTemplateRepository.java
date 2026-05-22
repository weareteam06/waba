package com.whatsaas.templates.infrastructure;

import com.whatsaas.templates.domain.TemplateApprovalStatus;
import com.whatsaas.templates.domain.TemplateCategory;
import com.whatsaas.templates.domain.WhatsAppTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppTemplateRepository extends JpaRepository<WhatsAppTemplate, Long> {
    Optional<WhatsAppTemplate> findByTenantIdAndId(Long tenantId, Long id);
    Optional<WhatsAppTemplate> findByTenantIdAndWabaIdAndNameAndLanguage(Long tenantId, String wabaId, String name,
                                                                          String language);
    List<WhatsAppTemplate> findByTenantIdAndCategoryAndApprovalStatusOrderByUpdatedAtDesc(Long tenantId,
                                                                                            TemplateCategory category,
                                                                                            TemplateApprovalStatus status);
    List<WhatsAppTemplate> findByTenantIdOrderByUpdatedAtDesc(Long tenantId);
}
