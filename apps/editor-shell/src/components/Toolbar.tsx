import { type ReactNode, useState, useRef, useEffect } from "react"
import {
  Plus, Type, ImageIcon,
  Undo2, Redo2, Trash2, Settings, ChevronDown,
  AlignLeft, AlignCenterHorizontal, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowLeftRight, ArrowUpDown,
} from "lucide-react"
import type { ElementType } from "@devom/editor-core"
import { T } from "../theme"

export type AlignType = "left" | "center-h" | "right" | "top" | "center-v" | "bottom" | "distribute-h" | "distribute-v"

interface ToolbarProps {
  onAdd: (type: ElementType) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onDelete: () => void
  onAlign: (type: AlignType) => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  multiSelected: boolean
  editorMode: "edit" | "interact"
  onToggleMode: () => void
}

const S = 15

const SHADCN_COMPONENTS: { type: ElementType; label: string; category: string }[] = [
  { type: "sc:button", label: "Button", category: "Form" },
  { type: "sc:input", label: "Input", category: "Form" },
  { type: "sc:textarea", label: "Textarea", category: "Form" },
  { type: "sc:checkbox", label: "Checkbox", category: "Form" },
  { type: "sc:switch", label: "Switch", category: "Form" },
  { type: "sc:slider", label: "Slider", category: "Form" },
  { type: "sc:select", label: "Select", category: "Form" },
  { type: "sc:radio-group", label: "Radio Group", category: "Form" },
  { type: "sc:toggle", label: "Toggle", category: "Form" },
  { type: "sc:label", label: "Label", category: "Form" },
  { type: "sc:card", label: "Card", category: "Display" },
  { type: "sc:badge", label: "Badge", category: "Display" },
  { type: "sc:alert", label: "Alert", category: "Display" },
  { type: "sc:avatar", label: "Avatar", category: "Display" },
  { type: "sc:progress", label: "Progress", category: "Display" },
  { type: "sc:skeleton", label: "Skeleton", category: "Display" },
  { type: "sc:separator", label: "Separator", category: "Display" },
  { type: "sc:tabs", label: "Tabs", category: "Layout" },
  { type: "sc:accordion", label: "Accordion", category: "Layout" },
  { type: "sc:table", label: "Table", category: "Data" },
]

export function Toolbar({ onAdd, onUndo, onRedo, onExport, onDelete, onAlign, canUndo, canRedo, hasSelection, multiSelected, editorMode, onToggleMode }: ToolbarProps) {
  const [showShadcn, setShowShadcn] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showShadcn) return
    const onClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowShadcn(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [showShadcn])

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 16px", flexShrink: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 2, padding: "4px 6px",
        background: T.panel, borderRadius: 10, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`,
      }}>
        <ToolBtn icon={<Plus size={S} />} title="Frame" onClick={() => onAdd("div")} />
        <ToolBtn icon={<Type size={S} />} title="Text" onClick={() => onAdd("text")} />
        <ToolBtn icon={<ImageIcon size={S} />} title="Image" onClick={() => onAdd("image")} />
        <ToolSep />

        {/* shadcn/ui dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <ToolBtn
            icon={<span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600 }}>UI <ChevronDown size={10} /></span>}
            title="shadcn/ui Components"
            onClick={() => setShowShadcn(v => !v)}
            active={showShadcn}
          />
          {showShadcn && (
            <div style={{
              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
              marginTop: 8, padding: 8, borderRadius: 12,
              background: T.panel, border: `1px solid ${T.panelBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 1000, width: 280, maxHeight: 400, overflowY: "auto",
            }}>
              {["Form", "Display", "Layout", "Data"].map(cat => {
                const items = SHADCN_COMPONENTS.filter(c => c.category === cat)
                if (items.length === 0) return null
                return (
                  <div key={cat}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, padding: "6px 8px 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>{cat}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "2px 0 6px" }}>
                      {items.map(c => (
                        <button
                          key={c.type}
                          onClick={() => { onAdd(c.type); setShowShadcn(false) }}
                          style={{
                            padding: "4px 10px", fontSize: 12, borderRadius: 6,
                            border: `1px solid ${T.panelBorder}`, background: "transparent",
                            color: T.text, cursor: "pointer", transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <ToolSep />
        <ToolBtn icon={<Settings size={S} />} title="Export" onClick={onExport} />
        <ToolSep />
        <ToolBtn icon={<Undo2 size={S} />} title="Undo" onClick={onUndo} disabled={!canUndo} />
        <ToolBtn icon={<Redo2 size={S} />} title="Redo" onClick={onRedo} disabled={!canRedo} />
        {hasSelection && (
          <>
            <ToolSep />
            <ToolBtn icon={<Trash2 size={S} />} title="Delete" onClick={onDelete} />
          </>
        )}
        {multiSelected && (
          <>
            <ToolSep />
            <ToolBtn icon={<AlignLeft size={S} />} title="Align Left" onClick={() => onAlign("left")} />
            <ToolBtn icon={<AlignCenterHorizontal size={S} />} title="Align Center" onClick={() => onAlign("center-h")} />
            <ToolBtn icon={<AlignRight size={S} />} title="Align Right" onClick={() => onAlign("right")} />
            <ToolBtn icon={<AlignStartVertical size={S} />} title="Align Top" onClick={() => onAlign("top")} />
            <ToolBtn icon={<AlignCenterVertical size={S} />} title="Align Middle" onClick={() => onAlign("center-v")} />
            <ToolBtn icon={<AlignEndVertical size={S} />} title="Align Bottom" onClick={() => onAlign("bottom")} />
            <ToolSep />
            <ToolBtn icon={<ArrowLeftRight size={S} />} title="Distribute Horizontally" onClick={() => onAlign("distribute-h")} />
            <ToolBtn icon={<ArrowUpDown size={S} />} title="Distribute Vertically" onClick={() => onAlign("distribute-v")} />
          </>
        )}
        <ToolSep />
        <ToolBtn
          icon={editorMode === "edit" ? "▶" : "✎"}
          title={editorMode === "edit" ? "Interaction Mode (P)" : "Edit Mode (V)"}
          onClick={onToggleMode}
          active={editorMode === "interact"}
        />
      </div>
    </div>
  )
}

function ToolBtn({ icon, title, onClick, disabled, active }: { icon: ReactNode; title: string; onClick: () => void; disabled?: boolean; active?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? T.accentLight : hovered && !disabled ? T.hover : "transparent",
          color: disabled ? T.textMuted : active ? T.accent : T.text,
          border: "none", borderRadius: 8, cursor: disabled ? "default" : "pointer",
          fontSize: 14, lineHeight: 1, padding: 0, opacity: disabled ? 0.4 : 1,
          transition: "background 0.15s",
        }}
      >
        {icon}
      </button>
      {hovered && (
        <div style={{
          position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
          marginTop: 6, padding: "4px 8px", borderRadius: 6,
          background: T.text, color: T.bg, fontSize: 11, whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          {title}
        </div>
      )}
    </div>
  )
}

function ToolSep() {
  return <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />
}
