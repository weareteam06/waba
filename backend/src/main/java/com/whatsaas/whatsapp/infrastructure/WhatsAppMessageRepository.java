package com.whatsaas.whatsapp.infrastructure;

import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WhatsAppMessageRepository extends JpaRepository<WhatsAppMessage, Long> {

    Optional<WhatsAppMessage> findByTenantIdAndId(Long tenantId, Long id);

    Optional<WhatsAppMessage> findByMetaMessageId(String metaMessageId);

    boolean existsByMetaMessageId(String metaMessageId);

    List<WhatsAppMessage> findTop100ByTenantIdOrderByCreatedAtDesc(Long tenantId);

    Page<WhatsAppMessage> findByTenantIdAndConversationIdOrderByCreatedAtDesc(Long tenantId, Long conversationId,
                                                                                Pageable pageable);
}
