import { useState, useEffect } from "react"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"

interface ContextMenuProps {
  documentStore: DocumentStore
  selectedIds: string[]
  bridge: MessageBridge
}

interface MenuState {
  x: number
  y: number
  targetId: string | null
}

export function ContextMenu({ documentStore, selectedIds, bridge }: ContextMenuProps) {
  const [menu, setMenu] = useState<MenuState | null>(null)

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      const target = (e.target as HTMLElement).closest("[data-element-id]")
      const id = target?.getAttribute("data-element-id") ?? null
      if (!id) {
        setMenu(null)
        return
      }
      const el = documentStore.getElement(id)
      if (!el || el.parentId === null) return
      setMenu({ x: e.clientX, y: e.clientY, targetId: id })
    }
    const onClickAway = () => setMenu(null)

    window.addEventListener("contextmenu", onContextMenu)
    window.addEventListener("click", onClickAway)
    window.addEventListener("pointerdown", onClickAway)
    return () => {
      window.removeEventListener("contextmenu", onContextMenu)
      window.removeEventListener("click", onClickAway)
      window.removeEventListener("pointerdown", onClickAway)
    }
  }, [documentStore])

  if (!menu || !menu.targetId) return null

  const targetEl = documentStore.getElement(menu.targetId)
  if (!targetEl) return null

  // If target is in selection, apply to all selected; otherwise just the target
  const actionIds = selectedIds.includes(menu.targetId) ? selectedIds : [menu.targetId]
  const anyLocked = actionIds.some(id => documentStore.getElement(id)?.locked)

  const handleToggleLock = () => {
    bridge.send({
      type: "CONTEXT_MENU_ACTION",
      payload: { action: anyLocked ? "unlock" : "lock", ids: actionIds },
    })
    setMenu(null)
  }

  return (
    <div
      style={{
        position: "fixed",
        left: menu.x,
        top: menu.y,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        border: "1px solid #e2e8f0",
        padding: "4px 0",
        minWidth: 140,
        zIndex: 9999,
        fontSize: 13,
      }}
    >
      <div
        onClick={handleToggleLock}
        style={{
          padding: "8px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <span style={{ fontSize: 12 }}>{anyLocked ? "🔓" : "🔒"}</span>
        {anyLocked ? "Unlock" : "Lock"}
      </div>
    </div>
  )
}
