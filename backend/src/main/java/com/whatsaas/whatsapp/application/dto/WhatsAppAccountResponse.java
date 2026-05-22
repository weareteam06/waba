package com.whatsaas.whatsapp.application.dto;

import com.whatsaas.whatsapp.domain.WhatsAppAccount;

public record WhatsAppAccountResponse(Long id, String phoneNumberId, String wabaId, String displayPhoneNumber) {

    public static WhatsAppAccountResponse from(WhatsAppAccount account) {
        return new WhatsAppAccountResponse(account.getId(), account.getPhoneNumberId(), account.getWabaId(),
                account.getDisplayPhoneNumber());
    }
}
