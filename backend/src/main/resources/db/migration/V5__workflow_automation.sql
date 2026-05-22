CREATE TABLE automation_workflows (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(180) NOT NULL,
    description VARCHAR(512) NULL,
    draft_version INT NOT NULL DEFAULT 1,
    published_version_id BIGINT NULL,
    active BIT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_workflow_tenant_active (tenant_id, active),
    CONSTRAINT fk_workflow_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE TABLE automation_workflow_versions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workflow_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    version INT NOT NULL,
    graph_json JSON NOT NULL,
    published_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_workflow_version (workflow_id, version),
    CONSTRAINT fk_workflow_version_workflow FOREIGN KEY (workflow_id) REFERENCES automation_workflows (id),
    CONSTRAINT fk_workflow_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

ALTER TABLE automation_workflows
    ADD CONSTRAINT fk_workflow_published_version FOREIGN KEY (published_version_id)
        REFERENCES automation_workflow_versions (id);

CREATE TABLE automation_workflow_executions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    workflow_id BIGINT NOT NULL,
    version_id BIGINT NOT NULL,
    trigger_type VARCHAR(80) NOT NULL,
    status VARCHAR(40) NOT NULL,
    current_node_id VARCHAR(120) NULL,
    context_json JSON NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    next_run_at TIMESTAMP(6) NULL,
    last_error VARCHAR(2048) NULL,
    started_at TIMESTAMP(6) NOT NULL,
    completed_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_workflow_execution_due (status, next_run_at),
    KEY idx_workflow_execution_workflow (tenant_id, workflow_id, started_at),
    CONSTRAINT fk_workflow_execution_workflow FOREIGN KEY (workflow_id) REFERENCES automation_workflows (id),
    CONSTRAINT fk_workflow_execution_version FOREIGN KEY (version_id) REFERENCES automation_workflow_versions (id)
);

CREATE TABLE automation_workflow_steps (
    id BIGINT NOT NULL AUTO_INCREMENT,
    execution_id BIGINT NOT NULL,
    node_id VARCHAR(120) NOT NULL,
    node_type VARCHAR(80) NOT NULL,
    status VARCHAR(40) NOT NULL,
    output_json JSON NULL,
    error_message VARCHAR(2048) NULL,
    attempt INT NOT NULL,
    started_at TIMESTAMP(6) NOT NULL,
    completed_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    KEY idx_workflow_step_execution (execution_id, started_at),
    CONSTRAINT fk_workflow_step_execution FOREIGN KEY (execution_id) REFERENCES automation_workflow_executions (id)
);
