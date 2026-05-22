CREATE TABLE inbox_conversations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    phone_number_id VARCHAR(80) NOT NULL,
    contact_phone VARCHAR(40) NOT NULL,
    contact_name VARCHAR(180) NULL,
    assigned_agent_id BIGINT NULL,
    unread_count INT NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP(6) NOT NULL,
    last_message_preview VARCHAR(512) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_inbox_conversation_contact (tenant_id, phone_number_id, contact_phone),
    KEY idx_inbox_conversation_last_message (tenant_id, last_message_at),
    KEY idx_inbox_conversation_assignment (tenant_id, assigned_agent_id, last_message_at),
    CONSTRAINT fk_inbox_conversation_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_inbox_conversation_agent FOREIGN KEY (assigned_agent_id) REFERENCES users (id)
);

ALTER TABLE whatsapp_messages
    ADD conversation_id BIGINT NULL,
    ADD KEY idx_whatsapp_messages_conversation_created (conversation_id, created_at),
    ADD CONSTRAINT fk_whatsapp_messages_conversation FOREIGN KEY (conversation_id) REFERENCES inbox_conversations (id);
