package com.whatsaas.templates.application.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.whatsaas.templates.domain.TemplateCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TemplateUpsertRequest(
        @NotBlank @Size(max = 80) String phoneNumberId,
        @NotBlank @Pattern(regexp = "^[a-z0-9_]{1,512}$") String name,
        @NotBlank @Size(max = 32) String language,
        @NotNull TemplateCategory category,
        @NotNull JsonNode components) {
}
