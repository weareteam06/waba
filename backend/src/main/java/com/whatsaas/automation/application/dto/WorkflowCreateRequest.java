package com.whatsaas.automation.application.dto;
import com.fasterxml.jackson.databind.JsonNode; import jakarta.validation.constraints.*;
public record WorkflowCreateRequest(@NotBlank @Size(max=180) String name,@Size(max=512) String description,@NotNull JsonNode graph){}
