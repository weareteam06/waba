package com.whatsaas.inbox.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.inbox.application.InboxService;
import com.whatsaas.inbox.application.RealtimeDiagnosticsService;
import com.whatsaas.inbox.application.dto.AssignConversationRequest;
import com.whatsaas.inbox.application.dto.ConversationFilter;
import com.whatsaas.inbox.application.dto.ConversationPageResponse;
import com.whatsaas.inbox.application.dto.ConversationResponse;
import com.whatsaas.inbox.application.dto.InboxMessageResponse;
import com.whatsaas.inbox.application.dto.MessagePageResponse;
import com.whatsaas.inbox.application.dto.RealtimeDiagnosticsResponse;
import com.whatsaas.inbox.application.dto.SendConversationMessageRequest;
import com.whatsaas.inbox.application.dto.StartConversationRequest;
import com.whatsaas.inbox.application.dto.StartConversationResponse;
import com.whatsaas.inbox.application.dto.TypingEventRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/v1/inbox")
@PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT','AUDITOR')")
public class InboxController {

    private final InboxService inboxService;
    private final RealtimeDiagnosticsService realtimeDiagnosticsService;

    public InboxController(InboxService inboxService, RealtimeDiagnosticsService realtimeDiagnosticsService) {
        this.inboxService = inboxService;
        this.realtimeDiagnosticsService = realtimeDiagnosticsService;
    }

    @GetMapping("/conversations")
    public ApiResponse<ConversationPageResponse> conversations(
            @RequestParam(defaultValue = "ALL") ConversationFilter filter,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success("Conversations loaded.", inboxService.conversations(filter, query, page, size));
    }

    @GetMapping("/realtime/diagnostics")
    public ApiResponse<RealtimeDiagnosticsResponse> realtimeDiagnostics() {
        return ApiResponse.success("Realtime diagnostics loaded.", realtimeDiagnosticsService.status());
    }

    @PostMapping("/conversations/{conversationId}/realtime-test")
    public ApiResponse<Void> realtimeTest(@PathVariable Long conversationId) {
        realtimeDiagnosticsService.publishConversationTest(conversationId);
        return ApiResponse.success("Realtime test event published.");
    }

    @PostMapping("/conversations")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<StartConversationResponse> start(@Valid @RequestBody StartConversationRequest request) {
        return ApiResponse.success("Conversation started.", inboxService.start(request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<MessagePageResponse> messages(@PathVariable Long conversationId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success("Messages loaded.", inboxService.messages(conversationId, page, size));
    }

    @GetMapping("/messages/{messageId}/media")
    public ResponseEntity<Resource> media(@PathVariable Long messageId) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(inboxService.mediaContentType(messageId)))
                .body(inboxService.media(messageId));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<InboxMessageResponse> send(@PathVariable Long conversationId,
                                                  @Valid @RequestBody SendConversationMessageRequest request) {
        return ApiResponse.success("Message queued.", inboxService.send(conversationId, request));
    }

    @PatchMapping("/conversations/{conversationId}/assignment")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ConversationResponse> assign(@PathVariable Long conversationId,
                                                    @Valid @RequestBody AssignConversationRequest request) {
        return ApiResponse.success("Conversation assigned.", inboxService.assign(conversationId, request));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ApiResponse<ConversationResponse> markRead(@PathVariable Long conversationId) {
        return ApiResponse.success("Conversation marked read.", inboxService.markRead(conversationId));
    }

    @DeleteMapping("/conversations/{conversationId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<Void> delete(@PathVariable Long conversationId) {
        inboxService.delete(conversationId);
        return ApiResponse.success("Conversation deleted.");
    }

    @DeleteMapping("/conversations/{conversationId}/messages/{messageId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<Void> deleteMessage(@PathVariable Long conversationId, @PathVariable Long messageId) {
        inboxService.deleteMessage(conversationId, messageId);
        return ApiResponse.success("Message deleted.");
    }

    @PostMapping("/conversations/{conversationId}/typing")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN','AGENT')")
    public ApiResponse<Void> typing(@PathVariable Long conversationId, @RequestBody TypingEventRequest request) {
        inboxService.typing(conversationId, request.typing());
        return ApiResponse.success("Typing state published.");
    }
}
