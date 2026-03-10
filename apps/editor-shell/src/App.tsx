import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import type { EditorMessage, ElementType } from "@devom/editor-core"
import { exportToJSON, exportToJSX, exportToHTML } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"

// --- Design tokens ---
const T = {
  bg: "#eeeef2",
  panel: "#ffffff",
  panelBorder: "#e4e4e8",
  panelRadius: 12,
  panelShadow: "0 1px 4px rgba(0,0,0,0.06)",
  accent: "#6366f1",
  accentLight: "#ede9fe",
  text: "#1e1e2e",
  textSub: "#71717a",
  textMuted: "#a1a1aa",
  inputBg: "#f4f4f5",
  inputBorder: "#e4e4e7",
  border: "#e4e4e8",
  hover: "#f4f4f5",
} as const

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
        case "KEY_EVENT": {
          const k = msg.payload
          if (k.key === "Delete" || k.key === "Backspace") {
            handleDelete()
          }
          if ((k.metaKey || k.ctrlKey) && k.key === "z") {
            if (k.shiftKey) handleRedo()
            else handleUndo()
          }
          break
        }
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
        bridge.send({ type: "ADD_ELEMENT", payload: { ...element, style: { ...element.style }, props: { ...element.props }, children: [...element.children] } })
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, color: T.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Toolbar */}
      <Toolbar
        onAdd={handleAddElement}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={() => setShowExport(true)}
        onDelete={handleDelete}
        canUndo={historyStore.canUndo}
        canRedo={historyStore.canRedo}
        hasSelection={!!selected && !selected.locked}
      />

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
        {/* Left Panel */}
        <div style={{ width: 240, flexShrink: 0, padding: "0 8px 8px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          <LeftPanel />
        </div>

        {/* Canvas iframe */}
        <div style={{ flex: 1, position: "relative" }}>
          <iframe
            ref={iframeRef}
            src={import.meta.env.VITE_CANVAS_ORIGIN || "http://localhost:4001"}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: T.panelRadius, background: T.panel }}
            title="Editor Canvas"
          />
        </div>

        {/* Right Panel */}
        <div style={{ width: 280, flexShrink: 0, padding: "0 8px 8px 8px" }}>
          <div style={{ background: T.panel, borderRadius: T.panelRadius, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`, height: "100%", overflowY: "auto" }}>
            {selected ? <PropertiesPanel /> : (
              <div style={{ padding: 20, color: T.textMuted, fontSize: 13, textAlign: "center" }}>
                Select an element
              </div>
            )}
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
})

// --- Toolbar ---

function Toolbar({ onAdd, onUndo, onRedo, onExport, onDelete, canUndo, canRedo, hasSelection }: {
  onAdd: (type: ElementType) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onDelete: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
}) {
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

// --- Left Panel ---

const LeftPanel = observer(function LeftPanel() {
  return (
    <div style={{ background: T.panel, borderRadius: T.panelRadius, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Layers header */}
      <div style={{ padding: "14px 16px 10px", fontSize: 13, fontWeight: 600, color: T.text }}>
        Layers
      </div>
      {/* Layer tree */}
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

// --- Properties Panel ---

const PropertiesPanel = observer(function PropertiesPanel() {
  const element = selectionStore.selectedElement
  if (!element) return null

  const updateStyle = (key: string, value: string) => {
    historyStore.pushSnapshot()
    const parsed = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value
    documentStore.updateStyle(element.id, { [key]: parsed })
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateProp = (key: string, value: string) => {
    historyStore.pushSnapshot()
    documentStore.updateProps(element.id, { [key]: value })
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const isShadcn = element.type.startsWith("sc:")

  return (
    <div style={{ padding: "12px 0" }}>
      {/* Position */}
      <PropSection title="Position">
        <PropGrid>
          <PropCompact label="X" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
          <PropCompact label="Y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
        </PropGrid>
      </PropSection>

      {/* Size — only for non-shadcn or card */}
      {(!isShadcn || element.type === "sc:card" || element.type === "sc:input") && (
        <PropSection title="Size">
          <PropGrid>
            <PropCompact label="W" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
            <PropCompact label="H" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
          </PropGrid>
        </PropSection>
      )}

      {/* shadcn Component Props */}
      {element.type === "sc:button" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Label" value={element.props.label as string ?? "Button"} onChange={(v) => updateProp("label", v)} />
            <PropRow label="Variant" value={element.props.variant as string ?? "default"} onChange={(v) => updateProp("variant", v)} />
            <PropRow label="Size" value={element.props.size as string ?? "default"} onChange={(v) => updateProp("size", v)} />
          </div>
        </PropSection>
      )}

      {element.type === "sc:card" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Title" value={element.props.title as string ?? ""} onChange={(v) => updateProp("title", v)} />
            <PropRow label="Desc" value={element.props.description as string ?? ""} onChange={(v) => updateProp("description", v)} />
            <PropRow label="Content" value={element.props.content as string ?? ""} onChange={(v) => updateProp("content", v)} />
          </div>
        </PropSection>
      )}

      {element.type === "sc:input" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Placeholder" value={element.props.placeholder as string ?? ""} onChange={(v) => updateProp("placeholder", v)} />
            <PropRow label="Type" value={element.props.type as string ?? "text"} onChange={(v) => updateProp("type", v)} />
          </div>
        </PropSection>
      )}

      {element.type === "sc:badge" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Label" value={element.props.label as string ?? "Badge"} onChange={(v) => updateProp("label", v)} />
            <PropRow label="Variant" value={element.props.variant as string ?? "default"} onChange={(v) => updateProp("variant", v)} />
          </div>
        </PropSection>
      )}

      {/* Style — only for non-shadcn elements */}
      {!isShadcn && (
        <PropSection title="Style">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Visible" value="Yes" onChange={() => {}} />
            <PropRow label="Opacity" value={element.style.opacity ?? 1} onChange={(v) => updateStyle("opacity", v)} />
            <PropRow label="Radius" value={element.style.borderRadius ?? 0} onChange={(v) => updateStyle("borderRadius", v)} />
            <PropRow label="Fill" value={element.style.backgroundColor ?? ""} onChange={(v) => updateStyle("backgroundColor", v)} color />
            <PropRow label="Color" value={element.style.color ?? ""} onChange={(v) => updateStyle("color", v)} color />
            <PropRow label="Padding" value={element.style.padding ?? 0} onChange={(v) => updateStyle("padding", v)} />
            <PropRow label="Gap" value={element.style.gap ?? 0} onChange={(v) => updateStyle("gap", v)} />
          </div>
        </PropSection>
      )}

      {/* Container */}
      {(element.type === "flex" || element.type === "grid") && (
        <PropSection title="Container">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {element.type === "flex" && (
              <PropRow label="Direction" value={element.style.flexDirection ?? "row"} onChange={(v) => updateStyle("flexDirection", v)} />
            )}
            {element.type === "grid" && (
              <PropRow label="Columns" value={element.style.gridTemplateColumns ?? "1fr 1fr"} onChange={(v) => updateStyle("gridTemplateColumns", v)} />
            )}
          </div>
        </PropSection>
      )}
    </div>
  )
})

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8, padding: "0 14px" }}>{title}</div>
      {children}
    </div>
  )
}

function PropGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px" }}>
      {children}
    </div>
  )
}

function PropCompact({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, color: T.textMuted }}>{label}</span>
      <input
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "5px 8px",
          background: T.inputBg, border: `1px solid ${T.inputBorder}`,
          borderRadius: 6, color: T.text, fontSize: 12, boxSizing: "border-box",
          outline: "none",
        }}
      />
    </div>
  )
}

function PropRow({ label, value, onChange, color }: { label: string; value: string | number; onChange: (v: string) => void; color?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        {color && (
          <div style={{
            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
            background: String(value) || "#fff", border: `1px solid ${T.inputBorder}`,
          }} />
        )}
        <input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, padding: "5px 8px",
            background: T.inputBg, border: `1px solid ${T.inputBorder}`,
            borderRadius: 6, color: T.text, fontSize: 12, minWidth: 0,
            outline: "none",
          }}
        />
      </div>
    </div>
  )
}

// --- Export Modal ---

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
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: T.panel, borderRadius: 16, width: 640, maxHeight: "80vh",
        display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
        border: `1px solid ${T.panelBorder}`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["json", "jsx", "html"] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{
                padding: "6px 14px", background: format === f ? T.accent : "transparent",
                color: format === f ? "#fff" : T.text, border: `1px solid ${format === f ? T.accent : T.inputBorder}`,
                borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500, textTransform: "uppercase",
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={{
              padding: "6px 16px", background: T.accent, color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>{copied ? "Copied!" : "Copy"}</button>
            <button onClick={onClose} style={{
              padding: "6px 10px", background: T.hover, color: T.textSub,
              border: `1px solid ${T.inputBorder}`, borderRadius: 6, cursor: "pointer", fontSize: 14,
            }}>✕</button>
          </div>
        </div>
        <textarea value={output} readOnly style={{
          flex: 1, minHeight: 300, padding: 20, background: "#fafafa", color: T.text,
          border: "none", fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12, resize: "none",
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }} />
      </div>
    </div>
  )
})
