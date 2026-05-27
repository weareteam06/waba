"use client";

import { apiRequest } from "@/lib/api-client";

type PushStatus = {
  vapidPublicKey: string | null;
  configured: boolean;
};

type SerializedPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
};

export async function loadPushStatus() {
  return apiRequest<PushStatus>("/api/v1/push/status");
}

export async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("This browser does not support push notifications.");
  }
  const status = await loadPushStatus();
  if (!status.configured || !status.vapidPublicKey) {
    throw new Error("Push notifications need PUSH_VAPID_PUBLIC_KEY on the backend.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }
  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(status.vapidPublicKey),
  });
  await savePushSubscription(subscription);
  return subscription;
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await apiRequest<void>("/api/v1/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify(serializeSubscription(subscription)),
  }).catch(() => undefined);
  await subscription.unsubscribe();
}

export async function currentPushPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

async function savePushSubscription(subscription: PushSubscription) {
  await apiRequest<void>("/api/v1/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(serializeSubscription(subscription)),
  });
}

function serializeSubscription(subscription: PushSubscription): SerializedPushSubscription {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
    userAgent: navigator.userAgent,
  };
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
