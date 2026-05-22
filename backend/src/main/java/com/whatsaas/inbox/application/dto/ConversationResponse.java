package com.whatsaas.inbox.application.dto;

import com.whatsaas.inbox.domain.InboxConversation;
import java.time.Instant;

public record ConversationResponse(Long id, String phoneNumberId, String contactPhone, String contactName,
                                   Long assignedAgentId, int unreadCount, Instant lastMessageAt,
                                   String lastMessagePreview) {

    public static ConversationResponse from(InboxConversation conversation) {
        return new ConversationResponse(conversation.getId(), conversation.getPhoneNumberId(),
                conversation.getContactPhone(), conversation.getContactName(), conversation.getAssignedAgentId(),
                conversation.getUnreadCount(), conversation.getLastMessageAt(), conversation.getLastMessagePreview());
    }
}
