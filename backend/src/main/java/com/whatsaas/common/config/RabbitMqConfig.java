package com.whatsaas.common.config;

import com.whatsaas.whatsapp.infrastructure.MetaCloudProperties;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Bean
    DirectExchange whatsappCommandExchange(MessagingProperties properties) {
        return new DirectExchange(properties.exchange(), true, false);
    }

    @Bean
    Queue whatsappMessageQueue(MessagingProperties properties) {
        return QueueBuilder.durable(properties.messageQueue())
                .deadLetterExchange(properties.exchange())
                .deadLetterRoutingKey(properties.messageRoutingKey() + ".dlq")
                .build();
    }

    @Bean
    Binding whatsappMessageBinding(Queue whatsappMessageQueue, DirectExchange whatsappCommandExchange,
                                   MessagingProperties properties) {
        return BindingBuilder.bind(whatsappMessageQueue)
                .to(whatsappCommandExchange)
                .with(properties.messageRoutingKey());
    }

    @Bean
    Queue whatsappMessageRetryQueue(MessagingProperties properties, MetaCloudProperties cloudProperties) {
        return QueueBuilder.durable(properties.messageRetryQueue())
                .ttl(Math.toIntExact(cloudProperties.retryDelay().toMillis()))
                .deadLetterExchange(properties.exchange())
                .deadLetterRoutingKey(properties.messageRoutingKey())
                .build();
    }

    @Bean
    Binding whatsappMessageRetryBinding(Queue whatsappMessageRetryQueue, DirectExchange whatsappCommandExchange,
                                        MessagingProperties properties) {
        return BindingBuilder.bind(whatsappMessageRetryQueue)
                .to(whatsappCommandExchange)
                .with(properties.messageRetryRoutingKey());
    }

    @Bean
    Queue whatsappWebhookQueue(MessagingProperties properties) {
        return QueueBuilder.durable(properties.webhookQueue())
                .deadLetterExchange(properties.exchange())
                .deadLetterRoutingKey(properties.webhookRoutingKey() + ".dlq")
                .build();
    }

    @Bean
    Binding whatsappWebhookBinding(Queue whatsappWebhookQueue, DirectExchange whatsappCommandExchange,
                                   MessagingProperties properties) {
        return BindingBuilder.bind(whatsappWebhookQueue)
                .to(whatsappCommandExchange)
                .with(properties.webhookRoutingKey());
    }

    @Bean
    Queue whatsappMessageDeadLetterQueue(MessagingProperties properties) {
        return new Queue(properties.messageQueue() + ".dlq", true);
    }

    @Bean
    Binding whatsappMessageDeadLetterBinding(Queue whatsappMessageDeadLetterQueue,
                                             DirectExchange whatsappCommandExchange, MessagingProperties properties) {
        return BindingBuilder.bind(whatsappMessageDeadLetterQueue)
                .to(whatsappCommandExchange)
                .with(properties.messageRoutingKey() + ".dlq");
    }

    @Bean
    Queue whatsappWebhookDeadLetterQueue(MessagingProperties properties) {
        return new Queue(properties.webhookQueue() + ".dlq", true);
    }

    @Bean
    Queue campaignRecipientQueue(MessagingProperties properties) {
        return QueueBuilder.durable(properties.campaignQueue())
                .deadLetterExchange(properties.exchange())
                .deadLetterRoutingKey(properties.campaignRoutingKey() + ".dlq")
                .build();
    }

    @Bean
    Binding campaignRecipientBinding(Queue campaignRecipientQueue, DirectExchange whatsappCommandExchange,
                                     MessagingProperties properties) {
        return BindingBuilder.bind(campaignRecipientQueue).to(whatsappCommandExchange)
                .with(properties.campaignRoutingKey());
    }

    @Bean
    Queue campaignRecipientRetryQueue(MessagingProperties properties, MetaCloudProperties cloudProperties) {
        return QueueBuilder.durable(properties.campaignRetryQueue())
                .ttl(Math.toIntExact(cloudProperties.retryDelay().toMillis()))
                .deadLetterExchange(properties.exchange())
                .deadLetterRoutingKey(properties.campaignRoutingKey()).build();
    }

    @Bean
    Binding campaignRecipientRetryBinding(Queue campaignRecipientRetryQueue, DirectExchange whatsappCommandExchange,
                                          MessagingProperties properties) {
        return BindingBuilder.bind(campaignRecipientRetryQueue).to(whatsappCommandExchange)
                .with(properties.campaignRetryRoutingKey());
    }

    @Bean
    Queue campaignRecipientDeadLetterQueue(MessagingProperties properties) {
        return new Queue(properties.campaignQueue() + ".dlq", true);
    }

    @Bean
    Binding campaignRecipientDeadLetterBinding(Queue campaignRecipientDeadLetterQueue,
                                               DirectExchange whatsappCommandExchange, MessagingProperties properties) {
        return BindingBuilder.bind(campaignRecipientDeadLetterQueue).to(whatsappCommandExchange)
                .with(properties.campaignRoutingKey() + ".dlq");
    }

    @Bean
    Binding whatsappWebhookDeadLetterBinding(Queue whatsappWebhookDeadLetterQueue,
                                             DirectExchange whatsappCommandExchange, MessagingProperties properties) {
        return BindingBuilder.bind(whatsappWebhookDeadLetterQueue)
                .to(whatsappCommandExchange)
                .with(properties.webhookRoutingKey() + ".dlq");
    }

    @Bean
    MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
