package com.whatsaas.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterTenantRequest(
        @NotBlank @Pattern(regexp = "^[a-z0-9][a-z0-9-]{2,79}$") String tenantSlug,
        @NotBlank @Size(max = 180) String tenantName,
        @NotBlank @Size(max = 180) String adminName,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 12, max = 72) String password) {
}
