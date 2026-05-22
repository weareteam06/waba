package com.whatsaas.whatsapp.infrastructure;

import com.whatsaas.whatsapp.application.MessageQueuedEvent;
import com.whatsaas.common.config.MessagingProperties;
import com.whatsaas.inbox.application.InboxConversationWriter;
import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class WhatsAppMessageConsumer {

    private final WhatsAppMessageRepository messageRepository;
    private final MetaCloudApiClient metaCloudApiClient;
    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties messagingProperties;
    private final MetaCloudProperties cloudProperties;
    private final InboxConversationWriter inboxConversationWriter;

    public WhatsAppMessageConsumer(WhatsAppMessageRepository messageRepository, MetaCloudApiClient metaCloudApiClient,
                                   RabbitTemplate rabbitTemplate, MessagingProperties messagingProperties,
                                   MetaCloudProperties cloudProperties, InboxConversationWriter inboxConversationWriter) {
        this.messageRepository = messageRepository;
        this.metaCloudApiClient = metaCloudApiClient;
        this.rabbitTemplate = rabbitTemplate;
        this.messagingProperties = messagingProperties;
        this.cloudProperties = cloudProperties;
        this.inboxConversationWriter = inboxConversationWriter;
    }

    @RabbitListener(queues = "${app.messaging.message-queue}")
    @Transactional
    public void dispatch(MessageQueuedEvent event) {
        WhatsAppMessage message = messageRepository.findByTenantIdAndId(event.tenantId(), event.messageId())
                .orElseThrow();
        message.startRetry();
        try {
            MetaSendResult result = metaCloudApiClient.send(message);
            message.markSent(result.messageId());
            inboxConversationWriter.statusChanged(message);
        } catch (MetaProviderException ex) {
            message.recordSendFailure(ex.getMessage());
            inboxConversationWriter.statusChanged(message);
            if (message.getSendAttempts() < cloudProperties.maxSendAttempts()) {
                rabbitTemplate.convertAndSend(messagingProperties.exchange(), messagingProperties.messageRetryRoutingKey(),
                        event);
            }
        }
    }
}
