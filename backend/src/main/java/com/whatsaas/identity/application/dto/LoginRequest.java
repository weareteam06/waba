package com.whatsaas.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
        @NotBlank @Pattern(regexp = "^[a-z0-9][a-z0-9-]{2,79}$") String tenantSlug,
        @NotBlank @Email String email,
        @NotBlank String password) {
}
