package com.whatsaas.identity.infrastructure;

import com.whatsaas.identity.domain.Role;
import com.whatsaas.identity.domain.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);
}
