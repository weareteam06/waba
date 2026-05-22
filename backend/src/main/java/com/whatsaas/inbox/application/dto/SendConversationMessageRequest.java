package com.whatsaas.inbox.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendConversationMessageRequest(@Size(max = 80) String clientMessageId,
                                             @NotBlank @Size(max = 4096) String body) {
}
