import { useState } from "react"
import type { ElementType } from "@devom/editor-core"
import { T } from "../theme"

interface ToolbarProps {
  onAdd: (type: ElementType) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onDelete: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
}

export function Toolbar({ onAdd, onUndo, onRedo, onExport, onDelete, canUndo, canRedo, hasSelection }: ToolbarProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 16px", flexShrink: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 2, padding: "4px 6px",
        background: T.panel, borderRadius: 10, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`,
      }}>
        <ToolBtn icon="+" title="Frame" onClick={() => onAdd("div")} />
        <ToolBtn icon="■" title="Div" onClick={() => onAdd("div")} />
        <ToolBtn icon="☰" title="Flex" onClick={() => onAdd("flex")} />
        <ToolBtn icon="T" title="Text" onClick={() => onAdd("text")} />
        <ToolBtn icon="⇵" title="Grid" onClick={() => onAdd("grid")} />
        <ToolBtn icon="▲" title="Image" onClick={() => onAdd("image")} />
        <ToolBtn icon="/b" title="Button" onClick={() => onAdd("button")} />
        <ToolBtn icon="◉" title="Input" onClick={() => onAdd("input")} />
        <ToolSep />
        <ToolBtn icon="Btn" title="shadcn Button" onClick={() => onAdd("sc:button")} />
        <ToolBtn icon="Card" title="shadcn Card" onClick={() => onAdd("sc:card")} />
        <ToolBtn icon="Inp" title="shadcn Input" onClick={() => onAdd("sc:input")} />
        <ToolBtn icon="Bdg" title="shadcn Badge" onClick={() => onAdd("sc:badge")} />
        <ToolSep />
        <ToolBtn icon="⚙" title="Export" onClick={onExport} />
        <ToolSep />
        <ToolBtn icon="↩" title="Undo" onClick={onUndo} disabled={!canUndo} />
        <ToolBtn icon="↪" title="Redo" onClick={onRedo} disabled={!canRedo} />
        {hasSelection && (
          <>
            <ToolSep />
            <ToolBtn icon="🗑" title="Delete" onClick={onDelete} />
          </>
        )}
      </div>
    </div>
  )
}

function ToolBtn({ icon, title, onClick, disabled, active }: { icon: string; title: string; onClick: () => void; disabled?: boolean; active?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
  )
}

function ToolSep() {
  return <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />
}
