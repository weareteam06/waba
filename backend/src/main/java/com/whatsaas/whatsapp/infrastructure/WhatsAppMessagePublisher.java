package com.whatsaas.whatsapp.infrastructure;

import com.whatsaas.common.config.MessagingProperties;
import com.whatsaas.whatsapp.application.MessageQueuedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class WhatsAppMessagePublisher {

    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties properties;

    public WhatsAppMessagePublisher(RabbitTemplate rabbitTemplate, MessagingProperties properties) {
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(MessageQueuedEvent event) {
        rabbitTemplate.convertAndSend(properties.exchange(), properties.messageRoutingKey(), event);
    }
}
