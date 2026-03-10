import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import type { EditorMessage, ElementType } from "@devom/editor-core"
import { exportToJSON, exportToJSX, exportToHTML } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"

export const App = observer(function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    const dispose = bridge.onMessage((msg: EditorMessage) => {
      switch (msg.type) {
        case "CANVAS_READY": {
          const data = documentStore.toSerializable()
          bridge.send({ type: "SYNC_DOCUMENT", payload: data })
          break
        }
        case "ELEMENT_CLICKED":
          selectionStore.select(msg.payload.id, msg.payload.bounds)
          break
        case "ELEMENT_MOVED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { left: msg.payload.x, top: msg.payload.y })
          syncToCanvas()
          break
        case "ELEMENT_RESIZED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { width: msg.payload.width, height: msg.payload.height })
          syncToCanvas()
          break
        case "CANVAS_CLICKED":
          selectionStore.clear()
          break
      }
    })

    return dispose
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe) {
      const onLoad = () => {
        if (iframe.contentWindow) {
          bridge.setTarget(iframe.contentWindow)
          // Retry sync after short delay in case CANVAS_READY was missed
          setTimeout(() => {
            bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
          }, 100)
        }
      }
      iframe.addEventListener("load", onLoad)
      return () => iframe.removeEventListener("load", onLoad)
    }
  }, [])

  const syncToCanvas = useCallback(() => {
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }, [])

  const handleAddElement = useCallback((type: ElementType) => {
    historyStore.pushSnapshot()
    const id = documentStore.addElement(type)
    if (id) {
      const element = documentStore.getElement(id)
      if (element) {
        bridge.send({ type: "ADD_ELEMENT", payload: element })
        selectionStore.select(id)
      }
    }
  }, [])

  const handleDelete = useCallback(() => {
    if (!selectionStore.selectedId) return
    historyStore.pushSnapshot()
    documentStore.removeElement(selectionStore.selectedId)
    selectionStore.clear()
    syncToCanvas()
  }, [syncToCanvas])

  const handleUndo = useCallback(() => {
    historyStore.undo()
    selectionStore.clear()
    syncToCanvas()
  }, [syncToCanvas])

  const handleRedo = useCallback(() => {
    historyStore.redo()
    selectionStore.clear()
    syncToCanvas()
  }, [syncToCanvas])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName !== "INPUT") {
          handleDelete()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleDelete, handleUndo, handleRedo])

  const selected = selectionStore.selectedElement

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #1e293b", alignItems: "center", flexShrink: 0 }}>
        <ToolButton label="div" onClick={() => handleAddElement("div")} />
        <ToolButton label="T" title="Text" onClick={() => handleAddElement("text")} />
        <ToolButton label="img" onClick={() => handleAddElement("image")} />
        <ToolButton label="btn" onClick={() => handleAddElement("button")} />
        <ToolButton label="input" onClick={() => handleAddElement("input")} />
        <Divider />
        <ToolButton label="flex" onClick={() => handleAddElement("flex")} />
        <ToolButton label="grid" onClick={() => handleAddElement("grid")} />
        <Divider />
        <ToolButton label="↶" title="Undo" onClick={handleUndo} disabled={!historyStore.canUndo} />
        <ToolButton label="↷" title="Redo" onClick={handleRedo} disabled={!historyStore.canRedo} />
        <Divider />
        <ToolButton label="Export" onClick={() => setShowExport(true)} />
        {selected && !selected.locked && (
          <>
            <Divider />
            <ToolButton label="✕" title="Delete" onClick={handleDelete} />
          </>
        )}
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Layers */}
        <div style={{ width: 200, borderRight: "1px solid #1e293b", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#64748b", borderBottom: "1px solid #1e293b" }}>
            Layers
          </div>
          <div style={{ padding: 4 }}>
            <LayerTree elementId={documentStore.rootId} depth={0} />
          </div>
        </div>

        {/* Canvas iframe */}
        <div style={{ flex: 1, position: "relative", background: "#1e293b" }}>
          <iframe
            ref={iframeRef}
            src={import.meta.env.VITE_CANVAS_URL || "http://localhost:4001"}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Editor Canvas"
          />
        </div>

        {/* Properties */}
        <div style={{ width: 260, borderLeft: "1px solid #1e293b", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#64748b", borderBottom: "1px solid #1e293b" }}>
            Properties
          </div>
          <div style={{ padding: 12 }}>
            {selected ? <PropertiesPanel /> : <div style={{ color: "#475569", fontSize: 13 }}>Select an element</div>}
          </div>
        </div>
      </div>
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
})

// --- Sub-components ---

function ToolButton({ label, onClick, disabled, title }: { label: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      style={{
        padding: "4px 10px",
        background: "#1e293b",
        color: disabled ? "#475569" : "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 13,
        lineHeight: "20px",
      }}
    >
      {label}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: "#334155", margin: "0 4px" }} />
}

const LayerTree = observer(function LayerTree({ elementId, depth }: { elementId: string; depth: number }) {
  const element = documentStore.getElement(elementId)
  if (!element) return null
  const isSelected = selectionStore.selectedId === elementId
  const isRoot = elementId === documentStore.rootId

  return (
    <div>
      <div
        onClick={() => {
          if (!isRoot) {
            selectionStore.select(elementId)
            bridge.send({ type: "SELECT_ELEMENT", payload: { id: elementId } })
          }
        }}
        style={{
          padding: "3px 8px",
          paddingLeft: depth * 12 + 8,
          fontSize: 12,
          cursor: isRoot ? "default" : "pointer",
          background: isSelected ? "#1d4ed8" : "transparent",
          borderRadius: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: isRoot ? "#64748b" : "#e2e8f0",
        }}
      >
        <span style={{ marginRight: 4, opacity: 0.5 }}>
          {element.type === "flex" ? "▤" : element.type === "grid" ? "▦" : element.type === "text" ? "T" : "□"}
        </span>
        {element.name}
      </div>
      {element.children.map((childId) => (
        <LayerTree key={childId} elementId={childId} depth={depth + 1} />
      ))}
    </div>
  )
})

const PropertiesPanel = observer(function PropertiesPanel() {
  const element = selectionStore.selectedElement
  if (!element) return null

  const updateStyle = (key: string, value: string) => {
    historyStore.pushSnapshot()
    const parsed = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value
    documentStore.updateStyle(element.id, { [key]: parsed })
    bridge.send({ type: "UPDATE_STYLE", payload: { id: element.id, style: { [key]: parsed } } })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{element.type}</span>
        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{element.name}</span>
      </div>

      <PropSection title="Layout">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <PropRow label="x" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
          <PropRow label="y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
          <PropRow label="w" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
          <PropRow label="h" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
        </div>
      </PropSection>

      <PropSection title="Appearance">
        <PropRow label="bg" value={element.style.backgroundColor ?? ""} onChange={(v) => updateStyle("backgroundColor", v)} />
        <PropRow label="color" value={element.style.color ?? ""} onChange={(v) => updateStyle("color", v)} />
        <PropRow label="radius" value={element.style.borderRadius ?? 0} onChange={(v) => updateStyle("borderRadius", v)} />
        <PropRow label="opacity" value={element.style.opacity ?? 1} onChange={(v) => updateStyle("opacity", v)} />
      </PropSection>

      <PropSection title="Spacing">
        <PropRow label="padding" value={element.style.padding ?? 0} onChange={(v) => updateStyle("padding", v)} />
        <PropRow label="gap" value={element.style.gap ?? 0} onChange={(v) => updateStyle("gap", v)} />
      </PropSection>

      {(element.type === "flex" || element.type === "grid") && (
        <PropSection title="Container">
          {element.type === "flex" && (
            <PropRow label="direction" value={element.style.flexDirection ?? "row"} onChange={(v) => updateStyle("flexDirection", v)} />
          )}
          {element.type === "grid" && (
            <PropRow label="columns" value={element.style.gridTemplateColumns ?? "1fr 1fr"} onChange={(v) => updateStyle("gridTemplateColumns", v)} />
          )}
        </PropSection>
      )}
    </div>
  )
})

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", fontWeight: 500 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  )
}

