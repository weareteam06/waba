CREATE TABLE push_subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    endpoint_hash VARCHAR(64) NOT NULL,
    endpoint VARCHAR(1024) NOT NULL,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    user_agent VARCHAR(512) NULL,
    active BIT NOT NULL DEFAULT 1,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_push_subscription_endpoint (tenant_id, user_id, endpoint_hash),
    KEY idx_push_subscription_user_active (tenant_id, user_id, active),
    CONSTRAINT fk_push_subscription_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_push_subscription_user FOREIGN KEY (user_id) REFERENCES users (id)
);
