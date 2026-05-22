package com.whatsaas.templates.web;

import com.whatsaas.common.api.ApiResponse;
import com.whatsaas.templates.application.TemplateService;
import com.whatsaas.templates.application.dto.*;
import com.whatsaas.templates.domain.TemplateApprovalStatus;
import com.whatsaas.templates.domain.TemplateCategory;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/templates")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class TemplateController {
    private final TemplateService service;
    public TemplateController(TemplateService service) { this.service = service; }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TemplateResponse> create(@Valid @RequestBody TemplateUpsertRequest request) {
        return ApiResponse.success("Template created.", service.create(request));
    }
    @PutMapping("/{id}")
    public ApiResponse<TemplateResponse> update(@PathVariable Long id, @Valid @RequestBody TemplateUpsertRequest request) {
        return ApiResponse.success("Template updated.", service.update(id, request));
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
    @GetMapping
    public ApiResponse<List<TemplateResponse>> list(@RequestParam(required = false) TemplateCategory category,
                                                     @RequestParam(required = false) TemplateApprovalStatus status) {
        return ApiResponse.success("Templates loaded.", service.list(category, status));
    }
    @PostMapping("/sync")
    public ApiResponse<List<TemplateResponse>> sync(@Valid @RequestBody TemplateSyncRequest request) {
        return ApiResponse.success("Templates synced.", service.sync(request));
    }
    @GetMapping("/{id}/analytics")
    public ApiResponse<List<TemplateAnalyticsResponse>> analytics(@PathVariable Long id) {
        return ApiResponse.success("Template analytics loaded.", service.history(id));
    }
    @PostMapping("/{id}/analytics/sync")
    public ApiResponse<List<TemplateAnalyticsResponse>> refreshAnalytics(@PathVariable Long id) {
        return ApiResponse.success("Template analytics synced.", service.refreshAnalytics(id));
    }
}