function PropRow({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#94a3b8", width: 48, flexShrink: 0 }}>{label}</span>
      <input
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "3px 6px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 3,
          color: "#e2e8f0",
          fontSize: 12,
          minWidth: 0,
        }}
      />
    </div>
  )
}

const ExportModal = observer(function ExportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<"json" | "jsx" | "html">("json")
  const [copied, setCopied] = useState(false)
  const data = documentStore.toSerializable()

  const output = format === "json"
    ? exportToJSON(data.elements, data.rootId)
    : format === "jsx"
    ? exportToJSX(data.elements, data.rootId)
    : exportToHTML(data.elements, data.rootId)

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#1e293b", borderRadius: 8, width: 600, maxHeight: "80vh",
        display: "flex", flexDirection: "column", border: "1px solid #334155",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #334155" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["json", "jsx", "html"] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{
                padding: "4px 12px", background: format === f ? "#3b82f6" : "transparent",
                color: "#e2e8f0", border: "1px solid #334155", borderRadius: 4, cursor: "pointer", fontSize: 12, textTransform: "uppercase",
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={{
              padding: "4px 12px", background: "#3b82f6", color: "#fff",
              border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12,
            }}>{copied ? "Copied!" : "Copy"}</button>
            <button onClick={onClose} style={{
              padding: "4px 8px", background: "transparent", color: "#94a3b8",
              border: "1px solid #334155", borderRadius: 4, cursor: "pointer", fontSize: 14,
            }}>✕</button>
          </div>
        </div>
        <textarea value={output} readOnly style={{
          flex: 1, minHeight: 300, padding: 16, background: "#0f172a", color: "#e2e8f0",
          border: "none", fontFamily: "monospace", fontSize: 12, resize: "none",
        }} />
      </div>
    </div>
  )
})
