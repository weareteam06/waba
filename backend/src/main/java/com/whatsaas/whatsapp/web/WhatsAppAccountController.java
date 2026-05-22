package com.whatsaas.whatsapp.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.whatsapp.application.WhatsAppAccountService;
import com.whatsaas.whatsapp.application.dto.RegisterWhatsAppAccountRequest;
import com.whatsaas.whatsapp.application.dto.WhatsAppAccountResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/whatsapp/accounts")
public class WhatsAppAccountController {

    private final WhatsAppAccountService accountService;

    public WhatsAppAccountController(WhatsAppAccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<WhatsAppAccountResponse> register(@Valid @RequestBody RegisterWhatsAppAccountRequest request) {
        return ApiResponse.success("WhatsApp account registered.", accountService.register(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT','AUDITOR')")
    public ApiResponse<List<WhatsAppAccountResponse>> list() {
        return ApiResponse.success("WhatsApp accounts loaded.", accountService.list());
    }
}
