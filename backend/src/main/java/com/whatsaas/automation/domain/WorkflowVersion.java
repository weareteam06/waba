package com.whatsaas.automation.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "automation_workflow_versions")
public class WorkflowVersion extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name="workflow_id", nullable=false) private Long workflowId;
    @Column(name="tenant_id", nullable=false) private Long tenantId;
    @Column(nullable=false) private int version;
    @Column(name="graph_json", nullable=false, columnDefinition="json") private String graphJson;
    @Column(name="published_at") private Instant publishedAt;
    protected WorkflowVersion() {}
    public WorkflowVersion(Long workflowId, Long tenantId, int version, String graphJson){this.workflowId=workflowId;this.tenantId=tenantId;this.version=version;this.graphJson=graphJson;}
    public void replaceGraph(String graphJson){this.graphJson=graphJson;}
    public void publish(){this.publishedAt=Instant.now();}
    public Long getId(){return id;} public Long getWorkflowId(){return workflowId;} public Long getTenantId(){return tenantId;}
    public int getVersion(){return version;} public String getGraphJson(){return graphJson;} public Instant getPublishedAt(){return publishedAt;}
}
