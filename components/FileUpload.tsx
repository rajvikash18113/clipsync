"use client";

import { useState, useRef } from "react";
import { Paperclip, Upload, X } from "lucide-react";
import { supabase, STORAGE_BUCKET } from "@/utils/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload({
  roomCode,
  onUploadComplete,
  addToast,
}: {
  roomCode: string;
  onUploadComplete: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      addToast(`File too large. Maximum size is 10MB.`, "error");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop() || "bin";
    const filePath = `${roomCode}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        addToast(
          uploadError.message.includes("bucket")
            ? "File storage not configured. Create a 'clip-files' bucket in Supabase."
            : `Upload failed: ${uploadError.message}`,
          "error"
        );
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const fileContent = `[FILE]${JSON.stringify({
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      })}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from("clips") as any)
        .insert([{ room_code: roomCode, content: fileContent }]);

      if (insertError) {
        addToast(`Failed to save file clip: ${insertError.message}`, "error");
      } else {
        addToast(`Uploaded ${file.name}`, "success");
        onUploadComplete();
      }
    } catch (err) {
      console.error("Upload error:", err);
      addToast("Upload failed. Please try again.", "error");
    }

    setUploading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so the same file can be uploaded again
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-disabled={uploading}
      aria-busy={uploading}
      onClick={() => !uploading && fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (!uploading && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!uploading) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        borderColor: dragOver ? "var(--accent)" : undefined,
        background: dragOver ? "rgba(108,99,255,0.08)" : undefined,
        opacity: uploading ? 0.6 : 1,
        cursor: uploading ? "wait" : "pointer",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: "none" }}
        aria-label="Upload file"
      />
      {uploading ? (
        <>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "2px solid var(--accent-glow)",
              borderTopColor: "var(--accent)",
              animation: "spin-slow 0.8s linear infinite",
            }}
          />
          <span>Uploading...</span>
        </>
      ) : (
        <>
          {dragOver ? <Upload size={14} /> : <Paperclip size={14} />}
          <span>{dragOver ? "Drop file here" : "Upload file"}</span>
          <span
            style={{
              fontSize: 10,
              opacity: 0.5,
              marginLeft: 4,
            }}
          >
            Max 10MB
          </span>
        </>
      )}
    </div>
  );
}
