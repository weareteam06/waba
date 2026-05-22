package com.whatsaas.identity.infrastructure;

import com.whatsaas.identity.domain.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    boolean existsByTenantIdAndEmailIgnoreCase(Long tenantId, String email);

    Optional<AppUser> findByTenantIdAndEmailIgnoreCase(Long tenantId, String email);

    Optional<AppUser> findByTenantIdAndId(Long tenantId, Long id);

    List<AppUser> findAllByTenantIdOrderByCreatedAtDesc(Long tenantId);
}
