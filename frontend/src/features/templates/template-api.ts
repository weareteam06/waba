import * as api from "@/lib/workspace-api";
import type { ButtonType, EnterpriseTemplate, HeaderType, TemplateButton, TemplateCategory, TemplateFormValues, TemplateStatus } from "./types";

type MetaComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type?: string; text?: string; url?: string; phone_number?: string; example?: string[] }>;
};

const fallbackHistory = [
  { id: "synced", label: "Local catalog", detail: "Synced from backend", at: "Now" },
];

export async function fetchEnterpriseTemplates() {
  const [templates, accounts] = await Promise.all([api.templates(), api.accounts().catch(() => [])]);
  const accountByWaba = new Map(accounts.map((account) => [account.wabaId, account]));
  return templates.map((template) => toEnterpriseTemplate(template, accountByWaba.get(template.wabaId)?.phoneNumberId));
}

export async function fetchTemplateAccounts() {
  return api.accounts();
}

export async function saveEnterpriseTemplate(template: EnterpriseTemplate) {
  const phoneNumberId = template.phoneNumberId || (await firstPhoneNumberId());
  const input = {
    phoneNumberId,
    name: template.name,
    language: toBackendLanguage(template.language),
    category: toBackendCategory(template.category),
    components: toMetaComponents(template),
  };

  const saved = template.backendId
    ? await api.updateTemplate(template.backendId, input)
    : await api.createTemplate(input);

  return toEnterpriseTemplate(saved, phoneNumberId);
}

export async function deleteEnterpriseTemplate(template: EnterpriseTemplate) {
  if (!template.backendId) return;
  await api.deleteTemplate(template.backendId);
}

export async function syncEnterpriseTemplates(phoneNumberId?: string) {
  const selectedPhoneNumberId = phoneNumberId || (await firstPhoneNumberId());
  const synced = await api.syncTemplates(selectedPhoneNumberId);
  return synced.map((template) => toEnterpriseTemplate(template, selectedPhoneNumberId));
}

export function createDraftTemplate(phoneNumberId?: string): EnterpriseTemplate {
  return {
    id: `draft-${crypto.randomUUID()}`,
    phoneNumberId,
    name: "new_template",
    category: "Utility",
    status: "Draft",
    language: "English (US)",
    headerType: "none",
    headerText: "",
    mediaUrl: "",
    mediaPreviewUrl: "",
    mediaFileName: "",
    mediaMimeType: "",
    body: "Hello {{first_name}}, your update is ready.",
    footer: "",
    buttons: [],
    variables: ["first_name"],
    updatedAt: "Draft",
    quality: 72,
    insight: emptyInsight(72),
    history: [{ id: "draft", label: "Draft created", detail: "Not submitted to backend yet", at: "Now" }],
  };
}

function toEnterpriseTemplate(template: api.Template, phoneNumberId?: string): EnterpriseTemplate {
  const components = parseComponents(template.componentsJson);
  const body = componentText(components, "BODY") || "No template body available.";
  const header = components.find((item) => item.type === "HEADER");
  const footer = componentText(components, "FOOTER");
  const buttons = toButtons(components);
  const status = toUiStatus(template.approvalStatus);
  const quality = status === "Approved" ? 92 : status === "Rejected" ? 42 : status === "Paused" ? 70 : 76;

  return {
    id: String(template.id),
    backendId: template.id,
    phoneNumberId,
    wabaId: template.wabaId,
    metaTemplateId: template.metaTemplateId,
    name: template.name,
    category: toUiCategory(template.category),
    status,
    language: toUiLanguage(template.language),
    headerType: toHeaderType(header),
    headerText: header?.format === "TEXT" ? header.text ?? "" : "",
    mediaUrl: "",
    mediaPreviewUrl: "",
    mediaFileName: "",
    mediaMimeType: "",
    body,
    footer,
    buttons,
    variables: extractVariables(body),
    updatedAt: relativeDate(template.syncedAt),
    quality,
    insight: emptyInsight(quality),
    history: [
      { id: "status", label: "Meta status", detail: status, at: relativeDate(template.syncedAt) },
      ...fallbackHistory,
    ],
  };
}

