"use client";

import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Trash2,
  Clock,
  Code2,
  Link,
  AlignLeft,
  Pin,
  Tag,
  X,
  Download,
  FileIcon,
  ImageIcon,
} from "lucide-react";
import { type Clip, parseFileClip, formatFileSize } from "@/utils/supabase/client";

const QUICK_TAGS = ["important", "code", "link", "temp", "work", "personal"];

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function detectType(text: string): "link" | "code" | "text" | "file" {
  if (text.startsWith("[FILE]")) return "file";
  if (/^https?:\/\//i.test(text.trim())) return "link";
  if (
    /[{}()[\];]/.test(text) ||
    /^\s*(function|const|let|var|class|import|def |#include)/.test(text)
  )
    return "code";
  return "text";
}

export default function ClipCard({
  clip,
  onDelete,
  isPinned,
  onTogglePin,
  tags,
  onAddTag,
  onRemoveTag,
}: {
  clip: Clip;
  onDelete: (id: string) => void;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
  tags: string[];
  onAddTag: (clipId: string, tag: string) => void;
  onRemoveTag: (clipId: string, tag: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  const type = detectType(clip.content);
  const fileMeta = type === "file" ? parseFileClip(clip.content) : null;
  const isImage = fileMeta?.type?.startsWith("image/");

  // Focus tag input when shown
  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  // Close tag input on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        tagContainerRef.current &&
        !tagContainerRef.current.contains(e.target as Node)
      ) {
        setShowTagInput(false);
      }
    }
    if (showTagInput) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTagInput]);

  async function copyToClipboard() {
    const text = fileMeta ? fileMeta.url : clip.content;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onAddTag(clip.id, tag);
    }
    setTagInput("");
  }

  const typeConfig = {
    link: { Icon: Link, color: "#38bdf8", label: "link" },
    code: { Icon: Code2, color: "#a78bfa", label: "code" },
    text: { Icon: AlignLeft, color: "var(--accent)", label: "text" },
    file: {
      Icon: isImage ? ImageIcon : FileIcon,
      color: "#f59e0b",
      label: "file",
    },
  };
  const { Icon: TypeIcon, color: typeColor, label: typeLabel } = typeConfig[type];

  return (
    <div
      className={`glass animate-fade-up ${isPinned ? "clip-pinned" : ""}`}
      style={{
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 0.2s, box-shadow 0.2s",
        borderColor: isPinned
          ? "rgba(245,158,11,0.25)"
          : "rgba(255,255,255,0.05)",
        borderRadius: 10,
      }}
      onMouseEnter={(e) => {
        if (!isPinned)
          e.currentTarget.style.borderColor = "rgba(108,99,255,0.25)";
      }}
      onMouseLeave={(e) => {
        if (!isPinned)
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <TypeIcon size={12} color={typeColor} />
            <span
              style={{
                fontSize: 10,
                color: typeColor,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {typeLabel}
            </span>
            {isPinned && (
              <Pin
                size={10}
                color="var(--pin-color)"
                style={{ marginLeft: 2 }}
                fill="var(--pin-color)"
              />
            )}
          </div>

          {/* Content */}
          {type === "file" && fileMeta ? (
            <div className="file-preview">
              {isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={fileMeta.url}
                  alt={fileMeta.name}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    background: "rgba(245,158,11,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileIcon size={20} color="#f59e0b" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fileMeta.name}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    margin: "2px 0 0",
                  }}
                >
                  {formatFileSize(fileMeta.size)}
                </p>
              </div>
              <a
                href={fileMeta.url}
                target="_blank"
                rel="noopener noreferrer"
                download={fileMeta.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(108,99,255,0.1)",
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
                title="Download file"
              >
                <Download size={14} />
              </a>
            </div>
          ) : (
            <div className="clip-content-wrapper">
              <pre
                style={{
                  fontFamily:
                    type === "code"
                      ? '"JetBrains Mono", monospace'
                      : "inherit",
                  fontSize: type === "code" ? 13 : 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {clip.content}
              </pre>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="clip-actions"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flexShrink: 0,
          }}
        >
          {/* Pin */}
          <button
            onClick={() => onTogglePin(clip.id)}
            title={isPinned ? "Unpin" : "Pin to top"}
            aria-label={isPinned ? "Unpin clip" : "Pin clip to top"}
            className={`btn-icon ${isPinned ? "animate-pin-bounce" : ""}`}
            style={{
              color: isPinned ? "var(--pin-color)" : "var(--text-secondary)",
              background: isPinned
                ? "rgba(245,158,11,0.12)"
                : "rgba(255,255,255,0.03)",
            }}
          >
            <Pin size={13} fill={isPinned ? "var(--pin-color)" : "none"} />
          </button>

          {/* Copy */}
          <button
            onClick={copyToClipboard}
            title="Copy"
            aria-label="Copy clip to clipboard"
            className="btn-icon"
            style={{
              background: copied
                ? "rgba(34,197,94,0.15)"
                : "rgba(255,255,255,0.03)",
              color: copied ? "#22c55e" : "var(--text-secondary)",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {/* Tag */}
          <button
            onClick={() => setShowTagInput(!showTagInput)}
            title="Add tag"
            aria-label="Add tag to clip"
            className="btn-icon"
            style={{
              color: tags.length > 0 ? "var(--tag-text)" : "var(--text-secondary)",
              background:
                tags.length > 0
                  ? "var(--tag-bg)"
                  : "rgba(255,255,255,0.03)",
            }}
          >
            <Tag size={13} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(clip.id)}
            title="Delete from view"
            aria-label="Delete clip from view"
            className="btn-icon"
            style={{
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Tags row */}
      <div ref={tagContainerRef}>
        {(tags.length > 0 || showTagInput) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="tag-pill"
                style={{ cursor: "default" }}
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(clip.id, tag)}
                  aria-label={`Remove tag ${tag}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    marginLeft: 2,
                  }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {showTagInput && (
              <form
                onSubmit={handleTagSubmit}
                style={{ display: "flex", gap: 4, alignItems: "center" }}
              >
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.toLowerCase())}
                  placeholder="tag name"
                  maxLength={20}
                  style={{
                    width: 80,
                    padding: "2px 6px",
                    fontSize: 11,
                    background: "var(--search-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </form>
            )}
          </div>
        )}

        {/* Quick tag suggestions */}
        {showTagInput && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 6,
            }}
          >
            {QUICK_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
              <button
                key={tag}
                onClick={() => onAddTag(clip.id, tag)}
                className="tag-pill"
                style={{ opacity: 0.6, fontSize: 10 }}
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: "var(--text-secondary)",
          opacity: 0.6,
          fontSize: 11,
          marginTop: 0,
        }}
      >
        <Clock size={10} />
        <span>{timeAgo(clip.created_at)}</span>
      </div>
    </div>
  );
}
