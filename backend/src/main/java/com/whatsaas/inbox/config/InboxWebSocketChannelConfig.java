package com.whatsaas.inbox.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
public class InboxWebSocketChannelConfig implements WebSocketMessageBrokerConfigurer {

    private final InboxWebSocketSecurityInterceptor interceptor;

    public InboxWebSocketChannelConfig(InboxWebSocketSecurityInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(interceptor);
    }
}
