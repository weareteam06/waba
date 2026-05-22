"use client";

import { Client } from "@stomp/stompjs";
import { currentAccessToken, currentTenantId } from "@/lib/api-client";
import type { InboxEvent } from "@/lib/inbox-types";

export function connectInboxRealtime(onEvent: (event: InboxEvent) => void) {
  const token = currentAccessToken();
  const tenantId = currentTenantId();
  const client = new Client({
    brokerURL: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/inbox",
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(`/topic/inbox/tenant/${tenantId}`, (frame) => onEvent(JSON.parse(frame.body) as InboxEvent));
    },
  });
  client.activate();
  return () => void client.deactivate();
}
