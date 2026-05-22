package com.whatsaas.automation.application.dto;
import com.whatsaas.automation.domain.WorkflowVersion; import java.time.Instant;
public record WorkflowVersionResponse(Long id,Long workflowId,int version,String graphJson,Instant publishedAt){public static WorkflowVersionResponse from(WorkflowVersion v){return new WorkflowVersionResponse(v.getId(),v.getWorkflowId(),v.getVersion(),v.getGraphJson(),v.getPublishedAt());}}
