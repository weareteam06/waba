package com.whatsaas.templates.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.templates.application.CampaignService;
import com.whatsaas.templates.application.dto.CampaignCreateRequest;
import com.whatsaas.templates.application.dto.CampaignResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/campaigns")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class CampaignController {
    private final CampaignService service;
    public CampaignController(CampaignService service) { this.service = service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CampaignResponse> create(@Valid @RequestBody CampaignCreateRequest request) {
        return ApiResponse.success("Campaign scheduled.", service.create(request));
    }
    @GetMapping
    public ApiResponse<List<CampaignResponse>> list() {
        return ApiResponse.success("Campaigns loaded.", service.list());
    }
}
