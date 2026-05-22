package com.whatsaas.automation.application.dto;
import com.whatsaas.automation.domain.AutomationWorkflow;
public record WorkflowResponse(Long id,String name,String description,int draftVersion,Long publishedVersionId,boolean active){public static WorkflowResponse from(AutomationWorkflow w){return new WorkflowResponse(w.getId(),w.getName(),w.getDescription(),w.getDraftVersion(),w.getPublishedVersionId(),w.isActive());}}
