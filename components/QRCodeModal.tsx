"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, QrCode, ImageOff } from "lucide-react";

export default function QRCodeModal({
  url,
  roomCode,
  onClose,
}: {
  url: string;
  roomCode: string;
  onClose: () => void;
}) {
  const [qrFailed, setQrFailed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape, trap focus between close/download buttons
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const first = closeButtonRef.current;
        const last = downloadButtonRef.current;
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    closeButtonRef.current?.focus();
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
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
            <QrCode size={18} color="var(--accent)" aria-hidden="true" />
            <h3 id="qr-modal-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Share Room
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close QR modal"
            className="icon-button-plain"
            style={{
              color: "var(--text-secondary)",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code */}
        <div className="qr-container" style={{ marginBottom: 16 }}>
          {qrFailed ? (
            <div
              role="alert"
              style={{
                width: 250,
                height: 250,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "var(--qr-fg)",
              }}
            >
              <ImageOff size={28} aria-hidden="true" />
              <span style={{ fontSize: 13 }}>QR code failed to load.</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrApiUrl}
              alt={`QR code for room ${roomCode}`}
              width={250}
              height={250}
              style={{ borderRadius: 8 }}
              onError={() => setQrFailed(true)}
            />
          )}
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
          ref={downloadButtonRef}
          className="btn-primary"
          onClick={downloadQR}
          disabled={qrFailed}
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
