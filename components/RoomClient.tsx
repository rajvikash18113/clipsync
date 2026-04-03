"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Clip } from "@/utils/supabase/client";
import {
  Clipboard, Copy, Check, Trash2, Clock,
  ArrowLeft, Users, Wifi, WifiOff, Code2, Link, AlignLeft,
  Plus, LogIn
} from "lucide-react";

type Props = { code: string; isHome?: boolean };

function randomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)  return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function detectType(text: string): "link" | "code" | "text" {
  if (/^https?:\/\//i.test(text.trim())) return "link";
  if (/[{}()[\];]/.test(text) || /^\s*(function|const|let|var|class|import|def |#include)/.test(text)) return "code";
  return "text";
}

function ClipCard({ clip, onDelete }: { clip: Clip; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const type = detectType(clip.content);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(clip.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const TypeIcon = type === "link" ? Link : type === "code" ? Code2 : AlignLeft;
  const typeColor = type === "link" ? "#38bdf8" : type === "code" ? "#a78bfa" : "#6c63ff";

  return (
    <div
      className="glass animate-fade-up"
      style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, transition: "border-color 0.2s", borderColor: "rgba(255,255,255,0.05)", borderRadius: 10 }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(108,99,255,0.25)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <TypeIcon size={12} color={typeColor} />
            <span style={{ fontSize: 10, color: typeColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{type}</span>
          </div>
          <pre
            style={{
              fontFamily: type === "code" ? '"JetBrains Mono", monospace' : "inherit",
              fontSize: type === "code" ? 13 : 14,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              color: "var(--text-primary)",
              maxHeight: 140,
              overflowY: "auto",
              margin: 0
            }}
          >
            {clip.content}
          </pre>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          <button
            onClick={copyToClipboard}
            title="Copy"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.03)",
              color: copied ? "#22c55e" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; } }}
            onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; } }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => onDelete(clip.id)}
            title="Delete from UI"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-secondary)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 0 }}>
        <Clock size={10} />
        <span>{timeAgo(clip.created_at)}</span>
      </div>
    </div>
  );
}