function toMetaComponents(template: EnterpriseTemplate) {
  const components: MetaComponent[] = [];
  if (template.headerType === "text" && template.headerText) {
    components.push({ type: "HEADER", format: "TEXT", text: template.headerText });
  } else if (["image", "video", "document"].includes(template.headerType)) {
    components.push({ type: "HEADER", format: template.headerType.toUpperCase() });
  }

  components.push({ type: "BODY", text: template.body });
  if (template.footer) components.push({ type: "FOOTER", text: template.footer });
  if (template.buttons.length) {
    components.push({
      type: "BUTTONS",
      buttons: template.buttons.map((button) => ({
        type: toBackendButtonType(button.type),
        text: button.label,
        url: button.type === "url" ? button.value : undefined,
        phone_number: button.type === "phone" ? button.value : undefined,
        example: button.type === "coupon" ? [button.value] : undefined,
      })),
    });
  }

  return components;
}

async function firstPhoneNumberId() {
  const accounts = await api.accounts();
  const phoneNumberId = accounts[0]?.phoneNumberId;
  if (!phoneNumberId) throw new Error("Register a WhatsApp account in Settings before creating templates.");
  return phoneNumberId;
}

function parseComponents(value: string): MetaComponent[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function componentText(components: MetaComponent[], type: string) {
  return components.find((item) => item.type === type)?.text ?? "";
}

function toButtons(components: MetaComponent[]): TemplateButton[] {
  const buttons = components.find((item) => item.type === "BUTTONS")?.buttons ?? [];
  return buttons.map((button, index) => ({
    id: `button-${index}`,
    type: toUiButtonType(button.type),
    label: button.text || "Reply",
    value: button.url || button.phone_number || button.example?.[0] || "",
  }));
}

function toHeaderType(component?: MetaComponent): HeaderType {
  if (!component) return "none";
  if (component.format === "TEXT") return "text";
  if (component.format === "IMAGE") return "image";
  if (component.format === "VIDEO") return "video";
  if (component.format === "DOCUMENT") return "document";
  return "none";
}

function toUiCategory(value: string): TemplateCategory {
  if (value === "MARKETING") return "Marketing";
  if (value === "AUTHENTICATION") return "Authentication";
  return "Utility";
}

function toBackendCategory(value: TemplateCategory) {
  return value.toUpperCase();
}

function toUiStatus(value: string): TemplateStatus {
  if (value === "APPROVED") return "Approved";
  if (value === "REJECTED") return "Rejected";
  if (value === "PAUSED") return "Paused";
  if (value === "DRAFT") return "Draft";
  return "Pending";
}

function toUiLanguage(value: string) {
  if (value === "en_US") return "English (US)";
  if (value === "en_GB") return "English (UK)";
  if (value === "hi") return "Hindi";
  if (value === "es") return "Spanish";
  if (value === "pt_BR") return "Portuguese";
  if (value === "ar") return "Arabic";
  return value || "English (US)";
}

function toBackendLanguage(value: string) {
  const map: Record<string, string> = {
    "English (US)": "en_US",
    "English (UK)": "en_GB",
    Hindi: "hi",
    Spanish: "es",
    Portuguese: "pt_BR",
    Arabic: "ar",
  };
  return map[value] ?? value;
}

function toUiButtonType(value?: string): ButtonType {
  if (value === "URL") return "url";
  if (value === "PHONE_NUMBER") return "phone";
  if (value === "COPY_CODE") return "coupon";
  return "quick_reply";
}

function toBackendButtonType(value: ButtonType) {
  if (value === "url") return "URL";
  if (value === "phone") return "PHONE_NUMBER";
  if (value === "coupon") return "COPY_CODE";
  return "QUICK_REPLY";
}

function extractVariables(value: string) {
  return Array.from(value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map((match) => match[1]);
}

function emptyInsight(quality: number) {
  return { quality, delivered: 0, readRate: 0, clickRate: 0, usage: 0, campaigns: 0, rejectionReasons: [] };
}

function relativeDate(value: string) {
  if (!value) return "Not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}
