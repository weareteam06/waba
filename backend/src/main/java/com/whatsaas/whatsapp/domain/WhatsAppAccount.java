package com.whatsaas.whatsapp.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "whatsapp_accounts")
public class WhatsAppAccount extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "phone_number_id", nullable = false, unique = true, length = 80)
    private String phoneNumberId;

    @Column(name = "waba_id", length = 80)
    private String wabaId;

    @Column(name = "display_phone_number", length = 80)
    private String displayPhoneNumber;

    @Column(nullable = false)
    private boolean active;

    protected WhatsAppAccount() {
    }

    public WhatsAppAccount(Long tenantId, String phoneNumberId, String wabaId, String displayPhoneNumber) {
        this.tenantId = tenantId;
        this.phoneNumberId = phoneNumberId;
        this.wabaId = wabaId;
        this.displayPhoneNumber = displayPhoneNumber;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public String getPhoneNumberId() {
        return phoneNumberId;
    }

    public String getWabaId() {
        return wabaId;
    }

    public String getDisplayPhoneNumber() {
        return displayPhoneNumber;
    }
}
