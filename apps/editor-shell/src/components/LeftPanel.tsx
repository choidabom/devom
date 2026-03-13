import { type ReactNode, useState, useCallback, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Lock, Unlock, Square, Columns3, Type, LayoutGrid, ImageIcon, MousePointerClick, TextCursorInput, ChevronRight, LayoutList } from "lucide-react"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"

export const LeftPanel = observer(function LeftPanel() {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

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
        <LayerTree elementId={documentStore.rootId} depth={0} collapsedIds={collapsedIds} onToggleCollapse={toggleCollapse} />
      </div>
    </div>
  )
})

const LayerTree = observer(function LayerTree({
  elementId,
  depth,
  collapsedIds,
  onToggleCollapse,
}: {
  elementId: string
  depth: number
  collapsedIds: Set<string>
  onToggleCollapse: (id: string) => void
}) {
  const element = documentStore.getElement(elementId)
  const [hovered, setHovered] = useState(false)
  const collapsed = collapsedIds.has(elementId)
  if (!element) return null
  const isSelected = selectionStore.selectedIds.includes(elementId)
  const isRoot = elementId === documentStore.rootId
  const hasChildren = element.children.length > 0

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

  return (
    <div>
      <div
        data-layer-id={elementId}
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
          padding: "6px 10px",
          paddingLeft: depth * 16 + 10,
          fontSize: 13,
          cursor: isRoot ? "default" : "pointer",
          background: isSelected ? T.accent : hovered && !isRoot ? T.hover : "transparent",
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
        }}
      >
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
        element.children.map((childId) => <LayerTree key={childId} elementId={childId} depth={depth + 1} collapsedIds={collapsedIds} onToggleCollapse={onToggleCollapse} />)}
    </div>
  )
})
