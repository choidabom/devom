import { type ReactNode, useState } from "react"
import { observer } from "mobx-react-lite"
import {
  Lock, Unlock, Square, Columns3, Type, LayoutGrid,
  ImageIcon, MousePointerClick, TextCursorInput, ChevronRight,
} from "lucide-react"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"

export const LeftPanel = observer(function LeftPanel() {
  return (
    <div style={{ background: T.panel, borderRadius: T.panelRadius, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px 10px", fontSize: 13, fontWeight: 600, color: T.text }}>
        Layers
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 8px" }}>
        <LayerTree elementId={documentStore.rootId} depth={0} />
      </div>
    </div>
  )
})

const LayerTree = observer(function LayerTree({ elementId, depth }: { elementId: string; depth: number }) {
  const element = documentStore.getElement(elementId)
  const [hovered, setHovered] = useState(false)
  if (!element) return null
  const isSelected = selectionStore.selectedIds.includes(elementId)
  const isRoot = elementId === documentStore.rootId

  const S = 12
  const iconMap: Record<string, ReactNode> = {
    div: <Square size={S} />, flex: <Columns3 size={S} />, grid: <LayoutGrid size={S} />,
    text: <Type size={S} />, image: <ImageIcon size={S} />,
    button: <MousePointerClick size={S} />, input: <TextCursorInput size={S} />,
    "sc:button": <MousePointerClick size={S} />, "sc:card": <Square size={S} />,
    "sc:input": <TextCursorInput size={S} />, "sc:badge": <Square size={S} />,
  }
  const icon = iconMap[element.type] ?? <Square size={S} />

  return (
    <div>
      <div
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
        {!isRoot && element.children.length > 0 && (
          <ChevronRight size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
        )}
        <span style={{ opacity: isSelected ? 0.8 : 0.5, display: "flex", flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{element.name}</span>
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
      {element.children.map((childId) => (
        <LayerTree key={childId} elementId={childId} depth={depth + 1} />
      ))}
    </div>
  )
})
