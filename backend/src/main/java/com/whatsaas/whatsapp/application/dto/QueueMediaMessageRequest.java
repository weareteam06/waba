package com.whatsaas.whatsapp.application.dto;

import com.whatsaas.whatsapp.domain.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record QueueMediaMessageRequest(
        @NotBlank @Size(max = 80) String phoneNumberId,
        @NotBlank @Pattern(regexp = "^\\+[1-9]\\d{7,14}$") String recipient,
        @NotNull MessageType type,
        @Size(max = 160) String mediaId,
        @Size(max = 2048) String link,
        @Size(max = 1024) String caption,
        @Size(max = 255) String filename) {
}
