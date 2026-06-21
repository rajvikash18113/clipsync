"use client";

import { X } from "lucide-react";

export type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: "min(360px, calc(100vw - 48px))",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className="animate-fade-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 10,
            background:
              t.type === "error"
                ? "rgba(239,68,68,0.15)"
                : t.type === "success"
                ? "rgba(34,197,94,0.15)"
                : "rgba(108,99,255,0.15)",
            border: `1px solid ${
              t.type === "error"
                ? "rgba(239,68,68,0.3)"
                : t.type === "success"
                ? "rgba(34,197,94,0.3)"
                : "rgba(108,99,255,0.3)"
            }`,
            backdropFilter: "blur(16px)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label={`Dismiss: ${t.message.slice(0, 40)}`}
            className="icon-button-plain"
            style={{
              color: "var(--text-secondary)",
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
