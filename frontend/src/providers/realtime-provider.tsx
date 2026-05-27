"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { loadConversations } from "@/lib/inbox-api";
import { connectInboxRealtime } from "@/lib/inbox-realtime";
import { currentAccessToken } from "@/lib/api-client";
import * as workspaceApi from "@/lib/workspace-api";
import { keys } from "@/src/services/workspace-queries";
import { useRealtimeStore } from "@/src/store/realtime-store";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const receiveInboxEvent = useRealtimeStore((state) => state.receiveInboxEvent);
  const addNotification = useRealtimeStore((state) => state.addNotification);
  const setStatus = useRealtimeStore((state) => state.setStatus);
  const bootstrapInboxUnread = useRealtimeStore((state) => state.bootstrapInboxUnread);
  const [sessionVersion, setSessionVersion] = useState(0);
  const campaignSnapshot = useRef(new Map<number, string>());
  const templateSnapshot = useRef(new Map<number, string>());
  const invalidationTimers = useRef(new Map<string, number>());
  const moduleCheckRunning = useRef(false);
  const lastNativeNotificationKey = useRef("");

  useEffect(() => {
    function refreshSessionVersion() {
      setSessionVersion((value) => value + 1);
    }
    window.addEventListener("wa-session-changed", refreshSessionVersion);
    window.addEventListener("online", refreshSessionVersion);
    window.addEventListener("offline", refreshSessionVersion);
    return () => {
      window.removeEventListener("wa-session-changed", refreshSessionVersion);
      window.removeEventListener("online", refreshSessionVersion);
      window.removeEventListener("offline", refreshSessionVersion);
    };
  }, []);

  useEffect(() => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    if (!currentAccessToken()) {
      setStatus("offline");
      return;
    }
    void loadConversations("ALL", "", 0)
      .then((page) => bootstrapInboxUnread(page.items))
      .catch(() => undefined);
    return connectInboxRealtime((event) => {
      receiveInboxEvent(event);
      if (event.type === "MESSAGE_CREATED" && event.message?.direction === "INBOUND" && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
        const notificationKey = `${event.conversationId}:${event.message.id}`;
        if (lastNativeNotificationKey.current !== notificationKey) {
          lastNativeNotificationKey.current = notificationKey;
          const contact = event.conversation?.contactName ?? event.conversation?.contactPhone ?? "New chat";
          new Notification("New inbox message", {
            body: event.message.body ? `${contact}: ${event.message.body}` : contact,
            icon: "/favicon.ico",
          });
        }
      }
      scheduleInvalidation(invalidationTimers.current, queryClient, "messages", keys.messages);
    }, setStatus);
  }, [bootstrapInboxUnread, queryClient, receiveInboxEvent, sessionVersion, setStatus]);

  useEffect(() => {
    if (!currentAccessToken()) return;
    let cancelled = false;

    async function checkModuleChanges(notify: boolean) {
      if (moduleCheckRunning.current) return;
      moduleCheckRunning.current = true;
      try {
        const [campaigns, templates] = await Promise.all([
          workspaceApi.campaigns(),
          workspaceApi.templates(),
        ]);
        if (cancelled) return;
        for (const campaign of campaigns) {
          const signature = `${campaign.status}:${campaign.queued}:${campaign.sent}:${campaign.failed}`;
          const previous = campaignSnapshot.current.get(campaign.id);
          if (notify && previous && previous !== signature) {
            addNotification({
              domain: "campaigns",
              title: "Campaign progress updated",
              detail: `${campaign.name}: ${campaign.status}, ${campaign.sent} sent, ${campaign.failed} failed`,
              href: "/campaigns",
            });
            scheduleInvalidation(invalidationTimers.current, queryClient, "campaigns", keys.campaigns);
          }
          campaignSnapshot.current.set(campaign.id, signature);
        }
        for (const template of templates) {
          const signature = `${template.approvalStatus}:${template.syncedAt}`;
          const previous = templateSnapshot.current.get(template.id);
          if (notify && previous && previous !== signature) {
            addNotification({
              domain: "templates",
              title: "Template status updated",
              detail: `${template.name}: ${template.approvalStatus}`,
              href: "/templates",
            });
            scheduleInvalidation(invalidationTimers.current, queryClient, "templates", keys.templates());
            scheduleInvalidation(invalidationTimers.current, queryClient, "enterprise-templates", ["enterprise-templates"]);
          }
          templateSnapshot.current.set(template.id, signature);
        }
      } catch {
        // Keep the global listener quiet; page-level loaders/errors still handle visible failures.
      } finally {
        moduleCheckRunning.current = false;
      }
    }

    void checkModuleChanges(false);
    let timer: number | null = null;
    function scheduleNextCheck() {
      timer = window.setTimeout(() => {
        void checkModuleChanges(true).finally(scheduleNextCheck);
      }, document.visibilityState === "visible" ? 30000 : 120000);
    }
    scheduleNextCheck();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [addNotification, queryClient, sessionVersion]);

  return children;
}

function scheduleInvalidation(
  timers: Map<string, number>,
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  queryKey: readonly unknown[],
) {
  if (timers.has(id)) return;
  timers.set(id, window.setTimeout(() => {
    timers.delete(id);
    void queryClient.invalidateQueries({ queryKey });
  }, document.visibilityState === "visible" ? 750 : 3000));
}
