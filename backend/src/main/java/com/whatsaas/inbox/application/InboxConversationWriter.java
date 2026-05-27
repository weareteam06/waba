package com.whatsaas.inbox.application;

import com.whatsaas.inbox.application.dto.ConversationResponse;
import com.whatsaas.inbox.application.dto.InboxMessageResponse;
import com.whatsaas.inbox.domain.InboxConversation;
import com.whatsaas.inbox.infrastructure.InboxConversationRepository;
import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InboxConversationWriter {

    private final InboxConversationRepository conversationRepository;
    private final InboxRealtimePublisher realtimePublisher;

    public InboxConversationWriter(InboxConversationRepository conversationRepository,
                                   InboxRealtimePublisher realtimePublisher) {
        this.conversationRepository = conversationRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional
    public void receive(WhatsAppMessage message, String contactName) {
        String contactPhone = normalizePhone(message.getRecipient());
        InboxConversation conversation = findConversation(message, contactPhone)
                .orElseGet(() -> conversationRepository.save(new InboxConversation(message.getTenantId(),
                        message.getPhoneNumberId(), contactPhone, preview(message))));
        conversation.receive(preview(message), contactName);
        message.attachConversation(conversation.getId());
        realtimePublisher.publish(new InboxRealtimeEvent(message.getTenantId(), InboxEventType.MESSAGE_CREATED,
                conversation.getId(), ConversationResponse.from(conversation), InboxMessageResponse.from(message), null,
                null, null));
    }

    @Transactional
    public void statusChanged(WhatsAppMessage message) {
        if (message.getConversationId() != null) {
            realtimePublisher.publish(new InboxRealtimeEvent(message.getTenantId(), InboxEventType.MESSAGE_STATUS_CHANGED,
                    message.getConversationId(), null, InboxMessageResponse.from(message), null, null, null));
        }
    }

    private String preview(WhatsAppMessage message) {
        return message.getBody() == null || message.getBody().isBlank() ? message.getType().name() + " message"
                : message.getBody();
    }

    private Optional<InboxConversation> findConversation(WhatsAppMessage message, String contactPhone) {
        Optional<InboxConversation> exact = conversationRepository.findByTenantIdAndPhoneNumberIdAndContactPhone(
                message.getTenantId(), message.getPhoneNumberId(), contactPhone);
        if (exact.isPresent()) {
            return exact;
        }
        return conversationRepository.findByTenantIdAndPhoneNumberIdAndContactPhone(message.getTenantId(),
                message.getPhoneNumberId(), "+" + contactPhone);
    }

    private String normalizePhone(String value) {
        return value == null ? "" : value.replaceAll("[^0-9]", "");
    }
}
