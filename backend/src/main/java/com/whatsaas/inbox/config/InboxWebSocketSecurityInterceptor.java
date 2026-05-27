package com.whatsaas.inbox.config;

import java.util.Map;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

@Component
public class InboxWebSocketSecurityInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(InboxWebSocketSecurityInterceptor.class);

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    private final Map<String, String> sessionTenants = new ConcurrentHashMap<>();

    public InboxWebSocketSecurityInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            Jwt jwt = jwtDecoder.decode(bearer(accessor));
            String tenantId = String.valueOf(jwt.getClaim("tenant_id"));
            if (tenantId == null || tenantId.isBlank() || "null".equals(tenantId)) {
                throw new IllegalArgumentException("WebSocket tenant claim is required.");
            }
            AbstractAuthenticationToken authentication = converter.convert(jwt);
            accessor.setUser(authentication);
            if (accessor.getSessionId() != null) {
                sessionTenants.put(accessor.getSessionId(), tenantId);
            }
            log.debug("Inbox WebSocket connected for tenant {} session {}", tenantId, accessor.getSessionId());
        }
        if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination == null || !destination.startsWith("/topic/inbox/tenant/")) {
                throw new IllegalArgumentException("Inbox subscription destination is not allowed.");
            }
        }
        if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand()) && accessor.getSessionId() != null) {
            sessionTenants.remove(accessor.getSessionId());
        }
        return message;
    }

    private String bearer(StompHeaderAccessor accessor) {
        List<String> headers = accessor.getNativeHeader("Authorization");
        String bearer = headers == null || headers.isEmpty() ? null : headers.get(0);
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new IllegalArgumentException("WebSocket bearer token is required.");
        }
        return bearer.substring(7);
    }
}
