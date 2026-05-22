package com.whatsaas.automation.domain;

import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="automation_workflow_steps")
public class WorkflowStep {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="execution_id",nullable=false) private Long executionId;
    @Column(name="node_id",nullable=false,length=120) private String nodeId; @Column(name="node_type",nullable=false,length=80) private String nodeType;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=40) private WorkflowStepStatus status; @Column(name="output_json",columnDefinition="json") private String outputJson;
    @Column(name="error_message",length=2048) private String errorMessage; @Column(nullable=false) private int attempt; @Column(name="started_at",nullable=false) private Instant startedAt; @Column(name="completed_at") private Instant completedAt;
    protected WorkflowStep() {}
    public WorkflowStep(Long executionId,String nodeId,String nodeType,WorkflowStepStatus status,String output,String error,int attempt){this.executionId=executionId;this.nodeId=nodeId;this.nodeType=nodeType;this.status=status;this.outputJson=output;this.errorMessage=error;this.attempt=attempt;this.startedAt=Instant.now();this.completedAt=status==WorkflowStepStatus.WAITING?null:Instant.now();}
    public String getNodeId(){return nodeId;} public String getNodeType(){return nodeType;} public WorkflowStepStatus getStatus(){return status;} public String getErrorMessage(){return errorMessage;} public Instant getStartedAt(){return startedAt;}
}
