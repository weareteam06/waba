package com.whatsaas.whatsapp.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.whatsapp.application.WhatsAppMessageService;
import com.whatsaas.whatsapp.application.dto.MessageResponse;
import com.whatsaas.whatsapp.application.dto.QueueMediaMessageRequest;
import com.whatsaas.whatsapp.application.dto.QueueMessageRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
public class WhatsAppMessageController {

    private final WhatsAppMessageService messageService;

    public WhatsAppMessageController(WhatsAppMessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<MessageResponse> queue(@Valid @RequestBody QueueMessageRequest request) {
        return ApiResponse.success("Message queued.", messageService.queue(request));
    }

    @PostMapping("/media")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<MessageResponse> queueMedia(@Valid @RequestBody QueueMediaMessageRequest request) {
        return ApiResponse.success("Media message queued.", messageService.queueMedia(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT','AUDITOR')")
    public ApiResponse<List<MessageResponse>> latest() {
        return ApiResponse.success("Messages loaded.", messageService.latest());
    }
}
