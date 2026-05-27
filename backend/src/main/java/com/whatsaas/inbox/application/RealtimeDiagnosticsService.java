package com.whatsaas.inbox.application;

import com.whatsaas.common.tenant.TenantContext;
import com.whatsaas.inbox.application.dto.RealtimeDiagnosticsResponse;
import com.whatsaas.inbox.infrastructure.InboxConversationRepository;
import com.whatsaas.inbox.application.dto.ConversationResponse;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimeDiagnosticsService {

    private final StringRedisTemplate redisTemplate;
    private final RabbitTemplate rabbitTemplate;
    private final InboxConversationRepository conversationRepository;
    private final InboxRealtimePublisher realtimePublisher;

    public RealtimeDiagnosticsService(StringRedisTemplate redisTemplate, RabbitTemplate rabbitTemplate,
                                      InboxConversationRepository conversationRepository,
                                      InboxRealtimePublisher realtimePublisher) {
        this.redisTemplate = redisTemplate;
        this.rabbitTemplate = rabbitTemplate;
        this.conversationRepository = conversationRepository;
        this.realtimePublisher = realtimePublisher;
    }

    public RealtimeDiagnosticsResponse status() {
        Long tenantId = TenantContext.currentTenantId();
        return new RealtimeDiagnosticsResponse(
                "/ws/inbox",
                "/topic/inbox/tenant/" + tenantId,
                redisStatus(),
                rabbitStatus());
    }

    public void publishConversationTest(Long conversationId) {
        Long tenantId = TenantContext.currentTenantId();
        var conversation = conversationRepository.findByTenantIdAndId(tenantId, conversationId).orElseThrow();
        realtimePublisher.publish(new InboxRealtimeEvent(tenantId, InboxEventType.CONVERSATION_CHANGED,
                conversationId, ConversationResponse.from(conversation), null, null, null, null));
    }

    private RealtimeDiagnosticsResponse.ComponentStatus redisStatus() {
        try {
            if (redisTemplate.getConnectionFactory() == null) {
                return new RealtimeDiagnosticsResponse.ComponentStatus(false, "Redis connection factory is missing.");
            }
            String pong;
            try (RedisConnection connection = redisTemplate.getConnectionFactory().getConnection()) {
                pong = connection.ping();
            }
            return new RealtimeDiagnosticsResponse.ComponentStatus(true, pong == null ? "connected" : pong);
        } catch (Exception ex) {
            return new RealtimeDiagnosticsResponse.ComponentStatus(false, ex.getMessage());
        }
    }

    private RealtimeDiagnosticsResponse.ComponentStatus rabbitStatus() {
        try {
            Boolean open = rabbitTemplate.execute(channel -> channel.isOpen());
            return new RealtimeDiagnosticsResponse.ComponentStatus(Boolean.TRUE.equals(open),
                    Boolean.TRUE.equals(open) ? "channel open" : "channel closed");
        } catch (Exception ex) {
            return new RealtimeDiagnosticsResponse.ComponentStatus(false, ex.getMessage());
        }
    }
}
