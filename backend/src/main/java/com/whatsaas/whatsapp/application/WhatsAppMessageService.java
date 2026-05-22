package com.whatsaas.whatsapp.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.common.audit.AuditService;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.security.CurrentPrincipal;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.whatsapp.application.dto.MessageResponse;
import com.whatsaas.whatsapp.application.dto.QueueMediaMessageRequest;
import com.whatsaas.whatsapp.application.dto.QueueMessageRequest;
import com.whatsaas.whatsapp.domain.MessageType;
import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import com.whatsaas.whatsapp.infrastructure.WhatsAppMessageRepository;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppMessageService {

    private final WhatsAppMessageRepository messageRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final WhatsAppAccountService accountService;
    private final ObjectMapper objectMapper;

    public WhatsAppMessageService(WhatsAppMessageRepository messageRepository, ApplicationEventPublisher eventPublisher,
                                  AuditService auditService, WhatsAppAccountService accountService,
                                  ObjectMapper objectMapper) {
        this.messageRepository = messageRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
        this.accountService = accountService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MessageResponse queue(QueueMessageRequest request) {
        Long tenantId = TenantContext.currentTenantId();
        Long userId = CurrentPrincipal.userIdOrNull();
        if (userId == null) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "USER_REQUIRED", "User context is missing.");
        }
        accountService.requireOutboundAccount(tenantId, request.phoneNumberId().trim());
        WhatsAppMessage message = messageRepository.save(new WhatsAppMessage(
                tenantId, userId, request.phoneNumberId().trim(), request.recipient().trim(), request.body()));
        eventPublisher.publishEvent(new MessageQueuedEvent(tenantId, message.getId()));
        auditService.record("MESSAGE_QUEUED", "WhatsAppMessage", message.getId(), "{}");
        return MessageResponse.from(message);
    }

    @Transactional
    public MessageResponse queueMedia(QueueMediaMessageRequest request) {
        if (request.type() == MessageType.TEXT || request.type() == MessageType.UNKNOWN) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "MEDIA_TYPE_INVALID",
                    "Media message type must be image, video, audio, document, or sticker.");
        }
        if (blank(request.mediaId()) == blank(request.link())) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "MEDIA_REFERENCE_INVALID",
                    "Provide exactly one media id or public media link.");
        }
        Long tenantId = TenantContext.currentTenantId();
        Long userId = CurrentPrincipal.userIdOrNull();
        if (userId == null) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "USER_REQUIRED", "User context is missing.");
        }
        accountService.requireOutboundAccount(tenantId, request.phoneNumberId().trim());
        String mediaPayload = mediaPayload(request);
        WhatsAppMessage message = messageRepository.save(WhatsAppMessage.outboundMedia(
                tenantId, userId, request.phoneNumberId().trim(), request.recipient().trim(), request.type(),
                request.caption() == null ? "" : request.caption().trim(), trimToNull(request.mediaId()), mediaPayload));
        eventPublisher.publishEvent(new MessageQueuedEvent(tenantId, message.getId()));
        auditService.record("MEDIA_MESSAGE_QUEUED", "WhatsAppMessage", message.getId(), "{}");
        return MessageResponse.from(message);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> latest() {
        return messageRepository.findTop100ByTenantIdOrderByCreatedAtDesc(TenantContext.currentTenantId()).stream()
                .map(MessageResponse::from)
                .toList();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private String mediaPayload(QueueMediaMessageRequest request) {
        Map<String, String> payload = new LinkedHashMap<>();
        put(payload, "id", request.mediaId());
        put(payload, "link", request.link());
        put(payload, "caption", request.caption());
        put(payload, "filename", request.filename());
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Media request could not be serialized.", ex);
        }
    }

    private void put(Map<String, String> payload, String key, String value) {
        if (!blank(value)) {
            payload.put(key, value.trim());
        }
    }
}
