package com.whatsaas.inbox.infrastructure;

import com.whatsaas.inbox.domain.InboxConversation;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InboxConversationRepository extends JpaRepository<InboxConversation, Long> {

    Optional<InboxConversation> findByTenantIdAndPhoneNumberIdAndContactPhone(Long tenantId, String phoneNumberId,
                                                                               String contactPhone);

    Optional<InboxConversation> findByTenantIdAndId(Long tenantId, Long id);

    Page<InboxConversation> findByTenantIdAndUnreadCountGreaterThanOrderByLastMessageAtDesc(Long tenantId,
                                                                                              int unreadCount,
                                                                                              Pageable pageable);

    Page<InboxConversation> findByTenantIdAndAssignedAgentIdOrderByLastMessageAtDesc(Long tenantId, Long agentId,
                                                                                       Pageable pageable);

    Page<InboxConversation> findByTenantIdAndAssignedAgentIdIsNullOrderByLastMessageAtDesc(Long tenantId,
                                                                                             Pageable pageable);

    Page<InboxConversation> findByTenantIdAndContactPhoneContainingIgnoreCaseOrderByLastMessageAtDesc(Long tenantId,
                                                                                                        String query,
                                                                                                        Pageable pageable);

    Page<InboxConversation> findByTenantIdOrderByLastMessageAtDesc(Long tenantId, Pageable pageable);
}
