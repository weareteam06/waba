package com.whatsaas.inbox.application.dto;

import java.util.List;

public record ConversationPageResponse(List<ConversationResponse> items, boolean hasMore, int nextPage) {
}
