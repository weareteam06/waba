package com.whatsaas.tenant.application.dto;

import com.whatsaas.tenant.domain.Tenant;

public record TenantResponse(Long id, String slug, String name, String status) {

    public static TenantResponse from(Tenant tenant) {
        return new TenantResponse(tenant.getId(), tenant.getSlug(), tenant.getName(), tenant.getStatus().name());
    }
}
