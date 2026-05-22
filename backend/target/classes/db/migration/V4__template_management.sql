ALTER TABLE whatsapp_accounts
    ADD waba_id VARCHAR(80) NULL,
    ADD KEY idx_whatsapp_accounts_waba (tenant_id, waba_id);

CREATE TABLE whatsapp_templates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    waba_id VARCHAR(80) NOT NULL,
    meta_template_id VARCHAR(120) NULL,
    name VARCHAR(512) NOT NULL,
    language VARCHAR(32) NOT NULL,
    category VARCHAR(40) NOT NULL,
    approval_status VARCHAR(40) NOT NULL,
    components_json JSON NOT NULL,
    synced_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_whatsapp_template_locale (tenant_id, waba_id, name, language),
    UNIQUE KEY uk_whatsapp_template_meta (meta_template_id),
    KEY idx_whatsapp_template_status (tenant_id, approval_status, category),
    CONSTRAINT fk_whatsapp_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE TABLE whatsapp_template_analytics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    accepted_count BIGINT NOT NULL DEFAULT 0,
    failed_count BIGINT NOT NULL DEFAULT 0,
    delivered_count BIGINT NOT NULL DEFAULT 0,
    read_count BIGINT NOT NULL DEFAULT 0,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_whatsapp_template_analytics_day (template_id, snapshot_date),
    CONSTRAINT fk_whatsapp_template_analytics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_whatsapp_template_analytics_template FOREIGN KEY (template_id) REFERENCES whatsapp_templates (id)
);

CREATE TABLE whatsapp_campaigns (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    phone_number_id VARCHAR(80) NOT NULL,
    name VARCHAR(180) NOT NULL,
    status VARCHAR(40) NOT NULL,
    scheduled_at TIMESTAMP(6) NOT NULL,
    started_at TIMESTAMP(6) NULL,
    completed_at TIMESTAMP(6) NULL,
    total_recipients INT NOT NULL DEFAULT 0,
    queued_count INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_whatsapp_campaign_schedule (status, scheduled_at),
    CONSTRAINT fk_whatsapp_campaign_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_whatsapp_campaign_template FOREIGN KEY (template_id) REFERENCES whatsapp_templates (id)
);

CREATE TABLE whatsapp_campaign_recipients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    campaign_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    recipient VARCHAR(40) NOT NULL,
    parameters_json JSON NOT NULL,
    status VARCHAR(40) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    meta_message_id VARCHAR(160) NULL,
    last_error VARCHAR(2048) NULL,
    last_attempt_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_whatsapp_campaign_recipient (campaign_id, recipient),
    KEY idx_whatsapp_campaign_recipient_status (campaign_id, status),
    CONSTRAINT fk_whatsapp_campaign_recipient_campaign FOREIGN KEY (campaign_id) REFERENCES whatsapp_campaigns (id),
    CONSTRAINT fk_whatsapp_campaign_recipient_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);
