"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Clip } from "@/utils/supabase/client";
import {
  Clipboard, Check,
  ArrowLeft, List, Wifi, WifiOff,
  Plus, LogIn, QrCode,
  Bell, BellOff, Monitor, Globe,
  GitFork,
} from "lucide-react";

// Components
import ToastContainer, { type Toast } from "@/components/ToastContainer";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import ClipCard from "@/components/ClipCard";
import SearchBar from "@/components/SearchBar";
import QRCodeModal from "@/components/QRCodeModal";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ExportButton from "@/components/ExportButton";
import FileUpload from "@/components/FileUpload";

type Props = { code: string; isHome?: boolean };

function randomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function RoomClient({ code, isHome }: Props) {
  const router = useRouter();

  // ── Core State ──
  const [clips, setClips]         = useState<Clip[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied]       = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const channelRef                = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Toast ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // ── Delete ──
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ── Join Modal ──
  const [showJoin, setShowJoin]   = useState(false);
  const [joinCode, setJoinCode]   = useState("");
  const [joinError, setJoinError] = useState("");

  // ── QR Modal ──
  const [showQR, setShowQR] = useState(false);

  // ── Queue ──
  const sendQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const [queueSize, setQueueSize] = useState(0);
  const lastSentRef = useRef<{ content: string; time: number }>({ content: "", time: 0 });

  // ── Search & Filter ──
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // ── Pins (localStorage) ──
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // ── Tags (localStorage) ──
  const [clipTags, setClipTags] = useState<Record<string, string[]>>({});

  // ── Notifications ──
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);

  // ── Presence ──
  const [deviceCount, setDeviceCount] = useState(0);

  const isPublic = code === "PUBLIC";

  // ── Load localStorage on mount ──
  useEffect(() => {
    try {
      const pins = JSON.parse(localStorage.getItem("pinned_clips") || "[]");
      setPinnedIds(pins);
      const tags = JSON.parse(localStorage.getItem("clip_tags") || "{}");
      setClipTags(tags);
      const notif = localStorage.getItem("clipsync_notifications") === "true";
      setNotificationsEnabled(notif);
    } catch { /* ignore */ }
  }, []);

  // ── Toast helpers ──

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = String(++toastIdRef.current);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), type === "error" ? 8000 : 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch clips ──

  const fetchClips = useCallback(async () => {
    let query = supabase.from("clips").select("*").eq("room_code", code);
    if (isPublic) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", cutoff);
    }
    const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

    const hidden: string[] = JSON.parse(localStorage.getItem("hidden_clips") || "[]");
    if (!error && data) {
      setClips((data as Clip[]).filter(c => !hidden.includes(c.id)));
    }
    setLoading(false);
  }, [code, isPublic]);

  // ── Realtime + Presence ──

  useEffect(() => {
    fetchClips();

    // Generate a stable device ID for this session
    let deviceId = sessionStorage.getItem("clipsync_device_id");
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem("clipsync_device_id", deviceId);
    }

    const channel = supabase
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clips", filter: `room_code=eq.${code}` },
        (payload) => {
          const hidden: string[] = JSON.parse(localStorage.getItem("hidden_clips") || "[]");
          if (hidden.includes(payload.new.id)) return;

          setClips(prev => {
            if (prev.some(c => c.id === payload.new.id)) return prev;
            return [payload.new as Clip, ...prev];
          });

          // Browser notification if tab is hidden
          if (document.hidden && Notification.permission === "granted") {
            try {
              const content = (payload.new as Clip).content;
              const preview = content.startsWith("[FILE]") ? "📎 New file shared" : content.slice(0, 80);
              new Notification("ClipSync", {
                body: preview,
                icon: "/logo.png",
                tag: "clipsync-new-clip",
              });
            } catch { /* ignore */ }
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setDeviceCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          await channel.track({ device_id: deviceId, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [code, fetchClips]);

  // ── Queue-based send ──

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || sendQueueRef.current.length === 0) return;
    isProcessingRef.current = true;

    while (sendQueueRef.current.length > 0) {
      const text = sendQueueRef.current[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from("clips") as any)
        .insert([{ room_code: code, content: text }]);
      if (err) {
        console.error("Failed to save clip:", err);
        addToast(`Failed to save clip: ${err.message}`, "error");
      }
      sendQueueRef.current.shift();
      setQueueSize(sendQueueRef.current.length);
    }
    isProcessingRef.current = false;
  }, [code, addToast]);

  function enqueueContent(text: string) {
    if (!text) return;
    const now = Date.now();
    if (lastSentRef.current.content === text && now - lastSentRef.current.time < 5000) {
      addToast("Duplicate paste detected — skipped", "info");
      return;
    }
    lastSentRef.current = { content: text, time: now };
    sendQueueRef.current.push(text);
    setQueueSize(sendQueueRef.current.length);
    processQueue();
  }

  // ── Input handlers ──

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 360) + "px";
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedData = e.clipboardData.getData("Text").trim();
    if (pastedData) {
      e.preventDefault();
      enqueueContent(pastedData);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  }

  function sendClip(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      enqueueContent(trimmed);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendClip(); }
  }

  // ── Delete ──

  function requestDelete(id: string) { setDeleteTarget(id); }

  function confirmDelete() {
    if (!deleteTarget) return;
    setClips(prev => prev.filter(c => c.id !== deleteTarget));
    try {
      const hidden = JSON.parse(localStorage.getItem("hidden_clips") || "[]");
      hidden.push(deleteTarget);
      localStorage.setItem("hidden_clips", JSON.stringify(hidden));
    } catch { /* ignore */ }
    addToast("Clip removed from your view", "success");
    setDeleteTarget(null);
  }

  // ── Pin ──

  function togglePin(id: string) {
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem("pinned_clips", JSON.stringify(next));
      return next;
    });
  }

  // ── Tags ──

  function addTag(clipId: string, tag: string) {
    setClipTags(prev => {
      const next = { ...prev, [clipId]: [...(prev[clipId] || []), tag] };
      localStorage.setItem("clip_tags", JSON.stringify(next));
      return next;
    });
  }

  function removeTag(clipId: string, tag: string) {
    setClipTags(prev => {
      const next = { ...prev, [clipId]: (prev[clipId] || []).filter(t => t !== tag) };
      if (next[clipId].length === 0) delete next[clipId];
      localStorage.setItem("clip_tags", JSON.stringify(next));
      return next;
    });
  }

  // All unique tags across clips
  const allTags = useMemo(() => {
    const set = new Set<string>();
    Object.values(clipTags).forEach(tags => tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [clipTags]);

  // ── Notifications ──

  async function toggleNotifications() {
    if (!notificationsEnabled) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("clipsync_notifications", "true");
        addToast("Notifications enabled", "success");
        setBellAnimating(true);
        setTimeout(() => setBellAnimating(false), 600);
      } else {
        addToast("Notification permission denied", "error");
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("clipsync_notifications", "false");
      addToast("Notifications disabled", "info");
    }
  }

  // ── Room actions ──

  async function copyRoomCode() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleCreateRoom() { router.push(`/room/${randomCode()}`); }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = joinCode.trim();
    if (!/^\d{4}$/.test(c)) { setJoinError("Room code must be exactly 4 digits."); return; }
    router.push(`/room/${c}`);
  }

  // Close modals on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showJoin) setShowJoin(false);
        if (showQR) setShowQR(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showJoin, showQR]);

  // ── Computed: filtered & sorted clips ──

  const displayClips = useMemo(() => {
    let result = [...clips];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.content.toLowerCase().includes(q));
    }

    // Tag filter
    if (filterTag) {
      result = result.filter(c => (clipTags[c.id] || []).includes(filterTag));
    }

    // Pinned clips first
    result.sort((a, b) => {
      const ap = pinnedIds.includes(a.id) ? 1 : 0;
      const bp = pinnedIds.includes(b.id) ? 1 : 0;
      return bp - ap;
    });

    return result;
  }, [clips, search, filterTag, pinnedIds, clipTags]);

  // ═══════ RENDER ═══════

  return (
    <div className="room-container">

      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>

        {isHome ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ClipSync Logo" style={{ width: 32, height: 32, display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }} className="gradient-text">ClipSync</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: connected ? "var(--success)" : "var(--text-secondary)" }}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{connected ? "Active" : "Connecting..."}</span>
              </div>
              {deviceCount > 0 && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: 12, marginLeft: 4 }}
                  aria-label={`${deviceCount} device${deviceCount !== 1 ? "s" : ""} connected to this room`}
                >
                  <Monitor size={12} aria-hidden="true" />
                  <span>{deviceCount} device{deviceCount !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn-ghost" onClick={() => router.push("/")} style={{ padding: "6px 10px", borderRadius: 8 }} aria-label="Go back to home">
                <ArrowLeft size={16} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ClipSync Logo" style={{ width: 24, height: 24, display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>ClipSync Room</h1>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <button className="font-mono" onClick={copyRoomCode} title="Copy room link" aria-label={`Copy room ${code} link`}
                style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.15em", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 8, padding: "4px 10px", color: "#a78bfa", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8 }}>
                {code} {copied ? <Check size={14} color="var(--success)" /> : <span style={{ opacity: 0.6, fontSize: 11 }}>Copy</span>}
              </button>
              <button className="btn-icon" onClick={() => setShowQR(true)} title="Share QR Code" aria-label="Show QR code" style={{ width: 36, height: 36 }}>
                <QrCode size={16} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: connected ? "var(--success)" : "var(--text-secondary)", fontWeight: 500 }}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{connected ? "Active" : "Connecting"}</span>
              </div>
              {deviceCount > 0 && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: 12 }}
                  aria-label={`${deviceCount} device${deviceCount !== 1 ? "s" : ""} connected to this room`}
                >
                  <Monitor size={12} aria-hidden="true" />
                  <span>{deviceCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right side controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <ThemeSwitcher />

          {/* Notification toggle */}
          <button
            className={`btn-icon ${bellAnimating ? "bell-ring" : ""}`}
            onClick={toggleNotifications}
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            style={{
              width: 36, height: 36,
              color: notificationsEnabled ? "var(--success)" : "var(--text-secondary)",
              background: notificationsEnabled ? "rgba(34,197,94,0.1)" : undefined,
            }}
          >
            {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>

          {isHome && (
            <>
              <button className="btn-ghost" onClick={() => setShowJoin(true)} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8 }} aria-label="Join a room">
                <LogIn size={15} /> <span>Join Room</span>
              </button>
              <button className="btn-primary" onClick={handleCreateRoom} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8 }} aria-label="Create a new room">
                <Plus size={15} /> <span>New Room</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Public Room Banner ── */}
      {isPublic && (
        <div className="public-banner animate-fade-up">
          <Globe size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span>Public room — visible to everyone. Clips expire after 24 hours.</span>
        </div>
      )}

      {/* ── Paste Area ── */}
      <div className="glass animate-fade-up" style={{ padding: "18px 24px", marginBottom: 28, borderRadius: 12, display: "flex", flexDirection: "column", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
        <form onSubmit={sendClip} style={{ width: "100%", margin: 0 }}>
          <textarea
            ref={textareaRef}
            placeholder="Paste or type to sync..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            aria-label="Paste content here to sync"
            style={{
              display: "block", width: "100%", background: "transparent", border: "none", outline: "none",
              color: "var(--text-primary)", fontSize: 16, lineHeight: 1.5, resize: "none", minHeight: 80,
              overflow: "hidden", fontFamily: "inherit", opacity: queueSize > 0 ? 0.7 : 1,
            }}
          />
        </form>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileUpload roomCode={code} onUploadComplete={fetchClips} addToast={addToast} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.5 }}>
              {input.length > 0 ? `${input.length} chars` : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {queueSize > 0 && (
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>
                Saving {queueSize} clip{queueSize > 1 ? "s" : ""}...
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.45 }}>↵ Enter to send</span>
            <button
              type="button"
              className="btn-primary"
              onClick={() => sendClip()}
              disabled={!input.trim()}
              style={{ padding: "6px 16px", fontSize: 13 }}
              aria-label="Send clip"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      {clips.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            filterTag={filterTag}
            onFilterTag={setFilterTag}
            allTags={allTags}
          />
        </div>
      )}

      {/* ── History ── */}
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, paddingLeft: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <List size={14} />
            <span>{displayClips.length} {displayClips.length === 1 ? "clip" : "clips"}</span>
            {search && <span style={{ opacity: 0.6 }}>(filtered)</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ExportButton clips={displayClips} />
            {isPublic ? (
              <span style={{ fontSize: 12, opacity: 0.65 }}>Public clips vanish after 24 hours</span>
            ) : (
              <span style={{ fontSize: 12, opacity: 0.65 }}>Clips persist until you delete them</span>
            )}
          </div>
        </div>

        {loading ? (
          <div role="status" style={{ textAlign: "center", padding: "50px 0", color: "var(--text-secondary)", fontSize: 14 }}>
            <div aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent-glow)", borderTopColor: "var(--accent)", animation: "spin-slow 0.8s linear infinite", margin: "0 auto 10px" }} />
            Loading history…
          </div>
        ) : displayClips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
            <Clipboard size={36} aria-hidden="true" className="animate-pulse-ring" style={{ margin: "0 auto 14px", opacity: 0.2 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
              {search ? "No clips match your search." : isPublic ? "No clips in the last 24 hours." : "No clips in this room yet."}
            </p>
            <p style={{ fontSize: 13, marginTop: 4, opacity: 0.6 }}>
              {search ? "Try a different search term." : "Paste or type something above to get started."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayClips.map(clip => (
              <ClipCard
                key={clip.id}
                clip={clip}
                onDelete={requestDelete}
                isPinned={pinnedIds.includes(clip.id)}
                onTogglePin={togglePin}
                tags={clipTags[clip.id] || []}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Join Room Modal ── */}
      {showJoin && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={() => setShowJoin(false)}>
          <div className="glass animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="join-room-title" style={{ width: "100%", maxWidth: 340, padding: 24, borderRadius: 14, background: "var(--bg-card)" }} onClick={e => e.stopPropagation()}>
            <h3 id="join-room-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Join Room</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Enter a code to access a private room.</p>
            <form onSubmit={handleJoinSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                className="input-field font-mono"
                placeholder="1234"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.replace(/\D/g, "")); setJoinError(""); }}
                maxLength={4}
                autoFocus
                aria-label="Room code input"
                style={{ textAlign: "center", letterSpacing: "0.4em", fontSize: 20, padding: "10px" }}
              />
              {joinError && <p style={{ color: "var(--accent-2)", fontSize: 12, textAlign: "center", margin: 0 }}>{joinError}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, padding: "8px" }} onClick={() => setShowJoin(false)} aria-label="Cancel join">Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: "8px", justifyContent: "center" }} aria-label="Join room">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QR Code Modal ── */}
      {showQR && (
        <QRCodeModal
          url={`${typeof window !== "undefined" ? window.location.origin : ""}/room/${code}`}
          roomCode={code}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <ConfirmDeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <a
          href="https://github.com/rajvikash18113/clipsync"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <GitFork size={13} aria-hidden="true" />
          <span>ClipSync is open source — contribute on GitHub</span>
        </a>
      </div>

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
