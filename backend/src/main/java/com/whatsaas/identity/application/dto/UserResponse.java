package com.whatsaas.identity.application.dto;

import com.whatsaas.identity.domain.AppUser;
import com.whatsaas.identity.domain.Role;
import java.util.Set;
import java.util.stream.Collectors;

public record UserResponse(Long id, String displayName, String email, String status, Set<String> roles) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                user.getStatus().name(),
                user.getRoles().stream().map(Role::getName).map(Enum::name).collect(Collectors.toUnmodifiableSet()));
    }
}
