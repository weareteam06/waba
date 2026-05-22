export type ConversationFilter = "ALL" | "UNREAD" | "ASSIGNED_TO_ME" | "UNASSIGNED";

export type Conversation = {
  id: number;
  phoneNumberId: string;
  contactPhone: string;
  contactName: string | null;
  assignedAgentId: number | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
};

export type InboxMessage = {
  id: number | string;
  conversationId: number;
  clientMessageId: string | null;
  metaMessageId: string | null;
  direction: "INBOUND" | "OUTBOUND";
  type: string;
  body: string;
  status: string;
  mediaMimeType: string | null;
  mediaUrl: string | null;
  createdAt: string;
  optimistic?: boolean;
};

export type Page<T> = {
  items: T[];
  hasMore: boolean;
  nextPage: number;
};

export type InboxEvent = {
  tenantId: number;
  type: "CONVERSATION_CHANGED" | "MESSAGE_CREATED" | "MESSAGE_STATUS_CHANGED" | "TYPING_CHANGED";
  conversationId: number;
  conversation: Conversation | null;
  message: InboxMessage | null;
  actorId: number | null;
  typing: boolean | null;
};
