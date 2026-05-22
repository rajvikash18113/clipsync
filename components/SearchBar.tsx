"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  filterTag,
  onFilterTag,
  allTags,
}: {
  value: string;
  onChange: (v: string) => void;
  filterTag: string | null;
  onFilterTag: (tag: string | null) => void;
  allTags: string[];
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="animate-fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div className="search-container">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Search clips..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Search clips"
          style={{
            borderColor: focused ? "rgba(108,99,255,0.5)" : undefined,
          }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Tags:
          </span>
          <button
            className={`tag-pill ${!filterTag ? "active" : ""}`}
            onClick={() => onFilterTag(null)}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-pill ${filterTag === tag ? "active" : ""}`}
              onClick={() => onFilterTag(filterTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
