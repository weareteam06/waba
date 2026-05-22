package com.whatsaas.templates.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TemplateSyncRequest(@NotBlank @Size(max = 80) String phoneNumberId) {
}
