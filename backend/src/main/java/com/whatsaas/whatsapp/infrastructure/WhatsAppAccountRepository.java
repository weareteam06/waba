package com.whatsaas.whatsapp.infrastructure;

import com.whatsaas.whatsapp.domain.WhatsAppAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppAccountRepository extends JpaRepository<WhatsAppAccount, Long> {

    Optional<WhatsAppAccount> findByTenantIdAndPhoneNumberIdAndActiveTrue(Long tenantId, String phoneNumberId);

    Optional<WhatsAppAccount> findByPhoneNumberIdAndActiveTrue(String phoneNumberId);

    List<WhatsAppAccount> findByTenantIdAndActiveTrueOrderByCreatedAtDesc(Long tenantId);

    boolean existsByPhoneNumberId(String phoneNumberId);
}
