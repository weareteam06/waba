package com.whatsaas.whatsapp.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.whatsapp.domain.MessageStatus;
import com.whatsaas.whatsapp.domain.MessageType;
import com.whatsaas.whatsapp.domain.WhatsAppAccount;
import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import com.whatsaas.whatsapp.infrastructure.WhatsAppAccountRepository;
import com.whatsaas.whatsapp.infrastructure.WhatsAppMediaDownloadService;
import com.whatsaas.whatsapp.infrastructure.WhatsAppMessageRepository;
import com.whatsaas.inbox.application.InboxConversationWriter;
import com.whatsaas.automation.application.WorkflowTriggerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class WhatsAppWebhookProcessor {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookProcessor.class);

    private final ObjectMapper objectMapper;
    private final WhatsAppAccountRepository accountRepository;
    private final WhatsAppMessageRepository messageRepository;
    private final WhatsAppMediaDownloadService mediaDownloadService;
    private final InboxConversationWriter inboxConversationWriter;
    private final WorkflowTriggerService workflowTriggerService;

    public WhatsAppWebhookProcessor(ObjectMapper objectMapper, WhatsAppAccountRepository accountRepository,
                                    WhatsAppMessageRepository messageRepository,
                                    WhatsAppMediaDownloadService mediaDownloadService,
                                    InboxConversationWriter inboxConversationWriter,
                                    WorkflowTriggerService workflowTriggerService) {
        this.objectMapper = objectMapper;
        this.accountRepository = accountRepository;
        this.messageRepository = messageRepository;
        this.mediaDownloadService = mediaDownloadService;
        this.inboxConversationWriter = inboxConversationWriter;
        this.workflowTriggerService = workflowTriggerService;
    }

    @RabbitListener(queues = "${app.messaging.webhook-queue}")
    @Transactional
    public void process(WebhookPayloadEvent event) throws Exception {
        JsonNode payload = objectMapper.readTree(event.rawBody());
        for (JsonNode entry : payload.path("entry")) {
            for (JsonNode change : entry.path("changes")) {
                JsonNode value = change.path("value");
                String phoneNumberId = value.path("metadata").path("phone_number_id").asText(null);
                if (phoneNumberId == null) {
                    continue;
                }
                WhatsAppAccount account = accountRepository.findByPhoneNumberIdAndActiveTrue(phoneNumberId)
                        .orElse(null);
                if (account == null) {
                    log.warn("Ignoring WhatsApp webhook for unregistered phone number id {}", phoneNumberId);
                    continue;
                }
                log.info("Processing WhatsApp webhook for tenant {} phoneNumberId {}", account.getTenantId(),
                        phoneNumberId);
                receiveMessages(account, phoneNumberId, value.path("contacts"), value.path("messages"));
                receiveStatuses(value.path("statuses"));
            }
        }
    }

    private void receiveMessages(WhatsAppAccount account, String phoneNumberId, JsonNode contacts, JsonNode messages)
            throws Exception {
        for (JsonNode node : messages) {
            String metaMessageId = node.path("id").asText(null);
            if (metaMessageId == null || messageRepository.existsByMetaMessageId(metaMessageId)) {
                continue;
            }
            MessageType type = type(node.path("type").asText());
            JsonNode media = node.path(type.name().toLowerCase());
            WhatsAppMessage message = WhatsAppMessage.inbound(
                    account.getTenantId(),
                    phoneNumberId,
                    node.path("from").asText(),
                    metaMessageId,
                    type,
                    body(node, type),
                    text(media, "id"),
                    text(media, "mime_type"),
                    text(media, "sha256"),
                    objectMapper.writeValueAsString(node));
            messageRepository.save(message);
            if (message.getMediaId() != null) {
                mediaDownloadService.downloadInboundMedia(message);
            }
            inboxConversationWriter.receive(message, contactName(contacts, message.getRecipient()));
            log.info("Stored inbound WhatsApp message {} from {} type {} for tenant {}",
                    metaMessageId, message.getRecipient(), message.getType(), account.getTenantId());
            workflowTriggerService.inbound(message);
        }
    }

    private void receiveStatuses(JsonNode statuses) {
        for (JsonNode node : statuses) {
            String metaMessageId = node.path("id").asText(null);
            if (metaMessageId == null) {
                continue;
            }
            messageRepository.findByMetaMessageId(metaMessageId)
                    .ifPresent(message -> {
                        message.markStatus(status(node.path("status").asText()));
                        inboxConversationWriter.statusChanged(message);
                        log.info("Updated WhatsApp message {} status to {}", metaMessageId, message.getStatus());
                    });
        }
    }

    private String body(JsonNode node, MessageType type) {
        if (type == MessageType.TEXT) {
            return node.path("text").path("body").asText("");
        }
        return node.path(type.name().toLowerCase()).path("caption").asText("");
    }

    private String text(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.path(field).asText() : null;
    }

    private MessageType type(String value) {
        try {
            return MessageType.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            return MessageType.UNKNOWN;
        }
    }

    private MessageStatus status(String value) {
        return switch (value) {
            case "sent" -> MessageStatus.SENT;
            case "delivered" -> MessageStatus.DELIVERED;
            case "read" -> MessageStatus.READ;
            case "failed" -> MessageStatus.FAILED;
            default -> MessageStatus.SENT;
        };
    }

    private String contactName(JsonNode contacts, String phone) {
        for (JsonNode contact : contacts) {
            if (phone.equals(contact.path("wa_id").asText())) {
                return contact.path("profile").path("name").asText(null);
            }
        }
        return null;
    }
}
