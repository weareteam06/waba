"use client";

import { Client } from "@stomp/stompjs";
import { currentAccessToken, currentTenantId } from "@/lib/api-client";
import type { InboxEvent } from "@/lib/inbox-types";

export type RealtimeStatus = "connecting" | "live" | "offline";

export function connectInboxRealtime(onEvent: (event: InboxEvent) => void, onStatus?: (status: RealtimeStatus) => void) {
  const token = currentAccessToken();
  const tenantId = currentTenantId();
  onStatus?.("connecting");
  if (!token || !tenantId) {
    onStatus?.("offline");
    return () => undefined;
  }
  const client = new Client({
    brokerURL: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/inbox",
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 10000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      onStatus?.("live");
      client.subscribe(`/topic/inbox/tenant/${tenantId}`, (frame) => onEvent(JSON.parse(frame.body) as InboxEvent));
    },
    onDisconnect: () => onStatus?.("offline"),
    onWebSocketClose: () => onStatus?.("offline"),
    onWebSocketError: () => onStatus?.("offline"),
    onStompError: (frame) => {
      console.error("Inbox realtime error", frame.headers.message, frame.body);
      onStatus?.("offline");
      void client.deactivate();
    },
  });
  client.activate();
  return () => void client.deactivate();
}
