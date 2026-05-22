package com.whatsaas.inbox.application.dto;

import java.util.List;

public record MessagePageResponse(List<InboxMessageResponse> items, boolean hasMore, int nextPage) {
}
