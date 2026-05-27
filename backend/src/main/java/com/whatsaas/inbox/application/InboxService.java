package com.whatsaas.inbox.application;

import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.security.CurrentPrincipal;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.identity.infrastructure.UserRepository;
import com.whatsaas.inbox.application.dto.AssignConversationRequest;
import com.whatsaas.inbox.application.dto.ConversationFilter;
import com.whatsaas.inbox.application.dto.ConversationPageResponse;
import com.whatsaas.inbox.application.dto.ConversationResponse;
import com.whatsaas.inbox.application.dto.InboxMessageResponse;
import com.whatsaas.inbox.application.dto.MessagePageResponse;
import com.whatsaas.inbox.application.dto.SendConversationMessageRequest;
import com.whatsaas.inbox.application.dto.StartConversationRequest;
import com.whatsaas.inbox.application.dto.StartConversationResponse;
import com.whatsaas.inbox.domain.InboxConversation;
import com.whatsaas.inbox.infrastructure.InboxConversationRepository;
import com.whatsaas.whatsapp.application.WhatsAppAccountService;
import com.whatsaas.whatsapp.application.MessageQueuedEvent;
import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import com.whatsaas.whatsapp.infrastructure.WhatsAppMessageRepository;
import java.util.Collections;
import java.util.ArrayList;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InboxService {

    private final InboxConversationRepository conversationRepository;
    private final WhatsAppMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final WhatsAppAccountService accountService;
    private final InboxRealtimePublisher realtimePublisher;
    private final ApplicationEventPublisher eventPublisher;

    public InboxService(InboxConversationRepository conversationRepository, WhatsAppMessageRepository messageRepository,
                        UserRepository userRepository, WhatsAppAccountService accountService,
                        InboxRealtimePublisher realtimePublisher, ApplicationEventPublisher eventPublisher) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.accountService = accountService;
        this.realtimePublisher = realtimePublisher;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public ConversationPageResponse conversations(ConversationFilter filter, String query, int page, int size) {
        Long tenantId = TenantContext.currentTenantId();
        PageRequest pageable = PageRequest.of(limitPage(page), limitSize(size));
        Page<InboxConversation> results;
        if (query != null && !query.isBlank()) {
            results = conversationRepository.findByTenantIdAndContactPhoneContainingIgnoreCaseOrderByLastMessageAtDesc(
                    tenantId, query.trim(), pageable);
        } else {
            results = switch (filter == null ? ConversationFilter.ALL : filter) {
                case UNREAD -> conversationRepository.findByTenantIdAndUnreadCountGreaterThanOrderByLastMessageAtDesc(
                        tenantId, 0, pageable);
                case ASSIGNED_TO_ME -> conversationRepository.findByTenantIdAndAssignedAgentIdOrderByLastMessageAtDesc(
                        tenantId, userId(), pageable);
                case UNASSIGNED -> conversationRepository.findByTenantIdAndAssignedAgentIdIsNullOrderByLastMessageAtDesc(
                        tenantId, pageable);
                case ALL -> conversationRepository.findByTenantIdOrderByLastMessageAtDesc(tenantId, pageable);
            };
        }
        return new ConversationPageResponse(results.map(ConversationResponse::from).getContent(), results.hasNext(),
                results.getNumber() + 1);
    }

    @Transactional(readOnly = true)
    public MessagePageResponse messages(Long conversationId, int page, int size) {
        InboxConversation conversation = conversation(conversationId);
        Page<WhatsAppMessage> results = messageRepository.findByTenantIdAndConversationIdOrderByCreatedAtDesc(
                conversation.getTenantId(), conversation.getId(), PageRequest.of(limitPage(page), limitSize(size)));
        var items = new ArrayList<>(results.map(InboxMessageResponse::from).getContent());
        Collections.reverse(items);
        return new MessagePageResponse(items, results.hasNext(), results.getNumber() + 1);
    }

    @Transactional
    public InboxMessageResponse send(Long conversationId, SendConversationMessageRequest request) {
        InboxConversation conversation = conversation(conversationId);
        WhatsAppMessage message = messageRepository.save(new WhatsAppMessage(conversation.getTenantId(), userId(),
                conversation.getPhoneNumberId(), conversation.getContactPhone(), request.body().trim()));
        message.attachConversation(conversation.getId());
        conversation.send(request.body());
        eventPublisher.publishEvent(new MessageQueuedEvent(conversation.getTenantId(), message.getId()));
        ConversationResponse conversationResponse = ConversationResponse.from(conversation);
        InboxMessageResponse response = new InboxMessageResponse(message.getId(), conversation.getId(),
                request.clientMessageId(), message.getMetaMessageId(), message.getDirection().name(),
                message.getType().name(), message.getBody(), message.getStatus().name(), message.getMediaMimeType(),
                message.getMediaPath() == null ? null : "/api/v1/inbox/messages/" + message.getId() + "/media",
                message.getSendAttempts(), message.getLastError(), message.getCreatedAt());
        realtimePublisher.publish(new InboxRealtimeEvent(conversation.getTenantId(), InboxEventType.MESSAGE_CREATED,
                conversation.getId(), conversationResponse, response, userId(), null, null));
        return response;
    }

    @Transactional
    public StartConversationResponse start(StartConversationRequest request) {
        Long tenantId = TenantContext.currentTenantId();
        Long actorId = userId();
        String phoneNumberId = request.phoneNumberId().trim();
        String recipient = normalizePhone(request.recipient());
        String body = request.body().trim();

        accountService.requireOutboundAccount(tenantId, phoneNumberId);
        InboxConversation conversation = conversationRepository
                .findByTenantIdAndPhoneNumberIdAndContactPhone(tenantId, phoneNumberId, recipient)
                .orElseGet(() -> conversationRepository.save(new InboxConversation(tenantId, phoneNumberId, recipient,
                        body)));
        conversation.rename(request.contactName());

        WhatsAppMessage message = messageRepository.save(new WhatsAppMessage(tenantId, actorId, phoneNumberId,
                recipient, body));
        message.attachConversation(conversation.getId());
        conversation.send(body);

        eventPublisher.publishEvent(new MessageQueuedEvent(tenantId, message.getId()));
        ConversationResponse conversationResponse = ConversationResponse.from(conversation);
        InboxMessageResponse messageResponse = messageResponse(message, conversation.getId(), request.clientMessageId());
        realtimePublisher.publish(new InboxRealtimeEvent(tenantId, InboxEventType.MESSAGE_CREATED, conversation.getId(),
                conversationResponse, messageResponse, actorId, null, null));
        return new StartConversationResponse(conversationResponse, messageResponse);
    }

    @Transactional
    public ConversationResponse assign(Long conversationId, AssignConversationRequest request) {
        InboxConversation conversation = conversation(conversationId);
        userRepository.findByTenantIdAndId(conversation.getTenantId(), request.agentId())
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "AGENT_NOT_FOUND", "Agent not found."));
        conversation.assign(request.agentId());
        ConversationResponse response = ConversationResponse.from(conversation);
        realtimePublisher.publish(new InboxRealtimeEvent(conversation.getTenantId(), InboxEventType.CONVERSATION_CHANGED,
                conversation.getId(), response, null, userId(), null, null));
        return response;
    }

    @Transactional
    public ConversationResponse markRead(Long conversationId) {
        InboxConversation conversation = conversation(conversationId);
        conversation.markRead();
        ConversationResponse response = ConversationResponse.from(conversation);
        realtimePublisher.publish(new InboxRealtimeEvent(conversation.getTenantId(), InboxEventType.CONVERSATION_CHANGED,
                conversation.getId(), response, null, userId(), null, null));
        return response;
    }

    @Transactional
    public void delete(Long conversationId) {
        InboxConversation conversation = conversation(conversationId);
        Long tenantId = conversation.getTenantId();
        messageRepository.deleteByTenantIdAndConversationId(tenantId, conversation.getId());
        conversationRepository.delete(conversation);
        realtimePublisher.publish(new InboxRealtimeEvent(tenantId, InboxEventType.CONVERSATION_DELETED,
                conversationId, null, null, userId(), null, null));
    }

    @Transactional
    public void deleteMessage(Long conversationId, Long messageId) {
        InboxConversation conversation = conversation(conversationId);
        WhatsAppMessage message = messageRepository.findByTenantIdAndId(conversation.getTenantId(), messageId)
                .filter(candidate -> conversation.getId().equals(candidate.getConversationId()))
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "MESSAGE_NOT_FOUND",
                        "Message not found."));
        messageRepository.delete(message);
        messageRepository.findFirstByTenantIdAndConversationIdOrderByCreatedAtDesc(conversation.getTenantId(),
                conversation.getId()).ifPresentOrElse(
                latest -> conversation.restateLastMessage(preview(latest), latest.getCreatedAt()),
                conversation::clearMessages);
        ConversationResponse response = ConversationResponse.from(conversation);
        realtimePublisher.publish(new InboxRealtimeEvent(conversation.getTenantId(), InboxEventType.MESSAGE_DELETED,
                conversation.getId(), response, null, userId(), null, messageId));
    }

    public void typing(Long conversationId, boolean typing) {
        InboxConversation conversation = conversation(conversationId);
        realtimePublisher.publish(new InboxRealtimeEvent(conversation.getTenantId(), InboxEventType.TYPING_CHANGED,
                conversation.getId(), null, null, userId(), typing, null));
    }

    @Transactional(readOnly = true)
    public Resource media(Long messageId) {
        WhatsAppMessage message = messageRepository.findById(messageId)
                .filter(candidate -> candidate.getTenantId().equals(TenantContext.currentTenantId()))
                .filter(candidate -> candidate.getMediaPath() != null)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "MEDIA_NOT_FOUND", "Media not found."));
        Path path = Path.of(message.getMediaPath()).normalize();
        if (!Files.isRegularFile(path)) {
            throw new DomainException(HttpStatus.NOT_FOUND, "MEDIA_NOT_FOUND", "Media file not found.");
        }
        return new FileSystemResource(path);
    }

    @Transactional(readOnly = true)
    public String mediaContentType(Long messageId) {
        return messageRepository.findById(messageId)
                .filter(candidate -> candidate.getTenantId().equals(TenantContext.currentTenantId()))
                .map(WhatsAppMessage::getMediaMimeType)
                .orElse("application/octet-stream");
    }

    private InboxConversation conversation(Long id) {
        return conversationRepository.findByTenantIdAndId(TenantContext.currentTenantId(), id)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND",
                        "Conversation not found."));
    }

    private Long userId() {
        Long userId = CurrentPrincipal.userIdOrNull();
        if (userId == null) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "USER_REQUIRED", "User context is missing.");
        }
        return userId;
    }

    private InboxMessageResponse messageResponse(WhatsAppMessage message, Long conversationId, String clientMessageId) {
        return new InboxMessageResponse(message.getId(), conversationId, clientMessageId, message.getMetaMessageId(),
                message.getDirection().name(), message.getType().name(), message.getBody(), message.getStatus().name(),
                message.getMediaMimeType(),
                message.getMediaPath() == null ? null : "/api/v1/inbox/messages/" + message.getId() + "/media",
                message.getSendAttempts(), message.getLastError(), message.getCreatedAt());
    }

    private String preview(WhatsAppMessage message) {
        return message.getBody() == null || message.getBody().isBlank() ? message.getType().name() + " message"
                : message.getBody();
    }

    private String normalizePhone(String recipient) {
        String normalized = recipient.trim().replaceAll("[^0-9]", "");
        if (normalized.isBlank()) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "RECIPIENT_REQUIRED", "Recipient phone number is required.");
        }
        return normalized;
    }

    private int limitPage(int page) {
        return Math.max(0, page);
    }

    private int limitSize(int size) {
        return Math.min(100, Math.max(1, size));
    }
}
