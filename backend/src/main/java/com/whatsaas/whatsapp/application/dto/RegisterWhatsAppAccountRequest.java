package com.whatsaas.whatsapp.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterWhatsAppAccountRequest(
        @NotBlank @Size(max = 80) String phoneNumberId,
        @NotBlank @Size(max = 80) String wabaId,
        @Size(max = 80) String displayPhoneNumber) {
}
