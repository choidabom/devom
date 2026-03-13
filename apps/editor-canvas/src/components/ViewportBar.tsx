import { useState } from "react"
import type { MessageBridge } from "@devom/editor-core"

interface ViewportBarProps {
  pageViewport: number
  bridge: MessageBridge
}

export function ViewportBar({ pageViewport, bridge }: ViewportBarProps) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(255,255,255,0.95)",
        borderRadius: 8,
        padding: "4px 8px",
        fontSize: 11,
        color: "#64748b",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        zIndex: 100,
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {[
        { label: "Desktop", width: 1280 as const, wip: false },
        { label: "Tablet", width: 768 as const, wip: true },
        { label: "Mobile", width: 375 as const, wip: true },
      ].map((p) => (
        <ViewportButton
          key={p.width}
          label={`${p.label} (${p.width})`}
          active={pageViewport === p.width}
          wip={p.wip}
          onClick={() => bridge.send({ type: "SET_PAGE_VIEWPORT_REQUEST", payload: { width: p.width } })}
        />
      ))}
    </div>
  )
}

function ViewportButton({ label, active, wip, onClick }: { label: string; active: boolean; wip: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        onClick={onClick}
        style={{
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 500,
          background: active ? "#6366f1" : "transparent",
          color: active ? "#fff" : "#64748b",
          border: `1px solid ${active ? "#6366f1" : "#e2e8f0"}`,
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
      {wip && hovered && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 6,
            padding: "4px 10px",
            borderRadius: 6,
            background: "#1e1e2e",
            color: "#fff",
            fontSize: 11,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          준비 중
        </div>
      )}
    </div>
  )
}
