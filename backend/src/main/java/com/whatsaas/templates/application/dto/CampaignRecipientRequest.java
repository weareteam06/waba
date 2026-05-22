package com.whatsaas.templates.application.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CampaignRecipientRequest(
        @NotBlank @Pattern(regexp = "^\\+[1-9]\\d{7,14}$") String recipient,
        JsonNode parameters) {
}
