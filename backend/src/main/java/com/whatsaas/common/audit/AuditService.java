package com.whatsaas.common.audit;

import com.whatsaas.common.security.CurrentPrincipal;
import com.whatsaas.common.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(String action, String entityType, Object entityId, String metadataJson) {
        record(TenantContext.currentTenantIdOrNull(), CurrentPrincipal.userIdOrNull(), action, entityType, entityId,
                metadataJson);
    }

    @Transactional
    public void record(Long tenantId, Long actorId, String action, String entityType, Object entityId,
                       String metadataJson) {
        auditLogRepository.save(new AuditLog(tenantId, actorId, action, entityType, String.valueOf(entityId),
                metadataJson));
    }
}
