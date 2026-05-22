"use client";

import { useEffect } from "react";
import { X, Download, QrCode } from "lucide-react";

export default function QRCodeModal({
  url,
  roomCode,
  onClose,
}: {
  url: string;
  roomCode: string;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&format=png&margin=10`;

  async function downloadQR() {
    try {
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `clipsync-room-${roomCode}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(qrApiUrl, "_blank");
    }
  }

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
      onClick={onClose}
    >
      <div
        className="glass animate-scale-in"
        style={{
          width: "100%",
          maxWidth: 360,
          padding: 28,
          borderRadius: 14,
          background: "var(--bg-card)",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <QrCode size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Share Room
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close QR modal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code */}
        <div className="qr-container" style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrApiUrl}
            alt={`QR code for room ${roomCode}`}
            width={250}
            height={250}
            style={{ borderRadius: 8 }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Room info */}
        <p
          className="font-mono"
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 4,
            wordBreak: "break-all",
          }}
        >
          {url}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            opacity: 0.6,
            marginBottom: 20,
          }}
        >
          Scan to join room{" "}
          <span style={{ fontWeight: 700, color: "var(--accent)" }}>
            {roomCode}
          </span>
        </p>

        {/* Download button */}
        <button
          className="btn-primary"
          onClick={downloadQR}
          style={{
            width: "100%",
            padding: "10px",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          <Download size={14} />
          Download QR Code
        </button>
      </div>
    </div>
  );
}
