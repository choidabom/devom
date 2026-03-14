import { type ReactNode, useState, useCallback, useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import { Lock, Unlock, Square, Columns3, Type, LayoutGrid, ImageIcon, MousePointerClick, TextCursorInput, ChevronRight, LayoutList } from "lucide-react"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"

// --- Layer DnD types ---
type DropPosition = "before" | "inside" | "after"

interface DragState {
  dragId: string | null
  overId: string | null
  position: DropPosition | null
}

const INITIAL_DRAG: DragState = { dragId: null, overId: null, position: null }

function isDescendant(ancestorId: string, targetId: string): boolean {
  let el = documentStore.getElement(targetId)
  while (el?.parentId) {
    if (el.parentId === ancestorId) return true
    el = documentStore.getElement(el.parentId)
  }
  return false
}

function canDrop(dragId: string, overId: string): boolean {
  if (dragId === overId) return false
  if (overId === documentStore.rootId) return false
  if (isDescendant(dragId, overId)) return false
  const el = documentStore.getElement(dragId)
  if (!el || el.locked) return false
  return true
}

export const LeftPanel = observer(function LeftPanel() {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [drag, setDrag] = useState<DragState>(INITIAL_DRAG)

  const selectedKey = selectionStore.selectedIds.join(",")

  useEffect(() => {
    const ids = selectionStore.selectedIds
    if (ids.length === 0) return

    const ancestorIds = new Set<string>()
    for (const id of ids) {
      let el = documentStore.getElement(id)
      while (el?.parentId) {
        ancestorIds.add(el.parentId)
        el = documentStore.getElement(el.parentId)
      }
    }

    setCollapsedIds((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const aId of ancestorIds) {
        if (next.has(aId)) {
          next.delete(aId)
          changed = true
        }
      }
      return changed ? next : prev
    })

    const firstId = ids[0]
    if (firstId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-layer-id="${firstId}"]`)
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 50)
    }
  }, [selectedKey])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDragStart = useCallback((id: string) => {
    setDrag({ dragId: id, overId: null, position: null })
  }, [])

  const handleDragOver = useCallback(
    (id: string, e: React.DragEvent) => {
      if (!drag.dragId || !canDrop(drag.dragId, id)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"

      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const ratio = y / rect.height

      const overEl = documentStore.getElement(id)
      const isContainer = overEl && (overEl.children.length > 0 || overEl.type === "div" || overEl.type === "form" || overEl.type === "flex" || overEl.type === "grid")

      let position: DropPosition
      if (isContainer) {
        if (ratio < 0.25) position = "before"
        else if (ratio > 0.75) position = "after"
        else position = "inside"
      } else {
        position = ratio < 0.5 ? "before" : "after"
      }

      setDrag((prev) => (prev.overId === id && prev.position === position ? prev : { ...prev, overId: id, position }))
    },
    [drag.dragId]
  )

  const handleDragLeave = useCallback(() => {
    setDrag((prev) => (prev.overId ? { ...prev, overId: null, position: null } : prev))
  }, [])

  const handleDrop = useCallback(() => {
    const { dragId, overId, position } = drag
    if (!dragId || !overId || !position) {
      setDrag(INITIAL_DRAG)
      return
    }

    const dragEl = documentStore.getElement(dragId)
    const overEl = documentStore.getElement(overId)
    if (!dragEl || !overEl) {
      setDrag(INITIAL_DRAG)
      return
    }

    historyStore.pushSnapshot()

    if (position === "inside") {
      // Reparent: move into overEl as last child
      documentStore.reparentElement(dragId, overId, overEl.children.length)
      // Auto-expand the target container
      setCollapsedIds((prev) => {
        if (prev.has(overId)) {
          const next = new Set(prev)
          next.delete(overId)
          return next
        }
        return prev
      })
    } else {
      const targetParentId = overEl.parentId
      if (!targetParentId) {
        setDrag(INITIAL_DRAG)
        return
      }
      const parent = documentStore.getElement(targetParentId)
      if (!parent) {
        setDrag(INITIAL_DRAG)
        return
      }
      const overIndex = parent.children.indexOf(overId)
      if (overIndex === -1) {
        setDrag(INITIAL_DRAG)
        return
      }

      const isSameParent = dragEl.parentId === targetParentId
      if (isSameParent) {
        const insertIndex = position === "after" ? overIndex + 1 : overIndex
        const dragIndex = parent.children.indexOf(dragId)
        // No-op: dropping element onto its own position
        if (dragIndex === insertIndex || dragIndex + 1 === insertIndex) {
          setDrag(INITIAL_DRAG)
          return
        }
        const adjustedIndex = dragIndex < insertIndex ? insertIndex - 1 : insertIndex
        documentStore.reorderChild(targetParentId, dragId, adjustedIndex)
      } else {
        // Reparent to sibling position
        const insertIndex = position === "after" ? overIndex + 1 : overIndex
        documentStore.reparentElement(dragId, targetParentId, insertIndex)
      }
    }

    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
    selectionStore.select(dragId)
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [dragId] } })
    setDrag(INITIAL_DRAG)
  }, [drag])

  const handleDragEnd = useCallback(() => {
    setDrag(INITIAL_DRAG)
  }, [])

  return (
    <div
      style={{
        background: T.panel,
        borderRadius: T.panelRadius,
        boxShadow: T.panelShadow,
        border: `1px solid ${T.panelBorder}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "14px 16px 10px", fontSize: 13, fontWeight: 600, color: T.text }}>Layers</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 8px" }}>
        <LayerTree
          elementId={documentStore.rootId}
          depth={0}
          collapsedIds={collapsedIds}
          onToggleCollapse={toggleCollapse}
          drag={drag}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  )
})

