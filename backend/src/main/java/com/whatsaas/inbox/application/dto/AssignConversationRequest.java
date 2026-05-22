package com.whatsaas.inbox.application.dto;

import jakarta.validation.constraints.NotNull;

public record AssignConversationRequest(@NotNull Long agentId) {
}
