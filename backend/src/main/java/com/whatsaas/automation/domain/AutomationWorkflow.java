package com.whatsaas.automation.domain;

import com.whatsaas.common.audit.AuditableEntity;
import jakarta.persistence.*;

@Entity @Table(name = "automation_workflows")
public class AutomationWorkflow extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "tenant_id", nullable = false) private Long tenantId;
    @Column(nullable = false, length = 180) private String name;
    @Column(length = 512) private String description;
    @Column(name = "draft_version", nullable = false) private int draftVersion;
    @Column(name = "published_version_id") private Long publishedVersionId;
    @Column(nullable = false) private boolean active;
    protected AutomationWorkflow() {}
    public AutomationWorkflow(Long tenantId, String name, String description) { this.tenantId=tenantId; this.name=name; this.description=description; this.draftVersion=1; }
    public void update(String name, String description) { this.name=name; this.description=description; }
    public void advanceDraft() { this.draftVersion++; }
    public void publish(Long versionId) { this.publishedVersionId=versionId; this.active=true; }
    public Long getId(){return id;} public Long getTenantId(){return tenantId;} public String getName(){return name;}
    public String getDescription(){return description;} public int getDraftVersion(){return draftVersion;}
    public Long getPublishedVersionId(){return publishedVersionId;} public boolean isActive(){return active;}
}
