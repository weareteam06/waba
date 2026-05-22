package com.whatsaas.automation.application.dto;
import com.fasterxml.jackson.databind.JsonNode; import jakarta.validation.constraints.NotNull;
public record WorkflowGraphRequest(@NotNull JsonNode graph) {}
