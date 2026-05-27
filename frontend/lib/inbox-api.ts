import type { Conversation, ConversationFilter, InboxMessage, Page, StartConversationResult } from "@/lib/inbox-types";
import { apiRequest, currentAccessToken } from "@/lib/api-client";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const request = apiRequest;

export function loadConversations(filter: ConversationFilter, query: string, page: number) {
  const params = new URLSearchParams({ filter, page: String(page), size: "24" });
  if (query.trim()) params.set("query", query.trim());
  return request<Page<Conversation>>(`/api/v1/inbox/conversations?${params}`);
}

export function loadMessages(conversationId: number, page: number) {
  return request<Page<InboxMessage>>(`/api/v1/inbox/conversations/${conversationId}/messages?page=${page}&size=24`);
}

export function sendMessage(conversationId: number, body: string, clientMessageId: string) {
  return request<InboxMessage>(`/api/v1/inbox/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body, clientMessageId }),
  });
}

export function startConversation(input: {
  phoneNumberId: string;
  recipient: string;
  contactName?: string;
  body: string;
  clientMessageId: string;
}) {
  return request<StartConversationResult>("/api/v1/inbox/conversations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markRead(conversationId: number) {
  return request<Conversation>(`/api/v1/inbox/conversations/${conversationId}/read`, { method: "POST" });
}

export function assignConversation(conversationId: number, agentId: number) {
  return request<Conversation>(`/api/v1/inbox/conversations/${conversationId}/assignment`, {
    method: "PATCH",
    body: JSON.stringify({ agentId }),
  });
}

export function deleteConversation(conversationId: number) {
  return request<void>(`/api/v1/inbox/conversations/${conversationId}`, { method: "DELETE" });
}

export function deleteMessage(conversationId: number, messageId: number) {
  return request<void>(`/api/v1/inbox/conversations/${conversationId}/messages/${messageId}`, { method: "DELETE" });
}

export function publishTyping(conversationId: number, typing: boolean) {
  return request<void>(`/api/v1/inbox/conversations/${conversationId}/typing`, {
    method: "POST",
    body: JSON.stringify({ typing }),
  });
}

export async function loadMediaPreview(mediaUrl: string) {
  const response = await fetch(`${apiBase}${mediaUrl}`, {
    headers: currentAccessToken() ? { Authorization: `Bearer ${currentAccessToken()}` } : {},
  });
  if (!response.ok) throw new Error("Media preview failed.");
  return URL.createObjectURL(await response.blob());
}
