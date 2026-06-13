"use client";

import { useState, useEffect } from "react";

/** Web-push supported in this browser. Safe to call during render/effects. */
export function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window
  );
}

/**
 * Register the push service worker, subscribe, and persist the subscription.
 * Returns true on success. Shared by the Settings toggle and the post-login
 * prompt so the subscribe flow has a single source of truth.
 */
export async function subscribeToPush(): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;
  const reg = await navigator.serviceWorker.register("/sw-push.js");
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  });
  const res = await fetch("/api/notifications/push-subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  return res.ok;
}

export function PushSubscribeButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const handleToggle = async () => {
    if (!supported) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.register("/sw-push.js");
      await navigator.serviceWorker.ready;

      if (subscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/notifications/push-subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } else {
        // Subscribe (shared flow)
        const ok = await subscribeToPush();
        setSubscribed(ok);
      }
    } catch (err) {
      console.error("Push subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        subscribed
          ? "bg-green-900/30 text-green-400 hover:bg-red-900/30 hover:text-red-400"
          : "bg-gray-800 text-gray-400 hover:bg-blue-900/30 hover:text-blue-400"
      }`}
    >
      {loading ? "..." : subscribed ? "Push ON" : "Enable Push"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
