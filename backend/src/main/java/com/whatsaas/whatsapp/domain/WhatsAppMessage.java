package com.whatsaas.whatsapp.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "whatsapp_messages")
public class WhatsAppMessage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "conversation_id")
    private Long conversationId;

    @Column(name = "requested_by")
    private Long requestedBy;

    @Column(name = "phone_number_id", nullable = false, length = 80)
    private String phoneNumberId;

    @Column(name = "recipient", nullable = false, length = 40)
    private String recipient;

    @Column(name = "body", nullable = false, length = 4096)
    private String body;

    @Column(name = "meta_message_id", unique = true, length = 160)
    private String metaMessageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MessageDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 32)
    private MessageType type;

    @Column(name = "media_id", length = 160)
    private String mediaId;

    @Column(name = "media_mime_type", length = 160)
    private String mediaMimeType;

    @Column(name = "media_sha256", length = 160)
    private String mediaSha256;

    @Column(name = "media_path", length = 512)
    private String mediaPath;

    @Column(name = "provider_payload", columnDefinition = "json")
    private String providerPayload;

    @Column(name = "last_error", length = 2048)
    private String lastError;

    @Column(name = "send_attempts", nullable = false)
    private int sendAttempts;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MessageStatus status;

    protected WhatsAppMessage() {
    }

    public WhatsAppMessage(Long tenantId, Long requestedBy, String phoneNumberId, String recipient, String body) {
        this.tenantId = tenantId;
        this.requestedBy = requestedBy;
        this.phoneNumberId = phoneNumberId;
        this.recipient = recipient;
        this.body = body;
        this.direction = MessageDirection.OUTBOUND;
        this.type = MessageType.TEXT;
        this.status = MessageStatus.QUEUED;
    }

    public static WhatsAppMessage outboundMedia(Long tenantId, Long requestedBy, String phoneNumberId,
                                                String recipient, MessageType type, String body, String mediaId,
                                                String providerPayload) {
        WhatsAppMessage message = new WhatsAppMessage(tenantId, requestedBy, phoneNumberId, recipient, body);
        message.type = type;
        message.mediaId = mediaId;
        message.providerPayload = providerPayload;
        return message;
    }

    public static WhatsAppMessage inbound(Long tenantId, String phoneNumberId, String sender, String metaMessageId,
                                          MessageType type, String body, String mediaId, String mimeType,
                                          String sha256, String providerPayload) {
        WhatsAppMessage message = new WhatsAppMessage();
        message.tenantId = tenantId;
        message.phoneNumberId = phoneNumberId;
        message.recipient = sender;
        message.metaMessageId = metaMessageId;
        message.direction = MessageDirection.INBOUND;
        message.type = type;
        message.body = body == null ? "" : body;
        message.mediaId = mediaId;
        message.mediaMimeType = mimeType;
        message.mediaSha256 = sha256;
        message.providerPayload = providerPayload;
        message.status = MessageStatus.RECEIVED;
        return message;
    }

    public void markSent(String metaMessageId) {
        this.metaMessageId = metaMessageId;
        this.status = MessageStatus.SENT;
        this.lastError = null;
    }

    public void markStatus(MessageStatus status) {
        this.status = status;
    }

    public void recordSendFailure(String error) {
        this.sendAttempts++;
        this.lastError = error;
        this.status = MessageStatus.FAILED;
    }

    public void startRetry() {
        this.status = MessageStatus.QUEUED;
    }

    public void storeDownloadedMedia(String path, String mimeType) {
        this.mediaPath = path;
        this.mediaMimeType = mimeType;
    }

    public Long getId() {
        return id;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void attachConversation(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public String getPhoneNumberId() {
        return phoneNumberId;
    }

    public String getRecipient() {
        return recipient;
    }

    public String getBody() {
        return body;
    }

    public String getMetaMessageId() {
        return metaMessageId;
    }

    public MessageDirection getDirection() {
        return direction;
    }

    public MessageType getType() {
        return type;
    }

    public String getMediaId() {
        return mediaId;
    }

    public String getProviderPayload() {
        return providerPayload;
    }

    public String getMediaMimeType() {
        return mediaMimeType;
    }

    public String getMediaPath() {
        return mediaPath;
    }

    public String getLastError() {
        return lastError;
    }

    public int getSendAttempts() {
        return sendAttempts;
    }

    public MessageStatus getStatus() {
        return status;
    }
}
