package com.whatsaas.whatsapp.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record QueueMessageRequest(
        @NotBlank @Size(max = 80) String phoneNumberId,
        @NotBlank @Pattern(regexp = "^\\+[1-9]\\d{7,14}$") String recipient,
        @NotBlank @Size(max = 4096) String body) {
}
