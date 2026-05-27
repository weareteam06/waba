package com.whatsaas.inbox.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StartConversationRequest(
        @NotBlank @Size(max = 80) String phoneNumberId,
        @NotBlank @Size(max = 40) String recipient,
        @Size(max = 180) String contactName,
        @Size(max = 80) String clientMessageId,
        @NotBlank @Size(max = 4096) String body) {
}
