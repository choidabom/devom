import { useState } from "react"
import { observer } from "mobx-react-lite"
import { documentStore, selectionStore, bridge } from "../stores"
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
  const isSelected = selectionStore.selectedId === elementId
  const isRoot = elementId === documentStore.rootId

  const iconMap: Record<string, string> = { flex: "◇", grid: "▦", text: "T", image: "▲", button: "/b", input: "◉", "sc:button": "Btn", "sc:card": "Card", "sc:input": "Inp", "sc:badge": "Bdg" }
  const icon = iconMap[element.type] ?? "◆"

  return (
    <div>
      <div
        onClick={() => {
          if (!isRoot) {
            selectionStore.select(elementId)
            bridge.send({ type: "SELECT_ELEMENT", payload: { id: elementId } })
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
          <span style={{ fontSize: 10, opacity: 0.5 }}>›</span>
        )}
        <span style={{ fontSize: 11, opacity: isSelected ? 0.8 : 0.5 }}>{icon}</span>
        {element.name}
      </div>
      {element.children.map((childId) => (
        <LayerTree key={childId} elementId={childId} depth={depth + 1} />
      ))}
    </div>
  )
})
