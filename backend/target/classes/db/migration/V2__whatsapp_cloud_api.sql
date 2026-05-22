CREATE TABLE whatsapp_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    phone_number_id VARCHAR(80) NOT NULL,
    display_phone_number VARCHAR(80) NULL,
    active BIT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_whatsapp_accounts_phone (phone_number_id),
    KEY idx_whatsapp_accounts_tenant (tenant_id),
    CONSTRAINT fk_whatsapp_accounts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

ALTER TABLE whatsapp_messages
    MODIFY requested_by BIGINT NULL,
    ADD meta_message_id VARCHAR(160) NULL,
    ADD direction VARCHAR(32) NOT NULL DEFAULT 'OUTBOUND',
    ADD message_type VARCHAR(32) NOT NULL DEFAULT 'TEXT',
    ADD media_id VARCHAR(160) NULL,
    ADD media_mime_type VARCHAR(160) NULL,
    ADD media_sha256 VARCHAR(160) NULL,
    ADD media_path VARCHAR(512) NULL,
    ADD provider_payload JSON NULL,
    ADD last_error VARCHAR(2048) NULL,
    ADD send_attempts INT NOT NULL DEFAULT 0,
    ADD UNIQUE KEY uk_whatsapp_messages_meta_id (meta_message_id);
