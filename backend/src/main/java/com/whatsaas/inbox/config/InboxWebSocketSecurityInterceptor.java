package com.whatsaas.inbox.config;

import java.util.List;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class InboxWebSocketSecurityInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

    public InboxWebSocketSecurityInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> headers = accessor.getNativeHeader("Authorization");
            String bearer = headers == null || headers.isEmpty() ? null : headers.get(0);
            if (bearer == null || !bearer.startsWith("Bearer ")) {
                throw new IllegalArgumentException("WebSocket bearer token is required.");
            }
            AbstractAuthenticationToken authentication = converter.convert(jwtDecoder.decode(bearer.substring(7)));
            accessor.setUser(authentication);
        }
        if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            String tenantId = accessor.getUser() instanceof JwtAuthenticationToken authentication
                    ? String.valueOf(authentication.getToken().getClaim("tenant_id")) : "";
            if (destination == null || !destination.equals("/topic/inbox/tenant/" + tenantId)) {
                throw new IllegalArgumentException("Inbox subscription destination is not allowed.");
            }
        }
        return message;
    }
}
