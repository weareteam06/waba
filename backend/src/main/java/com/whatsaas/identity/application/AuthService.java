package com.whatsaas.identity.application;

import com.whatsaas.common.audit.AuditService;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.security.JwtService;
import com.whatsaas.common.security.RefreshTokenHasher;
import com.whatsaas.common.security.SecurityProperties;
import com.whatsaas.identity.application.dto.LoginRequest;
import com.whatsaas.identity.application.dto.RefreshTokenRequest;
import com.whatsaas.identity.application.dto.RegisterTenantRequest;
import com.whatsaas.identity.application.dto.TokenResponse;
import com.whatsaas.identity.domain.AppUser;
import com.whatsaas.identity.domain.RefreshToken;
import com.whatsaas.identity.domain.Role;
import com.whatsaas.identity.domain.RoleName;
import com.whatsaas.identity.domain.UserStatus;
import com.whatsaas.identity.infrastructure.RefreshTokenRepository;
import com.whatsaas.identity.infrastructure.RoleRepository;
import com.whatsaas.identity.infrastructure.UserRepository;
import com.whatsaas.tenant.application.TenantService;
import com.whatsaas.tenant.domain.Tenant;
import com.whatsaas.tenant.domain.TenantStatus;
import com.whatsaas.tenant.infrastructure.TenantRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final TenantService tenantService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenHasher refreshTokenHasher;
    private final SecurityProperties securityProperties;
    private final AuditService auditService;

    public AuthService(TenantService tenantService, TenantRepository tenantRepository, UserRepository userRepository,
                       RoleRepository roleRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenHasher refreshTokenHasher,
                       SecurityProperties securityProperties, AuditService auditService) {
        this.tenantService = tenantService;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenHasher = refreshTokenHasher;
        this.securityProperties = securityProperties;
        this.auditService = auditService;
    }

    @Transactional
    public TokenResponse registerTenant(RegisterTenantRequest request) {
        Tenant tenant = tenantService.provision(request.tenantSlug(), request.tenantName());
        AppUser admin = new AppUser(tenant.getId(), email(request.email()), request.adminName().trim(),
                passwordEncoder.encode(request.password()));
        admin.addRole(role(RoleName.TENANT_ADMIN));
        AppUser saved = userRepository.save(admin);
        auditService.record(tenant.getId(), saved.getId(), "TENANT_REGISTERED", "Tenant", tenant.getId(),
                "{\"adminId\":" + saved.getId() + "}");
        return tokens(saved);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        Tenant tenant = tenantRepository.findBySlugIgnoreCaseAndStatus(request.tenantSlug(), TenantStatus.ACTIVE)
                .orElseThrow(this::invalidCredentials);
        AppUser user = userRepository.findByTenantIdAndEmailIgnoreCase(tenant.getId(), email(request.email()))
                .orElseThrow(this::invalidCredentials);
        if (user.getStatus() != UserStatus.ACTIVE || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        auditService.record(tenant.getId(), user.getId(), "USER_LOGIN", "User", user.getId(), "{}");
        return tokens(user);
    }

    @Transactional
    public TokenResponse refresh(RefreshTokenRequest request) {
        RefreshToken current = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(
                        refreshTokenHasher.hash(request.refreshToken()))
                .orElseThrow(() -> new DomainException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_INVALID",
                        "Refresh token is invalid."));
        if (current.isExpired()) {
            current.revoke();
            throw new DomainException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED", "Refresh token expired.");
        }
        current.revoke();
        AppUser user = userRepository.findByTenantIdAndId(current.getTenantId(), current.getUserId())
                .filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new DomainException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_INVALID",
                        "Refresh token is invalid."));
        return tokens(user);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(refreshTokenHasher.hash(request.refreshToken()))
                .ifPresent(RefreshToken::revoke);
    }

    private TokenResponse tokens(AppUser user) {
        List<String> roles = user.getRoles().stream().map(Role::getName).map(Enum::name).toList();
        String opaqueToken = refreshTokenHasher.newOpaqueToken();
        refreshTokenRepository.save(new RefreshToken(
                user.getTenantId(),
                user.getId(),
                refreshTokenHasher.hash(opaqueToken),
                Instant.now().plus(securityProperties.refreshTokenTtl())));
        return new TokenResponse("Bearer", jwtService.createAccessToken(user, roles), opaqueToken,
                securityProperties.accessTokenTtl().toSeconds());
    }

    private Role role(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Required role is missing: " + roleName));
    }

    private String email(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private DomainException invalidCredentials() {
        return new DomainException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Credentials are invalid.");
    }
}
