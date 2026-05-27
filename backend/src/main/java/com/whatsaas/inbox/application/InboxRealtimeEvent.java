package com.whatsaas.inbox.application;

import com.whatsaas.inbox.application.dto.ConversationResponse;
import com.whatsaas.inbox.application.dto.InboxMessageResponse;

public record InboxRealtimeEvent(Long tenantId, InboxEventType type, Long conversationId,
                                 ConversationResponse conversation, InboxMessageResponse message, Long actorId,
                                 Boolean typing, Long deletedMessageId) {
}
