import { useRef } from "react"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"

interface ContextMenuProps {
  x: number
  y: number
  selectedIds: string[]
  documentStore: DocumentStore
  bridge: MessageBridge
  onClose: () => void
  onGroup: () => void
  onUngroup: () => void
}

export function ContextMenu({ x, y, selectedIds, documentStore, bridge, onClose, onGroup, onUngroup }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  const ids = selectedIds
  const hasSelection = ids.length > 0
  const canGroup = ids.length >= 2
  const canUngroup = ids.some((id) => {
    const el = documentStore.getElement(id)
    return el && el.children.length > 0 && el.parentId !== null
  })

  type MenuItem = { label: string; shortcut?: string; onClick: () => void; disabled?: boolean } | "separator"
  const items: MenuItem[] = []

  if (canGroup) items.push({ label: "Group", shortcut: "⌘G", onClick: onGroup })
  if (canUngroup) items.push({ label: "Ungroup", shortcut: "⇧⌘G", onClick: onUngroup })
  if (items.length > 0) items.push("separator")

  if (hasSelection) {
    items.push({
      label: "Cut",
      shortcut: "⌘X",
      onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "x", code: "KeyX", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }),
    })
    items.push({
      label: "Copy",
      shortcut: "⌘C",
      onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "c", code: "KeyC", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }),
    })
    items.push({
      label: "Duplicate",
      shortcut: "⌘D",
      onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "d", code: "KeyD", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }),
    })
    items.push("separator")
    items.push({
      label: "Delete",
      shortcut: "⌫",
      onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "Backspace", code: "Backspace", metaKey: false, ctrlKey: false, shiftKey: false, altKey: false } }),
    })
  }
  items.push({
    label: "Paste",
    shortcut: "⌘V",
    onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "v", code: "KeyV", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }),
  })

  if (items.length === 0) return null

  return (
    <>
      {/* Invisible backdrop to close menu on outside click */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999 }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        ref={ref}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: x,
          top: y,
          zIndex: 10000,
          background: "#fff",
          borderRadius: 8,
          padding: 4,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
          minWidth: 180,
          fontSize: 12,
          userSelect: "none",
        }}
      >
        {items.map((item, i) =>
          item === "separator" ? (
            <div key={`sep-${i}`} style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />
          ) : (
            <button
              key={item.label}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              disabled={item.disabled}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "6px 10px",
                border: "none",
                background: "none",
                cursor: item.disabled ? "default" : "pointer",
                borderRadius: 4,
                color: item.disabled ? "#9ca3af" : "#1f2937",
                fontSize: 12,
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) e.currentTarget.style.background = "#f3f4f6"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none"
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 24 }}>{item.shortcut}</span>}
            </button>
          )
        )}
      </div>
    </>
  )
}
