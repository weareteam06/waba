package com.whatsaas.automation.application.dto;
import com.whatsaas.automation.domain.WorkflowExecution; import java.time.Instant;
public record WorkflowExecutionResponse(Long id,Long workflowId,Long versionId,String triggerType,String status,String currentNodeId,int attempts,String lastError,Instant startedAt){public static WorkflowExecutionResponse from(WorkflowExecution e){return new WorkflowExecutionResponse(e.getId(),e.getWorkflowId(),e.getVersionId(),e.getTriggerType(),e.getStatus().name(),e.getCurrentNodeId(),e.getAttempts(),e.getLastError(),e.getStartedAt());}}
