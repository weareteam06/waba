package com.whatsaas.notifications.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "push_subscriptions")
public class PushSubscription extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "endpoint_hash", nullable = false, length = 64)
    private String endpointHash;

    @Column(nullable = false, length = 1024)
    private String endpoint;

    @Column(name = "p256dh_key", nullable = false)
    private String p256dhKey;

    @Column(name = "auth_key", nullable = false)
    private String authKey;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(nullable = false)
    private boolean active = true;

    protected PushSubscription() {
    }

    public PushSubscription(Long tenantId, Long userId, String endpointHash, String endpoint, String p256dhKey,
                            String authKey, String userAgent) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.endpointHash = endpointHash;
        this.endpoint = endpoint;
        this.p256dhKey = p256dhKey;
        this.authKey = authKey;
        this.userAgent = userAgent;
    }

    public void update(String p256dhKey, String authKey, String userAgent) {
        this.p256dhKey = p256dhKey;
        this.authKey = authKey;
        this.userAgent = userAgent;
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public Long getUserId() { return userId; }
    public String getEndpointHash() { return endpointHash; }
    public String getEndpoint() { return endpoint; }
    public String getP256dhKey() { return p256dhKey; }
    public String getAuthKey() { return authKey; }
    public boolean isActive() { return active; }
}
