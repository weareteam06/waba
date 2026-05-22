package com.whatsaas.templates.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record CampaignCreateRequest(@NotBlank @Size(max = 180) String name, @NotNull Long templateId,
                                    @NotBlank @Size(max = 80) String phoneNumberId, @NotNull Instant scheduledAt,
                                    @NotEmpty List<@Valid CampaignRecipientRequest> recipients) {
}
