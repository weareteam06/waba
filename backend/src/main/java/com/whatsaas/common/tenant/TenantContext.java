package com.whatsaas.common.tenant;

import com.whatsaas.common.exception.DomainException;
import org.springframework.http.HttpStatus;

public final class TenantContext {

    private static final ThreadLocal<Long> TENANT_ID = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setTenantId(Long tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static Long currentTenantId() {
        Long tenantId = TENANT_ID.get();
        if (tenantId == null) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "TENANT_REQUIRED", "Tenant context is missing.");
        }
        return tenantId;
    }

    public static Long currentTenantIdOrNull() {
        return TENANT_ID.get();
    }

    public static void clear() {
        TENANT_ID.remove();
    }
}
