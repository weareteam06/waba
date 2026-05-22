package com.whatsaas.automation.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="automation_workflow_executions")
public class WorkflowExecution extends AuditableEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="tenant_id",nullable=false) private Long tenantId; @Column(name="workflow_id",nullable=false) private Long workflowId;
    @Column(name="version_id",nullable=false) private Long versionId; @Column(name="trigger_type",nullable=false,length=80) private String triggerType;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=40) private WorkflowExecutionStatus status;
    @Column(name="current_node_id",length=120) private String currentNodeId; @Column(name="context_json",nullable=false,columnDefinition="json") private String contextJson;
    @Column(nullable=false) private int attempts; @Column(name="next_run_at") private Instant nextRunAt; @Column(name="last_error",length=2048) private String lastError;
    @Column(name="started_at",nullable=false) private Instant startedAt; @Column(name="completed_at") private Instant completedAt;
    protected WorkflowExecution() {}
    public WorkflowExecution(Long tenantId,Long workflowId,Long versionId,String triggerType,String nodeId,String contextJson){this.tenantId=tenantId;this.workflowId=workflowId;this.versionId=versionId;this.triggerType=triggerType;this.currentNodeId=nodeId;this.contextJson=contextJson;this.status=WorkflowExecutionStatus.RUNNING;this.startedAt=Instant.now();}
    public void advance(String nodeId,String contextJson){this.currentNodeId=nodeId;this.contextJson=contextJson;this.status=WorkflowExecutionStatus.RUNNING;this.nextRunAt=null;}
    public void waitUntil(String nodeId,Instant time,String contextJson){advance(nodeId,contextJson);this.status=WorkflowExecutionStatus.WAITING;this.nextRunAt=time;}
    public void retry(Instant time,String error){this.status=WorkflowExecutionStatus.RETRY_WAIT;this.nextRunAt=time;this.lastError=error;this.attempts++;}
    public void fail(String error){this.status=WorkflowExecutionStatus.FAILED;this.lastError=error;this.completedAt=Instant.now();}
    public void complete(){this.status=WorkflowExecutionStatus.COMPLETED;this.currentNodeId=null;this.completedAt=Instant.now();}
    public Long getId(){return id;} public Long getTenantId(){return tenantId;} public Long getWorkflowId(){return workflowId;} public Long getVersionId(){return versionId;}
    public String getTriggerType(){return triggerType;} public WorkflowExecutionStatus getStatus(){return status;} public String getCurrentNodeId(){return currentNodeId;}
    public String getContextJson(){return contextJson;} public int getAttempts(){return attempts;} public Instant getStartedAt(){return startedAt;} public String getLastError(){return lastError;}
}
