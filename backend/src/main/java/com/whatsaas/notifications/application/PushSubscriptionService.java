package com.whatsaas.notifications.application;

import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.security.CurrentPrincipal;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.notifications.application.dto.PushSubscriptionRequest;
import com.whatsaas.notifications.application.dto.PushSubscriptionStatusResponse;
import com.whatsaas.notifications.domain.PushSubscription;
import com.whatsaas.notifications.infrastructure.PushNotificationProperties;
import com.whatsaas.notifications.infrastructure.PushSubscriptionRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository repository;
    private final PushNotificationProperties properties;

    public PushSubscriptionService(PushSubscriptionRepository repository, PushNotificationProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    public PushSubscriptionStatusResponse status() {
        String publicKey = properties.vapidPublicKey();
        return new PushSubscriptionStatusResponse(publicKey, publicKey != null && !publicKey.isBlank());
    }

    @Transactional
    public void subscribe(PushSubscriptionRequest request) {
        Long tenantId = TenantContext.currentTenantId();
        Long userId = userId();
        String endpointHash = hash(request.endpoint());
        repository.findByTenantIdAndUserIdAndEndpointHash(tenantId, userId, endpointHash)
                .ifPresentOrElse(
                        subscription -> subscription.update(request.keys().p256dh(), request.keys().auth(),
                                trim(request.userAgent(), 512)),
                        () -> repository.save(new PushSubscription(tenantId, userId, endpointHash,
                                trim(request.endpoint(), 1024), request.keys().p256dh(), request.keys().auth(),
                                trim(request.userAgent(), 512))));
    }

    @Transactional
    public void unsubscribe(PushSubscriptionRequest request) {
        Long tenantId = TenantContext.currentTenantId();
        Long userId = userId();
        repository.findByTenantIdAndUserIdAndEndpointHash(tenantId, userId, hash(request.endpoint()))
                .ifPresent(PushSubscription::deactivate);
    }

    private Long userId() {
        Long userId = CurrentPrincipal.userIdOrNull();
        if (userId == null) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "USER_REQUIRED", "User context is missing.");
        }
        return userId;
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 digest is unavailable.", ex);
        }
    }

    private String trim(String value, int max) {
        if (value == null) return null;
        return value.substring(0, Math.min(max, value.length()));
    }
}
