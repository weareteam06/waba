package com.whatsaas.identity.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.identity.application.AuthService;
import com.whatsaas.identity.application.dto.LoginRequest;
import com.whatsaas.identity.application.dto.RefreshTokenRequest;
import com.whatsaas.identity.application.dto.RegisterTenantRequest;
import com.whatsaas.identity.application.dto.TokenResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register-tenant")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TokenResponse> registerTenant(@Valid @RequestBody RegisterTenantRequest request) {
        return ApiResponse.success("Tenant registered.", authService.registerTenant(request));
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Authenticated.", authService.login(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success("Token refreshed.", authService.refresh(request));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
    }
}
