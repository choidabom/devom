import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import type { EditorMessage, ElementType, SectionRole } from "@devom/editor-core"
import { exportToJSX, exportToHTML, importJSX } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"
import { T } from "./theme"
import { Toolbar, type AlignType } from "./components/Toolbar"
import { LeftPanel } from "./components/LeftPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { ExportModal } from "./components/ExportModal"
import { ImportJSXModal } from "./components/ImportJSXModal"
import { LayoutGuide } from "./components/LayoutGuide"

import type { EditorElement } from "@devom/editor-core"

// Module-level clipboard for copy/paste
let clipboard: EditorElement[] = []

export const App = observer(function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [showExport, setShowExport] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [editorMode, setEditorMode] = useState<"edit" | "interact">("edit")
  const [canvasMode, setCanvasMode] = useState<"canvas" | "page">("canvas")
  const [showPanels, setShowPanels] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(240)
  const [isResizing, setIsResizing] = useState(false)

  const showPanelsRef = useRef(showPanels)
  showPanelsRef.current = showPanels
  const leftPanelWidthRef = useRef(leftPanelWidth)
  leftPanelWidthRef.current = leftPanelWidth

  const RIGHT_PANEL_WIDTH = 280

  const getVisibleCanvasInfo = useCallback(() => {
    const container = canvasContainerRef.current
    if (!container) return { visibleWidth: undefined, leftOffset: undefined }
    const totalWidth = container.getBoundingClientRect().width
    if (!showPanelsRef.current) return { visibleWidth: totalWidth, leftOffset: 0 }
    const leftPanelTotal = leftPanelWidthRef.current + 12 // panel width + left padding
    const rightPanelTotal = RIGHT_PANEL_WIDTH + 16 // panel width + padding
    const visibleWidth = totalWidth - leftPanelTotal - rightPanelTotal
    return { visibleWidth, leftOffset: leftPanelTotal }
  }, [])

  useEffect(() => {
    const dispose = bridge.onMessage((msg: EditorMessage) => {
      switch (msg.type) {
        case "CANVAS_READY": {
          const data = documentStore.toSerializable()
          bridge.send({ type: "SYNC_DOCUMENT", payload: data })
          // Sync canvas mode if not default
          if (documentStore.canvasMode !== 'canvas') {
            { const info = getVisibleCanvasInfo(); bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: documentStore.canvasMode, ...info } }) }
            setCanvasMode(documentStore.canvasMode)
          }
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
            setShowPanels(true)
            return
          }
          if (k.key === "Delete" || k.key === "Backspace") {
            handleDelete()
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyZ") {
            if (k.shiftKey) handleRedo()
            else handleUndo()
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "Backslash") { setShowPanels(prev => !prev); return }
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyC") handleCopy()
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyX") handleCut()
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
          { const info = getVisibleCanvasInfo(); bridge.send({ type: "SET_PAGE_VIEWPORT", payload: { width: msg.payload.width, ...info } }) }
          break
        case "INSERT_SECTION_REQUEST":
          historyStore.pushSnapshot()
          documentStore.addSection(msg.payload.preset, msg.payload.index)
          syncToCanvas()
          break
        case "GROUP_ELEMENTS_REQUEST": {
          historyStore.pushSnapshot()
          const groupId = documentStore.groupElements(msg.payload.ids, msg.payload.elementBounds)
          if (groupId) {
            selectionStore.select(groupId)
            syncToCanvas()
            bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [groupId] } })
          }
          break
        }
        case "UNGROUP_ELEMENTS_REQUEST": {
          const ids = msg.payload.ids.filter(id => {
            const el = documentStore.getElement(id)
            return el && !el.locked && el.id !== documentStore.rootId
          })
          if (ids.length === 0) break
          historyStore.pushSnapshot()
          const newSelection = documentStore.ungroupElements(ids)
          selectionStore.setIds(newSelection)
          syncToCanvas()
          if (newSelection.length > 0) {
            bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newSelection } })
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

  const handleAddElement = useCallback((type: ElementType, props?: Record<string, unknown>) => {
    historyStore.pushSnapshot()
    const id = documentStore.addElement(type, undefined, props)
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

  const handleLoadTemplate = useCallback((templateId: string) => {
    historyStore.pushSnapshot()
    documentStore.loadTemplate(templateId)
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }, [syncToCanvas])

  const handleImportJSX = useCallback((code: string, mode: 'replace' | 'add') => {
    if (mode === 'replace' && !confirm('Replace current document with imported JSX?')) return

    setImportWarnings([])
    const result = importJSX(code)

    if (result.warnings.length > 0 && result.elements.length === 0) {
      setImportWarnings(result.warnings)
      return // parse failed — keep modal, show warnings
    }

    historyStore.pushSnapshot()

    if (mode === 'replace') {
      documentStore.resetDocument()
    }

    documentStore.importElements(result.elements)
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })

    if (result.elements.length > 0) {
      setShowImportModal(false)
      setImportWarnings([])
    } else {
      setImportWarnings([...result.warnings, 'No importable elements found in the provided code.'])
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

  const handleCopy = useCallback(() => {
    const elements = selectionStore.selectedElements.filter(el => !el.locked && el.id !== documentStore.rootId)
    if (elements.length === 0) return
    // Filter out elements whose ancestor is already in the selection
    const selectedSet = new Set(elements.map(el => el.id))
    const topLevel = elements.filter(el => {
      let cur = el.parentId
      while (cur) {
        if (selectedSet.has(cur)) return false
        const p = documentStore.getElement(cur)
        cur = p?.parentId ?? null
      }
      return true
    })
    clipboard = topLevel.flatMap(el => documentStore.collectSubtree(el.id))
  }, [])

  const handleCut = useCallback(() => {
    handleCopy()
    handleDelete()
  }, [handleCopy, handleDelete])

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
      { const info = getVisibleCanvasInfo(); bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: next, ...info } }) }
      return next
    })
  }, [syncToCanvas, getVisibleCanvasInfo])

  const handleToggleMode = useCallback(() => {
    setEditorMode(prev => {
      const next = prev === "edit" ? "interact" : "edit"
      bridge.send({ type: "SET_MODE", payload: { mode: next, canvasMode } })
      if (next === "interact") {
        selectionStore.clear()
        // Canvas mode: keep panels visible (no fullscreen expand)
        if (canvasMode === 'page') setShowPanels(false)
      } else {
        setShowPanels(true)
        // Recalculate page mode zoom after panels reappear
        if (canvasMode === 'page') {
          requestAnimationFrame(() => {
            const info = getVisibleCanvasInfo()
            bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: 'page', ...info } })
          })
        }
      }
      return next
    })
  }, [canvasMode, getVisibleCanvasInfo])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      // Modifier shortcuts take priority — use e.code for Korean IME compatibility
      if (e.metaKey || e.ctrlKey) {
        if (e.code === "Backslash") {
          e.preventDefault()
          setShowPanels(prev => !prev)
          return
        }
        if (e.code === "KeyZ") {
          e.preventDefault()
          if (e.shiftKey) handleRedo()
          else handleUndo()
        }
        if (e.code === "KeyC") {
          e.preventDefault()
          handleCopy()
        }
        if (e.code === "KeyX") {
          e.preventDefault()
          handleCut()
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

      // Escape exits interact mode
      if (e.key === "Escape" && editorMode === "interact") {
        setEditorMode("edit")
        bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
        setShowPanels(true)
        return
      }

      // Single-key mode switches (no modifier)
      if (e.key === "v" || e.key === "V") {
        if (editorMode !== "edit") {
          setEditorMode("edit")
          bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
          setShowPanels(true)
        }
        return
      }
      if (e.key === "p" || e.key === "P") {
        if (editorMode !== "interact") {
          setEditorMode("interact")
          selectionStore.clear()
          bridge.send({ type: "SET_MODE", payload: { mode: "interact", canvasMode } })
          // Canvas mode: keep panels visible (no fullscreen expand)
          if (canvasMode === 'page') setShowPanels(false)
        }
        return
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleDelete, handleUndo, handleRedo, handleCopy, handleCut, handlePaste, handleDuplicate, editorMode])

  const selectedElements = selectionStore.selectedElements
  const hasSelection = selectedElements.length > 0 && selectedElements.some(el => !el.locked)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, color: T.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {editorMode === "interact" && canvasMode === 'page' && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "6px 16px",
          backdropFilter: "blur(8px)",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Preview</span>
          <button
            onClick={handleToggleMode}
            style={{
              padding: "4px 12px", fontSize: 11, fontWeight: 500,
              background: "#fff", color: "#000", border: "none",
              borderRadius: 12, cursor: "pointer",
            }}
          >
            Exit (V)
          </button>
        </div>
      )}
      {(editorMode !== "interact" || canvasMode === 'canvas') && (
        <div data-guide="toolbar">
          <Toolbar
            onAdd={handleAddElement}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExport={() => setShowExport(true)}
            onImportJSX={() => setShowImportModal(true)}
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
            onLoadTemplate={handleLoadTemplate}
          />
        </div>
      )}

      <div ref={canvasContainerRef} style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {/* Canvas — always full width */}
        <div data-guide="canvas" style={{ position: "absolute", inset: 0 }}>
          <iframe
            ref={iframeRef}
            src={(import.meta.env.VITE_CANVAS_ORIGIN || (import.meta.env.DEV ? "http://localhost:4001" : window.location.origin)) + (import.meta.env.DEV ? "" : "/canvas/")}
            style={{ width: "100%", height: "100%", border: "none", background: T.panel, pointerEvents: isResizing ? "none" : "auto" }}
            title="Editor Canvas"
          />
        </div>

        {/* Panels — overlay on top of canvas */}
        <div data-guide="layers" style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: leftPanelWidth,
          padding: "0 0 8px 8px", display: "flex", flexDirection: "column", gap: 8,
          transform: showPanels ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.2s ease",
          zIndex: 10,
        }}>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <LeftPanel />
          </div>
          {/* Resize handle — wider hit area, thin visible line */}
          <div
            style={{
              position: "absolute", right: -4, top: 0, bottom: 0, width: 8,
              cursor: "col-resize", zIndex: 11, touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
              setIsResizing(true)
              const startX = e.clientX
              const startW = leftPanelWidth
              const handle = e.currentTarget as HTMLElement
              const line = handle.firstElementChild as HTMLElement
              if (line) line.style.background = T.accent
              const onMove = (ev: PointerEvent) => {
                setLeftPanelWidth(Math.max(180, Math.min(480, startW + ev.clientX - startX)))
              }
              const onUp = () => {
                if (line) line.style.background = ""
                setIsResizing(false)
                handle.removeEventListener("pointermove", onMove)
                handle.removeEventListener("pointerup", onUp)
              }
              handle.addEventListener("pointermove", onMove)
              handle.addEventListener("pointerup", onUp)
            }}
            onPointerEnter={(e) => {
              if (!isResizing) {
                const line = e.currentTarget.firstElementChild as HTMLElement
                if (line) line.style.background = T.border
              }
            }}
            onPointerLeave={(e) => {
              if (!isResizing) {
                const line = e.currentTarget.firstElementChild as HTMLElement
                if (line) line.style.background = ""
              }
            }}
          >
            {/* Thin visible line in the center of the hit area */}
            <div style={{
              position: "absolute", left: 3, top: 0, bottom: 0, width: 1,
              transition: "background 0.15s ease",
            }} />
          </div>
        </div>

        <div data-guide="properties" style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 280,
          padding: "0 8px 8px 8px",
          transform: showPanels ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.2s ease",
          zIndex: 10,
        }}>
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
      {showImportModal && (
        <ImportJSXModal
          onImport={handleImportJSX}
          onClose={() => { setShowImportModal(false); setImportWarnings([]) }}
          warnings={importWarnings}
        />
      )}
      {(editorMode !== "interact" || canvasMode === 'canvas') && <LayoutGuide />}
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
