package com.whatsaas.tenant.infrastructure;

import com.whatsaas.tenant.domain.Tenant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    boolean existsBySlugIgnoreCase(String slug);

    Optional<Tenant> findByIdAndStatus(Long id, com.whatsaas.tenant.domain.TenantStatus status);

    Optional<Tenant> findBySlugIgnoreCaseAndStatus(String slug, com.whatsaas.tenant.domain.TenantStatus status);
}
