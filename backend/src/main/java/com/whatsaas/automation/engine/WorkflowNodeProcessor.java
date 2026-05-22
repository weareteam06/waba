package com.whatsaas.automation.engine;
import com.fasterxml.jackson.databind.JsonNode; import com.whatsaas.automation.domain.WorkflowExecution;
public interface WorkflowNodeProcessor {String type(); NodeResult process(WorkflowExecution execution, JsonNode node, JsonNode context) throws Exception;}
