"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileJson } from "lucide-react";
import type { Clip } from "@/utils/supabase/client";
import { parseFileClip } from "@/utils/supabase/client";

export default function ExportButton({ clips }: { clips: Clip[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportAsText() {
    const lines = clips.map((clip, i) => {
      const fileMeta = parseFileClip(clip.content);
      const content = fileMeta ? `[File: ${fileMeta.name}] ${fileMeta.url}` : clip.content;
      return `--- Clip ${i + 1} (${new Date(clip.created_at).toLocaleString()}) ---\n${content}`;
    });
    downloadFile(lines.join("\n\n"), "clipsync-export.txt", "text/plain");
  }

  function exportAsJson() {
    const data = clips.map((clip) => {
      const fileMeta = parseFileClip(clip.content);
      return {
        id: clip.id,
        content: fileMeta ? fileMeta : clip.content,
        type: fileMeta ? "file" : "text",
        created_at: clip.created_at,
        room_code: clip.room_code,
      };
    });
    downloadFile(
      JSON.stringify(data, null, 2),
      "clipsync-export.json",
      "application/json"
    );
  }

  if (clips.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn-icon"
        onClick={() => setOpen(!open)}
        title="Export clips"
        aria-label="Export clips"
        style={{ width: 36, height: 36 }}
      >
        <Download size={15} />
      </button>

      {open && (
        <div className="dropdown-menu animate-fade-down">
          <button className="dropdown-item" onClick={exportAsText}>
            <FileText size={14} />
            Export as .txt
          </button>
          <button className="dropdown-item" onClick={exportAsJson}>
            <FileJson size={14} />
            Export as .json
          </button>
        </div>
      )}
    </div>
  );
}
