package com.whatsaas.inbox.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "inbox_conversations")
public class InboxConversation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "phone_number_id", nullable = false, length = 80)
    private String phoneNumberId;

    @Column(name = "contact_phone", nullable = false, length = 40)
    private String contactPhone;

    @Column(name = "contact_name", length = 180)
    private String contactName;

    @Column(name = "assigned_agent_id")
    private Long assignedAgentId;

    @Column(name = "unread_count", nullable = false)
    private int unreadCount;

    @Column(name = "last_message_at", nullable = false)
    private Instant lastMessageAt;

    @Column(name = "last_message_preview", nullable = false, length = 512)
    private String lastMessagePreview;

    protected InboxConversation() {
    }

    public InboxConversation(Long tenantId, String phoneNumberId, String contactPhone, String preview) {
        this.tenantId = tenantId;
        this.phoneNumberId = phoneNumberId;
        this.contactPhone = contactPhone;
        this.lastMessagePreview = preview;
        this.lastMessageAt = Instant.now();
    }

    public void receive(String preview, String contactName) {
        touch(preview);
        this.contactName = contactName == null || contactName.isBlank() ? this.contactName : contactName;
        this.unreadCount++;
    }

    public void rename(String contactName) {
        this.contactName = contactName == null || contactName.isBlank() ? this.contactName : contactName.trim();
    }

    public void send(String preview) {
        touch(preview);
    }

    public void restateLastMessage(String preview, Instant lastMessageAt) {
        this.lastMessageAt = lastMessageAt == null ? Instant.now() : lastMessageAt;
        this.lastMessagePreview = preview == null || preview.isBlank() ? "Media message" : preview.substring(0,
                Math.min(512, preview.length()));
    }

    public void clearMessages() {
        this.lastMessageAt = Instant.now();
        this.lastMessagePreview = "No messages";
        this.unreadCount = 0;
    }

    public void markRead() {
        this.unreadCount = 0;
    }

    public void assign(Long agentId) {
        this.assignedAgentId = agentId;
    }

    private void touch(String preview) {
        this.lastMessageAt = Instant.now();
        this.lastMessagePreview = preview == null || preview.isBlank() ? "Media message" : preview.substring(0,
                Math.min(512, preview.length()));
    }

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public String getPhoneNumberId() { return phoneNumberId; }
    public String getContactPhone() { return contactPhone; }
    public String getContactName() { return contactName; }
    public Long getAssignedAgentId() { return assignedAgentId; }
    public int getUnreadCount() { return unreadCount; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public String getLastMessagePreview() { return lastMessagePreview; }
}
