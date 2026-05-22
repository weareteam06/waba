package com.whatsaas.automation.web;
import com.whatsaas.automation.application.*; import com.whatsaas.automation.application.dto.*; import com.whatsaas.common.api.ApiResponse; import com.whatsaas.common.tenant.TenantContext; import jakarta.validation.Valid; import java.util.List; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/workflows") @PreAuthorize("hasRole('TENANT_ADMIN')")
public class WorkflowController{private final WorkflowAuthoringService authoring;private final WorkflowTriggerService triggers;public WorkflowController(WorkflowAuthoringService a,WorkflowTriggerService t){authoring=a;triggers=t;}
 @PostMapping public ApiResponse<WorkflowVersionResponse> create(@Valid @RequestBody WorkflowCreateRequest r){return ApiResponse.success("Workflow created.",authoring.create(r));}
 @GetMapping public ApiResponse<List<WorkflowResponse>> list(){return ApiResponse.success("Workflows loaded.",authoring.list());}
 @PutMapping("/{id}/draft") public ApiResponse<WorkflowVersionResponse> save(@PathVariable Long id,@Valid @RequestBody WorkflowGraphRequest r){return ApiResponse.success("Workflow draft saved.",authoring.save(id,r));}
 @PostMapping("/{id}/publish") public ApiResponse<WorkflowResponse> publish(@PathVariable Long id){return ApiResponse.success("Workflow published.",authoring.publish(id));}
 @GetMapping("/{id}/versions") public ApiResponse<List<WorkflowVersionResponse>> versions(@PathVariable Long id){return ApiResponse.success("Versions loaded.",authoring.versions(id));}
 @GetMapping("/{id}/executions") public ApiResponse<List<WorkflowExecutionResponse>> history(@PathVariable Long id){return ApiResponse.success("Executions loaded.",authoring.history(id));}
 @GetMapping("/{id}/analytics") public ApiResponse<WorkflowAnalyticsResponse> analytics(@PathVariable Long id){return ApiResponse.success("Analytics loaded.",authoring.analytics(id));}
 @PostMapping("/{id}/trigger") public ApiResponse<WorkflowExecutionResponse> trigger(@PathVariable Long id,@Valid @RequestBody WorkflowTriggerRequest r){return ApiResponse.success("Workflow triggered.",triggers.manual(TenantContext.currentTenantId(),id,r.context()));}
 @GetMapping("/executions/{id}/steps") public ApiResponse<List<WorkflowStepResponse>> steps(@PathVariable Long id){return ApiResponse.success("Steps loaded.",authoring.steps(id));}
}
