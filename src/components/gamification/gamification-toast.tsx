"use client";

import { useState, useEffect, useCallback } from "react";

interface ToastEvent {
  id: string;
  type: "level_up" | "achievement" | "xp";
  title: string;
  description: string;
}

let addToastFn: ((event: Omit<ToastEvent, "id">) => void) | null = null;

export function showGamificationToast(event: Omit<ToastEvent, "id">) {
  addToastFn?.(event);
}

export function GamificationToastContainer() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  const addToast = useCallback((event: Omit<ToastEvent, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...event, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-slide-in-right rounded-xl border p-4 shadow-2xl backdrop-blur-sm ${
            toast.type === "level_up"
              ? "border-yellow-500/50 bg-yellow-900/90"
              : toast.type === "achievement"
                ? "border-green-500/50 bg-green-900/90"
                : "border-purple-500/50 bg-purple-900/90"
          }`}
          style={{
            animation: "slideInRight 0.3s ease-out, fadeOut 0.5s ease-in 4.5s forwards",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {toast.type === "level_up"
                ? "\u2B50"
                : toast.type === "achievement"
                  ? "\u{1F3C6}"
                  : "\u{1F4AB}"}
            </span>
            <div>
              <p className="text-sm font-bold text-white">{toast.title}</p>
              <p className="text-xs text-gray-300">{toast.description}</p>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
