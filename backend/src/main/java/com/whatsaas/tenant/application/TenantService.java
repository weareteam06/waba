package com.whatsaas.tenant.application;

import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.tenant.application.dto.TenantResponse;
import com.whatsaas.tenant.domain.Tenant;
import com.whatsaas.tenant.domain.TenantStatus;
import com.whatsaas.tenant.infrastructure.TenantRepository;
import java.util.Locale;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public Tenant provision(String slug, String name) {
        String normalizedSlug = slug.trim().toLowerCase(Locale.ROOT);
        if (tenantRepository.existsBySlugIgnoreCase(normalizedSlug)) {
            throw new DomainException(HttpStatus.CONFLICT, "TENANT_SLUG_EXISTS", "Tenant slug is already in use.");
        }
        return tenantRepository.save(new Tenant(normalizedSlug, name.trim()));
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "tenant-profile", key = "T(com.whatsaas.common.tenant.TenantContext).currentTenantId()")
    public TenantResponse currentTenant() {
        Tenant tenant = tenantRepository.findByIdAndStatus(TenantContext.currentTenantId(), TenantStatus.ACTIVE)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "TENANT_NOT_FOUND", "Tenant not found."));
        return TenantResponse.from(tenant);
    }
}