export default function RoomClient({ code, isHome }: Props) {
  const router = useRouter();
  const [clips, setClips]         = useState<Clip[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied]       = useState(false);
  const channelRef                = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const fetchClips = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("clips")
      .select("*")
      .eq("room_code", code)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(100);

    const hiddenStr = localStorage.getItem("hidden_clips") || "[]";
    const hidden: string[] = JSON.parse(hiddenStr);

    if (!error && data) {
      const visibleClips = (data as Clip[]).filter(c => !hidden.includes(c.id));
      setClips(visibleClips);
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    fetchClips();

    const channel = supabase
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clips", filter: `room_code=eq.${code}` },
        (payload) => {
          setClips(prev => {
            const exists = prev.some(c => c.id === payload.new.id);
            if (exists) return prev;
            return [payload.new as Clip, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "clips", filter: `room_code=eq.${code}` },
        (payload) => {
          setClips(prev => prev.filter(c => c.id !== (payload.old as Clip).id));
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [code, fetchClips]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 360) + "px";
  }

  async function sendContent(text: string) {
    if (!text || sending) return;
    setSending(true);
    // @ts-expect-error Type inference fails without generated DB types, but this is valid
    const { error: err } = await supabase.from("clips").insert({ room_code: code, content: text });
    if (!err) {
      setInput("");
      if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    }
    setSending(false);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedData = e.clipboardData.getData("Text").trim();
    if (pastedData) {
      e.preventDefault(); 
      sendContent(pastedData);
    }
  }

  async function sendClip(e?: React.FormEvent) {
    e?.preventDefault();
    await sendContent(input.trim());
  }

  function deleteClip(id: string) {
    setClips(prev => prev.filter(c => c.id !== id));
    try {
      const hiddenStr = localStorage.getItem("hidden_clips") || "[]";
      const hidden = JSON.parse(hiddenStr);
      hidden.push(id);
      localStorage.setItem("hidden_clips", JSON.stringify(hidden));
    } catch (e) {
      console.warn("Could not save to localStorage");
    }
  }

  async function copyRoomCode() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendContent(input.trim());
    }
  }

  function handleCreateRoom() {
    router.push(`/room/${randomCode()}`);
  }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = joinCode.trim();
    if (!/^\d{4}$/.test(c)) {
      setJoinError("Room code must be exactly 4 digits.");
      return;
    }
    router.push(`/room/${c}`);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 16px 100px", width: "100%" }}>

      {/* Layer 1: Header */}
      <div className="animate-fade-up" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        
        {isHome ? (
          /* HOME HEADER */
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Logo image, place your logo inside the /public folder named logo.svg or logo.png */}
              <img src="/logo.png" alt="ClipSync Logo" style={{ width: 32, height: 32, display: "block" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }} className="gradient-text">ClipSync</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: connected ? "#22c55e" : "var(--text-secondary)", fontWeight: 500 }}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{connected ? "Active" : "Connecting..."}</span>
            </div>
          </div>
        ) : (
          /* PRIVATE ROOM HEADER */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn-ghost" onClick={() => router.push("/")} style={{ padding: "6px 10px", borderRadius: 8 }}>
                <ArrowLeft size={16} /> <span className="hidden sm:inline" style={{ fontSize: 13 }}>Back</span>
              </button>
              {/* Logo image */}
              <img src="/logo.png" alt="ClipSync Logo" style={{ width: 24, height: 24, display: "block" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>ClipSync Room</h1>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <button
                className="font-mono"
                onClick={copyRoomCode}
                title="Copy room link"
                style={{
                  fontSize: 16, fontWeight: 700, letterSpacing: "0.15em",
                  background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)",
                  borderRadius: 8, padding: "4px 10px", color: "#a78bfa", cursor: "pointer",
                  transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {code} {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: connected ? "#22c55e" : "var(--text-secondary)", fontWeight: 500 }}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{connected ? "Active" : "Connecting"}</span>
              </div>
            </div>
          </div>
        )}

        {isHome && (
          /* HOME RIGHT-SIDE BUTTONS */
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button className="btn-ghost" onClick={() => setShowJoin(true)} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8 }}>
              <LogIn size={15} /> <span>Join Room</span>
            </button>
            <button className="btn-primary" onClick={handleCreateRoom} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8 }}>
              <Plus size={15} /> <span>New Room</span>
            </button>
          </div>
        )}
      </div>

      {/* Layer 2: Paste Area */}
      <div className="glass animate-fade-up" style={{ padding: "18px 24px", marginBottom: 36, borderRadius: 12, display: "flex", alignItems: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
        <form onSubmit={sendClip} style={{ width: "100%", margin: 0, position: "relative" }}>
          <textarea
            ref={textareaRef}
            placeholder="Paste any text, snippet, or URL here to instantly sync..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={sending}
            style={{ 
              display: "block",
              width: "100%", 
              background: "transparent", 
              border: "none", 
              outline: "none", 
              color: "var(--text-primary)", 
              fontSize: 16, 
              lineHeight: 1.5, 
              resize: "none", 
              minHeight: 80,
              overflow: "hidden",
              fontFamily: "inherit",
              opacity: sending ? 0.5 : 1
            }}
          />
        </form>
      </div>

      {/* Layer 3: History */}
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, paddingLeft: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={14} />
            <span>{clips.length} {clips.length === 1 ? "clip" : "clips"}</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.65 }}>All clips will be vanished after 24 hours</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-secondary)", fontSize: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(108,99,255,0.2)", borderTopColor: "#6c63ff", animation: "spin-slow 0.8s linear infinite", margin: "0 auto 10px" }} />
            Loading history…
          </div>
        ) : clips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
            <Clipboard size={36} style={{ margin: "0 auto 12px", opacity: 0.15 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>No clips in the last 24 hours.</p>
            <p style={{ fontSize: 13, marginTop: 4, opacity: 0.6 }}>Paste anything above to start syncing across devices.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clips.map(clip => (
              <ClipCard key={clip.id} clip={clip} onDelete={deleteClip} />
            ))}
          </div>
        )}
      </div>

      {/* Join Room Modal */}
      {showJoin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="glass animate-fade-up" style={{ width: "100%", maxWidth: 340, padding: 24, borderRadius: 14, background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Join Room</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              Enter a code to access a private room.
            </p>
            <form onSubmit={handleJoinSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input 
                className="input-field font-mono"
                placeholder="1234"
                value={joinCode}
                onChange={e => { 
                  // Only allow digits
                  setJoinCode(e.target.value.replace(/\D/g, '')); 
                  setJoinError(""); 
                }}
                maxLength={4}
                autoFocus
                style={{ textAlign: "center", letterSpacing: "0.4em", fontSize: 20, padding: "10px" }}
              />
              {joinError && <p style={{ color: "#ff6584", fontSize: 12, textAlign: "center", margin: 0 }}>{joinError}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, padding: "8px" }} onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: "8px", justifyContent: "center" }}>Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
