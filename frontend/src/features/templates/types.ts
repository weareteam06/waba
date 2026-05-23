export type TemplateCategory = "Marketing" | "Utility" | "Authentication";
export type TemplateStatus = "Approved" | "Pending" | "Rejected" | "Draft" | "Paused";
export type HeaderType = "none" | "text" | "image" | "video" | "document";
export type ButtonType = "quick_reply" | "url" | "phone" | "coupon";
export type PreviewDevice = "iphone" | "android";
export type PreviewTheme = "dark" | "light";

export type TemplateButton = {
  id: string;
  type: ButtonType;
  label: string;
  value: string;
};

export type TemplateInsight = {
  quality: number;
  delivered: number;
  readRate: number;
  clickRate: number;
  usage: number;
  campaigns: number;
  rejectionReasons: string[];
};

export type TemplateHistoryItem = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

export type EnterpriseTemplate = {
  id: string;
  backendId?: number;
  phoneNumberId?: string;
  wabaId?: string;
  metaTemplateId?: string | null;
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  language: string;
  headerType: HeaderType;
  headerText: string;
  mediaUrl: string;
  mediaPreviewUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
  variables: string[];
  updatedAt: string;
  quality: number;
  insight: TemplateInsight;
  history: TemplateHistoryItem[];
};

export type TemplateFormValues = {
  name: string;
  category: TemplateCategory;
  language: string;
  headerType: HeaderType;
  headerText: string;
  mediaUrl: string;
  mediaPreviewUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
};
