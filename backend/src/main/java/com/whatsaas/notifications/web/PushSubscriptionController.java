package com.whatsaas.notifications.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.notifications.application.PushSubscriptionService;
import com.whatsaas.notifications.application.dto.PushSubscriptionRequest;
import com.whatsaas.notifications.application.dto.PushSubscriptionStatusResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/push")
@PreAuthorize("isAuthenticated()")
public class PushSubscriptionController {

    private final PushSubscriptionService service;

    public PushSubscriptionController(PushSubscriptionService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public ApiResponse<PushSubscriptionStatusResponse> status() {
        return ApiResponse.success("Push notification status loaded.", service.status());
    }

    @PostMapping("/subscriptions")
    public ApiResponse<Void> subscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        service.subscribe(request);
        return ApiResponse.success("Push subscription saved.");
    }

    @DeleteMapping("/subscriptions")
    public ApiResponse<Void> unsubscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        service.unsubscribe(request);
        return ApiResponse.success("Push subscription removed.");
    }
}
