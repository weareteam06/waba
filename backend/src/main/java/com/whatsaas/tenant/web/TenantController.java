package com.whatsaas.tenant.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.tenant.application.TenantService;
import com.whatsaas.tenant.application.dto.TenantResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT','AUDITOR')")
    public ApiResponse<TenantResponse> currentTenant() {
        return ApiResponse.success("Tenant loaded.", tenantService.currentTenant());
    }
}
