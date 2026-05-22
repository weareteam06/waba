import { apiRequest } from "@/lib/api-client";

export type Workflow = { id: number; name: string; description: string | null; draftVersion: number; publishedVersionId: number | null; active: boolean };
export type WorkflowVersion = { id: number; workflowId: number; version: number; graphJson: string; publishedAt: string | null };
export type WorkflowExecution = { id: number; workflowId: number; versionId: number; triggerType: string; status: string; currentNodeId: string | null; attempts: number; lastError: string | null; startedAt: string };
export type WorkflowAnalytics = { executions: number; completed: number; failed: number; waiting: number };

export const workflows = () => apiRequest<Workflow[]>("/api/v1/workflows");
export const createWorkflow = (graph: unknown) => apiRequest<WorkflowVersion>("/api/v1/workflows", { method: "POST", body: JSON.stringify({ name: "Inbound reply flow", description: "WhatsApp automation", graph }) });
export const saveDraft = (id: number, graph: unknown) => apiRequest<WorkflowVersion>(`/api/v1/workflows/${id}/draft`, { method: "PUT", body: JSON.stringify({ graph }) });
export const publish = (id: number) => apiRequest<Workflow>(`/api/v1/workflows/${id}/publish`, { method: "POST" });
export const versions = (id: number) => apiRequest<WorkflowVersion[]>(`/api/v1/workflows/${id}/versions`);
export const executions = (id: number) => apiRequest<WorkflowExecution[]>(`/api/v1/workflows/${id}/executions`);
export const analytics = (id: number) => apiRequest<WorkflowAnalytics>(`/api/v1/workflows/${id}/analytics`);
export const testTrigger = (id: number) => apiRequest<WorkflowExecution>(`/api/v1/workflows/${id}/trigger`, { method: "POST", body: JSON.stringify({ context: { message: { from: "+15550123", phoneNumberId: "PHONE_NUMBER_ID", body: "hello" } } }) });
