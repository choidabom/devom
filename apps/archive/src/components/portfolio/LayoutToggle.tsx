"use client"

import "@/styles/layout-toggle.css"

interface LayoutToggleProps {
  layout: "free" | "centered"
  onLayoutChange: (layout: "free" | "centered") => void
}

export const LayoutToggle = ({ layout, onLayoutChange }: LayoutToggleProps) => {
  return (
    <div className="layout-toggle">
      <button className={`layout-toggle-btn ${layout === "free" ? "active" : ""}`} onClick={() => onLayoutChange("free")} aria-label="Free layout">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
        </svg>
      </button>
      <button className={`layout-toggle-btn ${layout === "centered" ? "active" : ""}`} onClick={() => onLayoutChange("centered")} aria-label="Centered layout">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="2" width="10" height="2" rx="1" fill="currentColor" />
          <rect x="3" y="6" width="10" height="2" rx="1" fill="currentColor" />
          <rect x="3" y="10" width="10" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
