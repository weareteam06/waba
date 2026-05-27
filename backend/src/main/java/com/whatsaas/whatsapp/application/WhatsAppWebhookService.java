package com.whatsaas.whatsapp.application;

import com.whatsaas.common.config.MessagingProperties;
import com.whatsaas.common.exception.DomainException;
import com.whatsaas.whatsapp.infrastructure.MetaCloudProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppWebhookService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookService.class);

    private final MetaCloudProperties cloudProperties;
    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties messagingProperties;
    private final WhatsAppWebhookProcessor webhookProcessor;

    public WhatsAppWebhookService(MetaCloudProperties cloudProperties, RabbitTemplate rabbitTemplate,
                                  MessagingProperties messagingProperties, WhatsAppWebhookProcessor webhookProcessor) {
        this.cloudProperties = cloudProperties;
        this.rabbitTemplate = rabbitTemplate;
        this.messagingProperties = messagingProperties;
        this.webhookProcessor = webhookProcessor;
    }

    public String verify(String mode, String token, String challenge) {
        if ("subscribe".equals(mode) && configured(cloudProperties.webhookVerifyToken())
                && MessageDigest.isEqual(cloudProperties.webhookVerifyToken().getBytes(StandardCharsets.UTF_8),
                value(token).getBytes(StandardCharsets.UTF_8))) {
            return challenge;
        }
        throw new DomainException(HttpStatus.FORBIDDEN, "WEBHOOK_VERIFICATION_FAILED",
                "Webhook verification token is invalid.");
    }

    public void accept(byte[] rawBody, String signature) {
        validateSignature(rawBody, signature);
        WebhookPayloadEvent event = new WebhookPayloadEvent(new String(rawBody, StandardCharsets.UTF_8));
        try {
            webhookProcessor.process(event);
        } catch (Exception ex) {
            log.warn("Immediate WhatsApp webhook processing failed; queueing payload for retry.", ex);
            rabbitTemplate.convertAndSend(messagingProperties.exchange(), messagingProperties.webhookRoutingKey(), event);
        }
    }

    private void validateSignature(byte[] rawBody, String signature) {
        if (!configured(cloudProperties.appSecret())) {
            throw new DomainException(HttpStatus.SERVICE_UNAVAILABLE, "WEBHOOK_SECRET_MISSING",
                    "Webhook signature secret is not configured.");
        }
        if (signature == null || !signature.startsWith("sha256=")) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "WEBHOOK_SIGNATURE_MISSING",
                    "Webhook signature is missing.");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(cloudProperties.appSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal(rawBody);
            byte[] supplied = hex(signature.substring("sha256=".length()));
            if (!MessageDigest.isEqual(expected, supplied)) {
                throw new DomainException(HttpStatus.UNAUTHORIZED, "WEBHOOK_SIGNATURE_INVALID",
                        "Webhook signature is invalid.");
            }
        } catch (DomainException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "WEBHOOK_SIGNATURE_INVALID",
                    "Webhook signature could not be validated.");
        }
    }

    private byte[] hex(String value) {
        return java.util.HexFormat.of().parseHex(value);
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank();
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