const LayerTree = observer(function LayerTree({
  elementId,
  depth,
  collapsedIds,
  onToggleCollapse,
  drag,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  elementId: string
  depth: number
  collapsedIds: Set<string>
  onToggleCollapse: (id: string) => void
  drag: DragState
  onDragStart: (id: string) => void
  onDragOver: (id: string, e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: () => void
  onDragEnd: () => void
}) {
  const element = documentStore.getElement(elementId)
  const [hovered, setHovered] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const collapsed = collapsedIds.has(elementId)
  if (!element) return null
  const isSelected = selectionStore.selectedIds.includes(elementId)
  const isRoot = elementId === documentStore.rootId
  const hasChildren = element.children.length > 0
  const isDragging = drag.dragId === elementId
  const isDropTarget = drag.overId === elementId && drag.dragId !== null

  const S = 12
  const iconMap: Record<string, ReactNode> = {
    div: <Square size={S} />,
    flex: <Columns3 size={S} />,
    grid: <LayoutGrid size={S} />,
    text: <Type size={S} />,
    image: <ImageIcon size={S} />,
    button: <MousePointerClick size={S} />,
    input: <TextCursorInput size={S} />,
    "sc:button": <MousePointerClick size={S} />,
    "sc:card": <Square size={S} />,
    "sc:input": <TextCursorInput size={S} />,
    "sc:badge": <Square size={S} />,
  }
  const icon = iconMap[element.type] ?? <Square size={S} />
  const displayIcon = element.layoutMode === "flex" ? <LayoutList size={S} /> : icon

  // Drop indicator styles
  const indicatorColor = T.accent
  let dropIndicator: ReactNode = null
  if (isDropTarget && drag.position === "before") {
    dropIndicator = <div style={{ position: "absolute", top: 0, left: depth * 16 + 10, right: 6, height: 2, background: indicatorColor, borderRadius: 1, pointerEvents: "none" }} />
  } else if (isDropTarget && drag.position === "after") {
    dropIndicator = (
      <div style={{ position: "absolute", bottom: 0, left: depth * 16 + 10, right: 6, height: 2, background: indicatorColor, borderRadius: 1, pointerEvents: "none" }} />
    )
  }

  return (
    <div>
      <div
        ref={rowRef}
        data-layer-id={elementId}
        draggable={!isRoot && !element.locked}
        onDragStart={(e) => {
          if (isRoot || element.locked) return
          e.dataTransfer.effectAllowed = "move"
          e.dataTransfer.setData("text/plain", elementId)
          onDragStart(elementId)
        }}
        onDragOver={(e) => {
          if (!isRoot) onDragOver(elementId, e)
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDrop()
        }}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          if (!isRoot) {
            if (e.shiftKey) {
              selectionStore.toggle(elementId)
            } else {
              selectionStore.select(elementId)
            }
            bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [...selectionStore.selectedIds] } })
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          padding: "6px 10px",
          paddingLeft: depth * 16 + 10,
          fontSize: 13,
          cursor: isRoot ? "default" : isDragging ? "grabbing" : "grab",
          background: isDropTarget && drag.position === "inside" ? T.accentLight : isSelected ? T.accent : hovered && !isRoot ? T.hover : "transparent",
          borderRadius: 8,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: isSelected ? "#fff" : isRoot ? T.textMuted : T.text,
          fontWeight: isSelected ? 500 : 400,
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "background 0.12s",
          opacity: isDragging ? 0.4 : 1,
        }}
      >
        {dropIndicator}
        {hasChildren && !isRoot ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(elementId)
            }}
            style={{ display: "flex", flexShrink: 0, cursor: "pointer", opacity: 0.5, transition: "transform 0.15s", transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
          >
            <ChevronRight size={10} />
          </span>
        ) : !isRoot ? (
          <span style={{ width: 10, flexShrink: 0 }} />
        ) : null}
        <span style={{ opacity: isSelected ? 0.8 : 0.5, display: "flex", flexShrink: 0 }}>{displayIcon}</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{element.name}</span>
        {element.layoutMode === "flex" && <span style={{ fontSize: 10, opacity: 0.4, flexShrink: 0 }}>{element.layoutProps.direction === "row" ? "→" : "↓"}</span>}
        {!isRoot && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              historyStore.pushSnapshot()
              documentStore.toggleLock(elementId)
              bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
            }}
            style={{
              fontSize: 11,
              opacity: element.locked ? 1 : 0,
              cursor: "pointer",
              padding: "0 2px",
              transition: "opacity 0.15s",
              ...(hovered && !element.locked ? { opacity: 0.3 } : {}),
            }}
          >
            {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </span>
        )}
      </div>
      {!collapsed &&
        element.children.map((childId) => (
          <LayerTree
            key={childId}
            elementId={childId}
            depth={depth + 1}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
            drag={drag}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        ))}
    </div>
  )
})
