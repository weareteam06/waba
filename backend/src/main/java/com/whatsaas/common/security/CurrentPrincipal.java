package com.whatsaas.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class CurrentPrincipal {

    private CurrentPrincipal() {
    }

    public static Long userIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return Long.valueOf(jwtAuthenticationToken.getToken().getSubject());
        }
        return null;
    }
}
