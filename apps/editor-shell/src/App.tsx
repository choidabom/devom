import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import type { EditorMessage, ElementType, SectionRole } from "@devom/editor-core"
import { exportToJSX, exportToHTML } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"
import { T } from "./theme"
import { Toolbar, type AlignType } from "./components/Toolbar"
import { LeftPanel } from "./components/LeftPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { ExportModal } from "./components/ExportModal"
import { LayoutGuide } from "./components/LayoutGuide"

import type { EditorElement } from "@devom/editor-core"

// Module-level clipboard for copy/paste
let clipboard: EditorElement[] = []

export const App = observer(function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showExport, setShowExport] = useState(false)
  const [editorMode, setEditorMode] = useState<"edit" | "interact">("edit")
  const [canvasMode, setCanvasMode] = useState<"canvas" | "page">("canvas")

  useEffect(() => {
    const dispose = bridge.onMessage((msg: EditorMessage) => {
      switch (msg.type) {
        case "CANVAS_READY": {
          const data = documentStore.toSerializable()
          bridge.send({ type: "SYNC_DOCUMENT", payload: data })
          break
        }
        case "ELEMENT_CLICKED":
          if (msg.payload.shiftKey) {
            selectionStore.toggle(msg.payload.id)
          } else {
            selectionStore.select(msg.payload.id, msg.payload.bounds)
          }
          bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [...selectionStore.selectedIds] } })
          break
        case "ELEMENT_MOVED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { left: msg.payload.x, top: msg.payload.y })
          syncToCanvas()
          break
        case "ELEMENTS_MOVED":
          historyStore.pushSnapshot()
          for (const move of msg.payload.moves) {
            documentStore.updateStyle(move.id, { left: move.x, top: move.y })
          }
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
        case "MARQUEE_SELECT":
          selectionStore.setIds(msg.payload.ids)
          break
        case "KEY_EVENT": {
          const k = msg.payload
          if (k.key === "Escape" && editorMode === "interact") {
            setEditorMode("edit")
            bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
            return
          }
          if (k.key === "Delete" || k.key === "Backspace") {
            handleDelete()
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyZ") {
            if (k.shiftKey) handleRedo()
            else handleUndo()
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyC") handleCopy()
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyV") handlePaste()
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyD") handleDuplicate()
          break
        }
        case "REORDER_CHILD":
          historyStore.pushSnapshot()
          documentStore.reorderChild(msg.payload.parentId, msg.payload.childId, msg.payload.newIndex)
          syncToCanvas()
          break
        case "REPARENT_ELEMENT":
          historyStore.pushSnapshot()
          documentStore.reparentElement(msg.payload.id, msg.payload.newParentId, msg.payload.index, msg.payload.dropPosition)
          syncToCanvas()
          break
        case "SET_PAGE_VIEWPORT_REQUEST":
          documentStore.setPageViewport(msg.payload.width)
          syncToCanvas()
          bridge.send({ type: "SET_PAGE_VIEWPORT", payload: { width: msg.payload.width } })
          break
        case "INSERT_SECTION_REQUEST":
          historyStore.pushSnapshot()
          documentStore.addSection(msg.payload.preset, msg.payload.index)
          syncToCanvas()
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
      selectionStore.select(id)
      syncToCanvas()
      bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [id] } })
    }
  }, [syncToCanvas])

  const handleAddSection = useCallback((role: SectionRole) => {
    historyStore.pushSnapshot()
    documentStore.addSection(role)
    syncToCanvas()
  }, [syncToCanvas])

  const handleDelete = useCallback(() => {
    if (selectionStore.selectedIds.length === 0) return
    historyStore.pushSnapshot()
    const toDelete = [...selectionStore.selectedIds].filter(id => {
      const el = documentStore.getElement(id)
      return el && !el.locked && el.id !== documentStore.rootId
    })
    for (const id of toDelete) {
      documentStore.removeElement(id)
    }
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

  const handleCopy = useCallback(() => {
    const elements = selectionStore.selectedElements.filter(el => !el.locked && el.id !== documentStore.rootId)
    if (elements.length === 0) return
    clipboard = elements.map(el => JSON.parse(JSON.stringify(el)))
  }, [])

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return
    historyStore.pushSnapshot()
    const newIds = documentStore.pasteElements(clipboard)
    selectionStore.setIds(newIds)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newIds } })
  }, [syncToCanvas])

  const handleDuplicate = useCallback(() => {
    const ids = selectionStore.selectedIds.filter(id => {
      const el = documentStore.getElement(id)
      return el && !el.locked && el.id !== documentStore.rootId
    })
    if (ids.length === 0) return
    historyStore.pushSnapshot()
    const newIds = documentStore.duplicateElements(ids)
    selectionStore.setIds(newIds)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newIds } })
  }, [syncToCanvas])

  const handleAlign = useCallback((type: AlignType) => {
    const elements = selectionStore.selectedElements.filter(
      el => !el.locked && el.id !== documentStore.rootId && el.style.position === "absolute"
    )
    if (elements.length < 2) return

    historyStore.pushSnapshot()

    const bounds = elements.map(el => ({
      id: el.id,
      left: typeof el.style.left === "number" ? el.style.left : 0,
      top: typeof el.style.top === "number" ? el.style.top : 0,
      width: typeof el.style.width === "number" ? el.style.width : 100,
      height: typeof el.style.height === "number" ? el.style.height : 40,
    }))

    switch (type) {
      case "left": {
        const min = Math.min(...bounds.map(b => b.left))
        for (const b of bounds) documentStore.updateStyle(b.id, { left: min })
        break
      }
      case "right": {
        const max = Math.max(...bounds.map(b => b.left + b.width))
        for (const b of bounds) documentStore.updateStyle(b.id, { left: max - b.width })
        break
      }
      case "center-h": {
        const min = Math.min(...bounds.map(b => b.left))
        const max = Math.max(...bounds.map(b => b.left + b.width))
        const center = (min + max) / 2
        for (const b of bounds) documentStore.updateStyle(b.id, { left: Math.round(center - b.width / 2) })
        break
      }
      case "top": {
        const min = Math.min(...bounds.map(b => b.top))
        for (const b of bounds) documentStore.updateStyle(b.id, { top: min })
        break
      }
      case "bottom": {
        const max = Math.max(...bounds.map(b => b.top + b.height))
        for (const b of bounds) documentStore.updateStyle(b.id, { top: max - b.height })
        break
      }
      case "center-v": {
        const min = Math.min(...bounds.map(b => b.top))
        const max = Math.max(...bounds.map(b => b.top + b.height))
        const center = (min + max) / 2
        for (const b of bounds) documentStore.updateStyle(b.id, { top: Math.round(center - b.height / 2) })
        break
      }
      case "distribute-h": {
        if (bounds.length < 3) break
        const sorted = [...bounds].sort((a, b) => a.left - b.left)
        const first = sorted[0]!
        const last = sorted[sorted.length - 1]!
        const totalWidth = sorted.reduce((sum, b) => sum + b.width, 0)
        const gap = (last.left + last.width - first.left - totalWidth) / (sorted.length - 1)
        let x = first.left + first.width + gap
        for (let i = 1; i < sorted.length - 1; i++) {
          documentStore.updateStyle(sorted[i]!.id, { left: Math.round(x) })
          x += sorted[i]!.width + gap
        }
        break
      }
      case "distribute-v": {
        if (bounds.length < 3) break
        const sorted = [...bounds].sort((a, b) => a.top - b.top)
        const first = sorted[0]!
        const last = sorted[sorted.length - 1]!
        const totalHeight = sorted.reduce((sum, b) => sum + b.height, 0)
        const gap = (last.top + last.height - first.top - totalHeight) / (sorted.length - 1)
        let y = first.top + first.height + gap
        for (let i = 1; i < sorted.length - 1; i++) {
          documentStore.updateStyle(sorted[i]!.id, { top: Math.round(y) })
          y += sorted[i]!.height + gap
        }
        break
      }
    }

    syncToCanvas()
  }, [syncToCanvas])

  const handleToggleCanvasMode = useCallback(() => {
    setCanvasMode(prev => {
      const next = prev === 'canvas' ? 'page' : 'canvas'
      historyStore.pushSnapshot()
      documentStore.setCanvasMode(next)
      syncToCanvas()
      bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: next } })
      return next
    })
  }, [syncToCanvas])

  const handleToggleMode = useCallback(() => {
    setEditorMode(prev => {
      const next = prev === "edit" ? "interact" : "edit"
      bridge.send({ type: "SET_MODE", payload: { mode: next } })
      if (next === "interact") selectionStore.clear()
      return next
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return

      // Modifier shortcuts take priority — use e.code for Korean IME compatibility
      if (e.metaKey || e.ctrlKey) {
        if (e.code === "KeyZ") {
          e.preventDefault()
          if (e.shiftKey) handleRedo()
          else handleUndo()
        }
        if (e.code === "KeyC") {
          e.preventDefault()
          handleCopy()
        }
        if (e.code === "KeyV") {
          e.preventDefault()
          handlePaste()
        }
        if (e.code === "KeyD") {
          e.preventDefault()
          handleDuplicate()
        }
        return
      }

      // Single-key mode switches (no modifier)
      if (e.key === "v" || e.key === "V") {
        if (editorMode !== "edit") {
          setEditorMode("edit")
          bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
        }
        return
      }
      if (e.key === "p" || e.key === "P") {
        if (editorMode !== "interact") {
          setEditorMode("interact")
          selectionStore.clear()
          bridge.send({ type: "SET_MODE", payload: { mode: "interact" } })
        }
        return
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleDelete, handleUndo, handleRedo, handleCopy, handlePaste, handleDuplicate, editorMode])

  const selectedElements = selectionStore.selectedElements
  const hasSelection = selectedElements.length > 0 && selectedElements.some(el => !el.locked)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, color: T.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div data-guide="toolbar">
        <Toolbar
          onAdd={handleAddElement}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={() => setShowExport(true)}
          onDelete={handleDelete}
          onAlign={handleAlign}
          canUndo={historyStore.canUndo}
          canRedo={historyStore.canRedo}
          hasSelection={hasSelection}
          multiSelected={selectedElements.length >= 2}
          editorMode={editorMode}
          onToggleMode={handleToggleMode}
          canvasMode={canvasMode}
          onToggleCanvasMode={handleToggleCanvasMode}
          onAddSection={handleAddSection}
        />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
        <div data-guide="layers" style={{ width: 240, flexShrink: 0, padding: "0 8px 8px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          <LeftPanel />
        </div>

        <div data-guide="canvas" style={{ flex: 1, position: "relative" }}>
          <iframe
            ref={iframeRef}
            src={import.meta.env.VITE_CANVAS_ORIGIN || "http://localhost:4001"}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: T.panelRadius, background: T.panel }}
            title="Editor Canvas"
          />
        </div>

        <div data-guide="properties" style={{ width: 280, flexShrink: 0, padding: "0 8px 8px 8px" }}>
          <div style={{ background: T.panel, borderRadius: T.panelRadius, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {editorMode === "interact" ? (
              <CodePreviewPanel />
            ) : selectedElements.length > 0 ? <PropertiesPanel /> : (
              <div style={{ padding: 20, color: T.textMuted, fontSize: 13, textAlign: "center" }}>
                Select an element
              </div>
            )}
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      <LayoutGuide />
    </div>
  )
})

const CodePreviewPanel = observer(function CodePreviewPanel() {
  const [format, setFormat] = useState<"jsx" | "html">("jsx")
  const [copied, setCopied] = useState(false)
  const data = documentStore.toSerializable()
  const output = format === "jsx"
    ? exportToJSX(data.elements, data.rootId)
    : exportToHTML(data.elements, data.rootId)

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 4, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>Code</span>
        {(["jsx", "html"] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} style={{
            padding: "3px 8px", fontSize: 11, fontWeight: 500,
            background: format === f ? T.accent : "transparent",
            color: format === f ? "#fff" : T.textMuted,
            border: `1px solid ${format === f ? T.accent : T.inputBorder}`,
            borderRadius: 4, cursor: "pointer", textTransform: "uppercase",
          }}>{f}</button>
        ))}
        <button onClick={handleCopy} style={{
          padding: "3px 8px", fontSize: 11, fontWeight: 500,
          background: "transparent", color: T.textMuted,
          border: `1px solid ${T.inputBorder}`, borderRadius: 4, cursor: "pointer",
        }}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre style={{
        flex: 1, margin: 0, padding: 12, fontSize: 11, lineHeight: 1.5,
        fontFamily: "'SF Mono', Menlo, monospace", color: T.text,
        background: "#fafafa", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
        borderBottomLeftRadius: T.panelRadius, borderBottomRightRadius: T.panelRadius,
      }}>{output}</pre>
    </>
  )
})
