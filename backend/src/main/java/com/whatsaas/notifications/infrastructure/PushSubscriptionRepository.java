package com.whatsaas.notifications.infrastructure;

import com.whatsaas.notifications.domain.PushSubscription;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByTenantIdAndUserIdAndEndpointHash(Long tenantId, Long userId, String endpointHash);
}
