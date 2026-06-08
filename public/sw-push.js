// Service Worker for Web Push Notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Tutor";
  // Sender nests the click target + escalation id under `data` (see
  // notifications/service.ts). Fall back to a flat `data.url` for older payloads.
  const payloadData = data.data || {};
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: payloadData.url || data.url || "/",
      escalationEventId: payloadData.escalationEventId,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || "/";

  // Push-first cost gate: ACK this escalation so the engine skips the next
  // (paid) WhatsApp/SMS step. Best-effort — never block opening the window.
  const ack = data.escalationEventId
    ? fetch("/api/escalation/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalationEventId: data.escalationEventId }),
        keepalive: true,
      }).catch(() => {})
    : Promise.resolve();

  // Open the window in parallel with the ACK — do NOT chain openWindow after the
  // fetch, or some browsers treat the (delayed) openWindow as not user-initiated
  // and block it.
  event.waitUntil(Promise.all([ack, clients.openWindow(url)]));
});
