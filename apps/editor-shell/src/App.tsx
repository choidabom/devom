import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import type { EditorMessage, ElementType } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"
import { T } from "./theme"
import { Toolbar } from "./components/Toolbar"
import { LeftPanel } from "./components/LeftPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { ExportModal } from "./components/ExportModal"
import { LayoutGuide } from "./components/LayoutGuide"

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
        bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [id] } })
      }
    }
  }, [])

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
          canUndo={historyStore.canUndo}
          canRedo={historyStore.canRedo}
          hasSelection={hasSelection}
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
          <div style={{ background: T.panel, borderRadius: T.panelRadius, boxShadow: T.panelShadow, border: `1px solid ${T.panelBorder}`, height: "100%", overflowY: "auto" }}>
            {selectedElements.length > 0 ? <PropertiesPanel /> : (
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
