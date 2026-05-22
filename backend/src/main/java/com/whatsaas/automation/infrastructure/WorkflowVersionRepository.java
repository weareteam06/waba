package com.whatsaas.automation.infrastructure;
import com.whatsaas.automation.domain.WorkflowVersion; import java.util.List; import java.util.Optional; import org.springframework.data.jpa.repository.JpaRepository;
public interface WorkflowVersionRepository extends JpaRepository<WorkflowVersion,Long>{Optional<WorkflowVersion> findByTenantIdAndId(Long tenantId,Long id);Optional<WorkflowVersion> findByTenantIdAndWorkflowIdAndVersion(Long tenantId,Long workflowId,int version);List<WorkflowVersion> findByTenantIdAndWorkflowIdOrderByVersionDesc(Long tenantId,Long workflowId);}
