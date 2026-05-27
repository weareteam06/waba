"use client";

import { create } from "zustand";
import type { InboxEvent } from "@/lib/inbox-types";
import type { RealtimeStatus } from "@/lib/inbox-realtime";

export type RealtimeDomain = "dashboard" | "inbox" | "campaigns" | "templates" | "analytics";

export type RealtimeNotification = {
  id: string;
  domain: RealtimeDomain;
  title: string;
  detail: string;
  href: string;
  createdAt: string;
  read: boolean;
};

type RealtimeState = {
  status: RealtimeStatus;
  lastInboxEvent: InboxEvent | null;
  notifications: RealtimeNotification[];
  unreadByConversation: Record<number, number>;
  recentEventKeys: Record<string, number>;
  setStatus: (status: RealtimeStatus) => void;
  bootstrapInboxUnread: (items: Array<{ id: number; unreadCount: number }>) => void;
  receiveInboxEvent: (event: InboxEvent) => void;
  addNotification: (notification: Omit<RealtimeNotification, "id" | "createdAt" | "read">) => void;
  markNotificationsRead: () => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: "connecting",
  lastInboxEvent: null,
  notifications: [],
  unreadByConversation: {},
  recentEventKeys: {},
  setStatus: (status) => set({ status }),
  bootstrapInboxUnread: (items) => set({
    unreadByConversation: Object.fromEntries(items.map((item) => [item.id, item.unreadCount])),
  }),
  receiveInboxEvent: (event) => set((state) => {
    const eventKey = inboxEventKey(event);
    const now = Date.now();
    if (state.recentEventKeys[eventKey] && now - state.recentEventKeys[eventKey] < 30000) {
      return state;
    }
    const unreadByConversation = { ...state.unreadByConversation };
    if (event.type === "CONVERSATION_DELETED") delete unreadByConversation[event.conversationId];
    if (event.conversation) unreadByConversation[event.conversation.id] = event.conversation.unreadCount;
    const notify = shouldNotifyInboxEvent(event);
    const nextNotification = notify ? notificationFromInboxEvent(event) : null;
    return {
      lastInboxEvent: event,
      unreadByConversation,
      recentEventKeys: pruneRecentKeys({ ...state.recentEventKeys, [eventKey]: now }, now),
      notifications: !nextNotification || hasRecentNotification(state.notifications, nextNotification)
        ? state.notifications
        : [nextNotification, ...state.notifications].slice(0, 40),
    };
  }),
  addNotification: (notification) => set((state) => ({
    notifications: hasRecentNotification(state.notifications, notification)
      ? state.notifications
      : [{
      ...notification,
      id: `${notification.domain}-${Date.now()}-${state.notifications.length}`,
      createdAt: new Date().toISOString(),
      read: false,
    }, ...state.notifications].slice(0, 40),
  })),
  markNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((item) => ({ ...item, read: true })),
  })),
}));

export function inboxBadgeCount(state: Pick<RealtimeState, "unreadByConversation">) {
  return Object.values(state.unreadByConversation).reduce((total, value) => total + value, 0);
}

export function unreadNotificationCount(state: Pick<RealtimeState, "notifications">) {
  return state.notifications.filter((item) => !item.read).length;
}

export function unreadDomainNotificationCount(domain: RealtimeDomain) {
  return (state: Pick<RealtimeState, "notifications">) =>
    state.notifications.filter((item) => !item.read && item.domain === domain).length;
}

function notificationFromInboxEvent(event: InboxEvent): RealtimeNotification {
  const contact = event.conversation?.contactName ?? event.conversation?.contactPhone ?? `Chat ${event.conversationId}`;
  const message = event.message?.body?.trim();
  return {
    id: `${event.type}-${event.conversationId}-${event.deletedMessageId ?? event.message?.id ?? Date.now()}`,
    domain: "inbox",
    title: "New inbox message",
    detail: message ? `${contact}: ${message}` : contact,
    href: "/inbox",
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function shouldNotifyInboxEvent(event: InboxEvent) {
  return event.type === "MESSAGE_CREATED" && event.message?.direction === "INBOUND";
}

function inboxEventKey(event: InboxEvent) {
  return [
    event.type,
    event.conversationId,
    event.deletedMessageId ?? "",
    event.message?.id ?? "",
    event.message?.status ?? "",
    event.message?.lastError ?? "",
    event.typing ?? "",
  ].join(":");
}

function pruneRecentKeys(values: Record<string, number>, now: number) {
  return Object.fromEntries(Object.entries(values).filter(([, timestamp]) => now - timestamp < 60000));
}

function hasRecentNotification(
  existing: RealtimeNotification[],
  incoming: Pick<RealtimeNotification, "domain" | "title" | "detail">,
) {
  const cutoff = Date.now() - 60000;
  return existing.some((item) =>
    item.domain === incoming.domain
    && item.title === incoming.title
    && item.detail === incoming.detail
    && Date.parse(item.createdAt) > cutoff);
}
