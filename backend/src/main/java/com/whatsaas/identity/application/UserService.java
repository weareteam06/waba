package com.whatsaas.identity.application;

import com.whatsaas.common.audit.AuditService;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.identity.application.dto.CreateUserRequest;
import com.whatsaas.identity.application.dto.UserResponse;
import com.whatsaas.identity.domain.AppUser;
import com.whatsaas.identity.domain.Role;
import com.whatsaas.identity.domain.RoleName;
import com.whatsaas.identity.infrastructure.RoleRepository;
import com.whatsaas.identity.infrastructure.UserRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        Long tenantId = TenantContext.currentTenantId();
        String email = normalizedEmail(request.email());
        if (userRepository.existsByTenantIdAndEmailIgnoreCase(tenantId, email)) {
            throw new DomainException(HttpStatus.CONFLICT, "USER_EMAIL_EXISTS", "User email is already in use.");
        }
        AppUser user = new AppUser(tenantId, email, request.displayName().trim(),
                passwordEncoder.encode(request.password()));
        request.roles().forEach(roleName -> user.addRole(role(roleName)));
        AppUser saved = userRepository.save(user);
        auditService.record("USER_CREATED", "User", saved.getId(), "{\"email\":\"" + email + "\"}");
        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAllByTenantIdOrderByCreatedAtDesc(TenantContext.currentTenantId()).stream()
                .map(UserResponse::from)
                .toList();
    }

    private Role role(RoleName roleName) {
        if (roleName == RoleName.PLATFORM_ADMIN) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "ROLE_NOT_ASSIGNABLE", "Platform role is not assignable.");
        }
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new DomainException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "Role not found."));
    }

    private String normalizedEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
