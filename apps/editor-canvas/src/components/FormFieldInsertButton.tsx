import { useState, useEffect, useRef } from "react"

interface FormFieldInsertButtonProps {
  formId: string
  onInsert: (formId: string, elementType: string) => void
}

const FIELD_OPTIONS: { type: string; label: string }[] = [
  { type: "sc:input", label: "Input" },
  { type: "sc:textarea", label: "Textarea" },
  { type: "sc:select", label: "Select" },
  { type: "sc:checkbox", label: "Checkbox" },
  { type: "sc:switch", label: "Switch" },
  { type: "sc:radio-group", label: "Radio Group" },
  { type: "sc:slider", label: "Slider" },
  { type: "sc:button", label: "Submit Button" },
]

export function FormFieldInsertButton({ formId, onInsert }: FormFieldInsertButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showMenu])

  return (
    <div ref={menuRef} onPointerDown={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "center", padding: "6px 0", position: "relative" }}>
      <button
        onClick={() => setShowMenu((p) => !p)}
        style={{
          width: "100%",
          maxWidth: 200,
          height: 28,
          borderRadius: 6,
          background: "transparent",
          color: "#94a3b8",
          border: "1px dashed #cbd5e1",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6366f1"
          e.currentTarget.style.color = "#6366f1"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#cbd5e1"
          e.currentTarget.style.color = "#94a3b8"
        }}
      >
        + Add Field
      </button>
      {showMenu && (
        <div
          style={{
            position: "absolute",
            bottom: 38,
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
          {FIELD_OPTIONS.map((f) => (
            <button
              key={f.type}
              onClick={() => {
                onInsert(formId, f.type)
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
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
