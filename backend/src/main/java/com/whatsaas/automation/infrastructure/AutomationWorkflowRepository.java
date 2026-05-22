package com.whatsaas.automation.infrastructure;
import com.whatsaas.automation.domain.AutomationWorkflow; import java.util.List; import java.util.Optional; import org.springframework.data.jpa.repository.JpaRepository;
public interface AutomationWorkflowRepository extends JpaRepository<AutomationWorkflow,Long>{Optional<AutomationWorkflow> findByTenantIdAndId(Long tenantId,Long id);List<AutomationWorkflow> findByTenantIdOrderByUpdatedAtDesc(Long tenantId);List<AutomationWorkflow> findByTenantIdAndActiveTrue(Long tenantId);}
