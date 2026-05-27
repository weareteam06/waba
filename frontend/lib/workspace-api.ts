"use client";

import { apiRequest } from "@/lib/api-client";

export type Tenant = { id: number; slug: string; name: string; status: string };
export type User = { id: number; displayName: string; email: string; status: string; roles: string[] };
export type Account = { id: number; phoneNumberId: string; wabaId: string; displayPhoneNumber: string | null };
export type WhatsAppReadiness = {
  graphVersion: string;
  accessTokenConfigured: boolean;
  appSecretConfigured: boolean;
  webhookVerifyTokenConfigured: boolean;
  webhookPath: string;
  mediaDownloadDirectory: string;
  maxSendAttempts: number;
};
export type Template = {
  id: number;
  wabaId: string;
  metaTemplateId: string | null;
  name: string;
  language: string;
  category: string;
  approvalStatus: string;
  componentsJson: string;
  syncedAt: string;
};
export type TemplateAnalytics = { snapshotDate: string; accepted: number; failed: number; delivered: number; read: number };
export type Campaign = {
  id: number;
  name: string;
  templateId: number;
  phoneNumberId: string;
  status: string;
  scheduledAt: string;
  totalRecipients: number;
  queued: number;
  sent: number;
  failed: number;
};
export type Message = {
  id: number;
  metaMessageId: string | null;
  phoneNumberId: string;
  recipient: string;
  body: string;
  direction: string;
  type: string;
  status: string;
  sendAttempts: number;
  lastError: string | null;
};

export const tenantMe = () => apiRequest<Tenant>("/api/v1/tenants/me");
export const users = () => apiRequest<User[]>("/api/v1/users");
export const createUser = (input: { displayName: string; email: string; password: string; roles: string[] }) =>
  apiRequest<User>("/api/v1/users", { method: "POST", body: JSON.stringify(input) });
export const accounts = () => apiRequest<Account[]>("/api/v1/whatsapp/accounts");
export const whatsappReadiness = () => apiRequest<WhatsAppReadiness>("/api/v1/whatsapp/accounts/readiness");
export const registerAccount = (input: { phoneNumberId: string; wabaId: string; displayPhoneNumber: string }) =>
  apiRequest<Account>("/api/v1/whatsapp/accounts", { method: "POST", body: JSON.stringify(input) });
export const messages = () => apiRequest<Message[]>("/api/v1/messages");

export const templates = (category = "", status = "") => {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  return apiRequest<Template[]>(`/api/v1/templates${params.size ? `?${params}` : ""}`);
};
export const createTemplate = (input: { phoneNumberId: string; name: string; language: string; category: string; components: unknown }) =>
  apiRequest<Template>("/api/v1/templates", { method: "POST", body: JSON.stringify(input) });
export const updateTemplate = (id: number, input: { phoneNumberId: string; name: string; language: string; category: string; components: unknown }) =>
  apiRequest<Template>(`/api/v1/templates/${id}`, { method: "PUT", body: JSON.stringify(input) });
export const deleteTemplate = (id: number) => apiRequest<void>(`/api/v1/templates/${id}`, { method: "DELETE" });
export const syncTemplates = (phoneNumberId: string) =>
  apiRequest<Template[]>("/api/v1/templates/sync", { method: "POST", body: JSON.stringify({ phoneNumberId }) });
export const templateAnalytics = (id: number) => apiRequest<TemplateAnalytics[]>(`/api/v1/templates/${id}/analytics`);
export const syncTemplateAnalytics = (id: number) => apiRequest<TemplateAnalytics[]>(`/api/v1/templates/${id}/analytics/sync`, { method: "POST" });

export const campaigns = () => apiRequest<Campaign[]>("/api/v1/campaigns");
export const createCampaign = (input: {
  name: string;
  templateId: number;
  phoneNumberId: string;
  scheduledAt: string;
  recipients: Array<{ recipient: string; parameters: unknown }>;
}) => apiRequest<Campaign>("/api/v1/campaigns", { method: "POST", body: JSON.stringify(input) });
