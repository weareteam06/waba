package com.whatsaas.identity.application.dto;

public record TokenResponse(String tokenType, String accessToken, String refreshToken, long expiresInSeconds) {
}
