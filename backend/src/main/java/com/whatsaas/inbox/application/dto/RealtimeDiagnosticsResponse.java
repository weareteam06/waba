package com.whatsaas.inbox.application.dto;

public record RealtimeDiagnosticsResponse(String websocketEndpoint, String topic, ComponentStatus redis,
                                          ComponentStatus rabbitMq) {

    public record ComponentStatus(boolean up, String detail) {
    }
}
