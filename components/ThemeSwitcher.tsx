"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Sparkles } from "lucide-react";

const THEMES = [
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "light", label: "Light", Icon: Sun },
  { id: "midnight", label: "Midnight", Icon: Sparkles },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("clipsync_theme") as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved === "dark" ? "" : saved);
    }
    setMounted(true);
  }, []);

  function cycleTheme() {
    const idx = THEMES.findIndex((t) => t.id === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.id);
    localStorage.setItem("clipsync_theme", next.id);
    // Dark is the default — remove attribute for dark
    if (next.id === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next.id);
    }
  }

  if (!mounted) return null;

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];
  const CurrentIcon = current.Icon;

  return (
    <button
      className="theme-btn"
      onClick={cycleTheme}
      title={`Theme: ${current.label} — Click to change`}
      aria-label={`Current theme: ${current.label}. Click to switch.`}
    >
      <CurrentIcon size={16} />
    </button>
  );
}
