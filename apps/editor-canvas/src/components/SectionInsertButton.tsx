import { useState } from "react"
import type { SectionRole } from "@devom/editor-core"

interface SectionInsertButtonProps {
  index: number
  onInsert: (role: SectionRole, index: number) => void
}

const PRESETS: { role: SectionRole; label: string }[] = [
  { role: "section", label: "Empty Section" },
  { role: "header", label: "Header" },
  { role: "hero", label: "Hero" },
  { role: "features", label: "Features" },
  { role: "cta", label: "CTA" },
  { role: "footer", label: "Footer" },
]

export function SectionInsertButton({ index, onInsert }: SectionInsertButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "relative", height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setShowMenu(false)
      }}
    >
      {(hovered || showMenu) && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed #cbd5e1" }} />
          <button
            onClick={() => setShowMenu((p) => !p)}
            style={{
              position: "relative",
              zIndex: 1,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </button>
          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: 28,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                border: "1px solid #e2e8f0",
                padding: 4,
                zIndex: 200,
                minWidth: 140,
              }}
            >
              {PRESETS.map((p) => (
                <button
                  key={p.role}
                  onClick={() => {
                    onInsert(p.role, index)
                    setShowMenu(false)
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 10px",
                    fontSize: 11,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
