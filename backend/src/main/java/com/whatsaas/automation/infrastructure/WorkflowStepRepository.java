package com.whatsaas.automation.infrastructure;
import com.whatsaas.automation.domain.WorkflowStep; import java.util.List; import org.springframework.data.jpa.repository.JpaRepository;
public interface WorkflowStepRepository extends JpaRepository<WorkflowStep,Long>{List<WorkflowStep> findByExecutionIdOrderByStartedAtAsc(Long executionId);}
