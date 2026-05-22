package com.whatsaas.automation.application.dto;
import com.whatsaas.automation.domain.WorkflowStep; import java.time.Instant;
public record WorkflowStepResponse(String nodeId,String nodeType,String status,String errorMessage,Instant startedAt){public static WorkflowStepResponse from(WorkflowStep s){return new WorkflowStepResponse(s.getNodeId(),s.getNodeType(),s.getStatus().name(),s.getErrorMessage(),s.getStartedAt());}}
