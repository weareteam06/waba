package com.whatsaas.inbox.config;

import com.whatsaas.inbox.infrastructure.InboxProperties;
import com.whatsaas.inbox.infrastructure.InboxRedisSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class InboxRedisConfig {

    @Bean
    RedisMessageListenerContainer inboxRedisListenerContainer(RedisConnectionFactory connectionFactory,
                                                              MessageListenerAdapter inboxRedisListenerAdapter,
                                                              InboxProperties properties) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(inboxRedisListenerAdapter, new ChannelTopic(properties.redisTopic()));
        return container;
    }

    @Bean
    MessageListenerAdapter inboxRedisListenerAdapter(InboxRedisSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "handleMessage");
    }
}
