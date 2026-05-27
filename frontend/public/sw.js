self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "WA Command", body: event.data ? event.data.text() : "New activity" };
  }
  const title = payload.title || "WA Command";
  const options = {
    body: payload.body || payload.detail || "New activity",
    data: { url: payload.url || "/inbox" },
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.tag || "wa-command",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/inbox";
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clientsList.find((client) => "focus" in client);
    if (existing) {
      await existing.navigate(url);
      return existing.focus();
    }
    return clients.openWindow(url);
  })());
});
