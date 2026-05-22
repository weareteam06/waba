package com.whatsaas.whatsapp.application;

import com.whatsaas.common.audit.AuditService;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.whatsapp.application.dto.RegisterWhatsAppAccountRequest;
import com.whatsaas.whatsapp.application.dto.WhatsAppAccountResponse;
import com.whatsaas.whatsapp.domain.WhatsAppAccount;
import com.whatsaas.whatsapp.infrastructure.WhatsAppAccountRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppAccountService {

    private final WhatsAppAccountRepository accountRepository;
    private final AuditService auditService;

    public WhatsAppAccountService(WhatsAppAccountRepository accountRepository, AuditService auditService) {
        this.accountRepository = accountRepository;
        this.auditService = auditService;
    }

    @Transactional
    public WhatsAppAccountResponse register(RegisterWhatsAppAccountRequest request) {
        String phoneNumberId = request.phoneNumberId().trim();
        if (accountRepository.existsByPhoneNumberId(phoneNumberId)) {
            throw new DomainException(HttpStatus.CONFLICT, "WHATSAPP_PHONE_EXISTS",
                    "WhatsApp phone number id is already registered.");
        }
        WhatsAppAccount account = accountRepository.save(new WhatsAppAccount(
                TenantContext.currentTenantId(), phoneNumberId, request.wabaId().trim(),
                trimToNull(request.displayPhoneNumber())));
        auditService.record("WHATSAPP_ACCOUNT_REGISTERED", "WhatsAppAccount", account.getId(),
                "{\"phoneNumberId\":\"" + phoneNumberId + "\"}");
        return WhatsAppAccountResponse.from(account);
    }

    @Transactional(readOnly = true)
    public List<WhatsAppAccountResponse> list() {
        return accountRepository.findByTenantIdAndActiveTrueOrderByCreatedAtDesc(TenantContext.currentTenantId())
                .stream().map(WhatsAppAccountResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public WhatsAppAccount requireOutboundAccount(Long tenantId, String phoneNumberId) {
        return accountRepository.findByTenantIdAndPhoneNumberIdAndActiveTrue(tenantId, phoneNumberId)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "WHATSAPP_PHONE_NOT_FOUND",
                        "WhatsApp phone number is not registered for this tenant."));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
