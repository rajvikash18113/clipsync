"use client";

import { useEffect } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay-bg)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        className="glass animate-scale-in"
        style={{
          width: "100%",
          maxWidth: 380,
          padding: 28,
          borderRadius: 14,
          background: "var(--bg-card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(239,68,68,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={20} color="#f87171" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Delete Clip
          </h3>
        </div>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          Are you sure you want to delete this clip? It will be removed from
          your view.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-ghost"
            onClick={onCancel}
            aria-label="Cancel deletion"
            style={{
              flex: 1,
              padding: "10px",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            aria-label="Confirm deletion"
            style={{
              flex: 1,
              padding: "10px",
              justifyContent: "center",
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "0 4px 24px rgba(239,68,68,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
