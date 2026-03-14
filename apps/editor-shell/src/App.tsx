import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { importJSX } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"
import { T } from "./theme"
import { Toolbar } from "./components/Toolbar"
import { LeftPanel } from "./components/LeftPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { ExportModal } from "./components/ExportModal"
import { ImportJSXModal } from "./components/ImportJSXModal"
import { LayoutGuide } from "./components/LayoutGuide"
import { GuidePanel } from "./components/GuidePanel"
import { CodePreviewPanel } from "./components/CodePreviewPanel"
import { useClipboard } from "./hooks/useClipboard"
import { useShellMessages } from "./hooks/useShellMessages"
import { useEditorKeyboard } from "./hooks/useEditorKeyboard"

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
  const [isDndActive, setIsDndActive] = useState(false)
  const [isDndOver, setIsDndOver] = useState(false)
  const [canvasZoom, setCanvasZoom] = useState(1)

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
    const leftPanelTotal = leftPanelWidthRef.current + 12
    const rightPanelTotal = RIGHT_PANEL_WIDTH + 16
    const visibleWidth = totalWidth - leftPanelTotal - rightPanelTotal
    return { visibleWidth, leftOffset: leftPanelTotal }
  }, [])

  const syncToCanvas = useCallback(() => {
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }, [])

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

  const { handleCopy, handleCut, handlePaste, handleDuplicate, handleDelete } = useClipboard(syncToCanvas)

  const { handleAddElement, handleAddSection, handleLoadTemplate, handleAddFormPreset, handleAlign, handleToggleCanvasMode, handleToggleMode } = useShellMessages({
    editorMode,
    setEditorMode,
    setCanvasMode,
    setShowPanels,
    setCanvasZoom,
    handleDelete,
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleDuplicate,
    getVisibleCanvasInfo,
  })

  useEditorKeyboard({
    editorMode,
    canvasMode,
    handleDelete,
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleDuplicate,
    setEditorMode,
    setShowPanels,
  })

  // iframe bridge setup
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

  // Track global drag state for DnD overlay
  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("application/devom-element")) setIsDndActive(true)
    }
    const onDragEnd = () => {
      setIsDndActive(false)
      setIsDndOver(false)
    }
    document.addEventListener("dragstart", onDragStart)
    document.addEventListener("dragend", onDragEnd)
    return () => {
      document.removeEventListener("dragstart", onDragStart)
      document.removeEventListener("dragend", onDragEnd)
    }
  }, [])

  const handleImportJSX = useCallback((code: string, mode: "replace" | "add") => {
    if (mode === "replace" && !confirm("Replace current document with imported JSX?")) return

    setImportWarnings([])
    const result = importJSX(code)

    if (result.warnings.length > 0 && result.elements.length === 0) {
      setImportWarnings(result.warnings)
      return
    }

    historyStore.pushSnapshot()

    if (mode === "replace") {
      documentStore.resetDocument()
    }

    documentStore.importElements(result.elements)
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })

    if (result.elements.length > 0) {
      setShowImportModal(false)
      setImportWarnings([])
    } else {
      setImportWarnings([...result.warnings, "No importable elements found in the provided code."])
    }
  }, [])

  const selectedElements = selectionStore.selectedElements
  const hasSelection = selectedElements.length > 0 && selectedElements.some((el) => !el.locked)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {editorMode === "interact" && canvasMode === "page" && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,0,0,0.7)",
            borderRadius: 20,
            padding: "6px 16px",
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Preview</span>
          <button
            onClick={handleToggleMode}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 500,
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Exit (V)
          </button>
        </div>
      )}
      {(editorMode !== "interact" || canvasMode === "canvas") && (
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
            onAddFormPreset={handleAddFormPreset}
            currentTemplateId={documentStore.currentTemplateId}
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
          {/* DnD overlay — visible during drag to intercept events over iframe */}
          {isDndActive && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                background: isDndOver ? "rgba(99, 102, 241, 0.06)" : "transparent",
                border: isDndOver ? "2px dashed rgba(99, 102, 241, 0.4)" : "2px solid transparent",
                borderRadius: isDndOver ? 8 : 0,
                transition: "background 0.15s, border 0.15s",
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                setIsDndOver(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "copy"
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setIsDndOver(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDndOver(false)
                setIsDndActive(false)
                const rawData = e.dataTransfer.getData("application/devom-element")
                if (!rawData) return

                // Parse drag data - could be plain string or JSON with metadata
                let elementType: string
                let extraProps: Record<string, unknown> | undefined
                try {
                  const parsed = JSON.parse(rawData)
                  elementType = parsed.type
                  const { type: _, ...rest } = parsed
                  extraProps = Object.keys(rest).length > 0 ? rest : undefined
                } catch {
                  // Plain string (backward compatible)
                  elementType = rawData
                }

                const rect = e.currentTarget.getBoundingClientRect()
                const clientX = e.clientX - rect.left
                const clientY = e.clientY - rect.top
                bridge.send({ type: "DND_DROP", payload: { elementType, clientX, clientY, extraProps } })
              }}
            />
          )}
        </div>

        {/* Panels — overlay on top of canvas */}
        <div
          data-guide="layers"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: leftPanelWidth,
            padding: "0 0 8px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            transform: showPanels ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.2s ease",
            zIndex: 10,
          }}
        >
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <LeftPanel />
          </div>
          {/* Resize handle — wider hit area, thin visible line */}
          <div
            style={{
              position: "absolute",
              right: -4,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: "col-resize",
              zIndex: 11,
              touchAction: "none",
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
            <div
              style={{
                position: "absolute",
                left: 3,
                top: 0,
                bottom: 0,
                width: 1,
                transition: "background 0.15s ease",
              }}
            />
          </div>
        </div>

        <div
          data-guide="properties"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 280,
            padding: "0 8px 8px 8px",
            transform: showPanels ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.2s ease",
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: T.panel,
              borderRadius: T.panelRadius,
              boxShadow: T.panelShadow,
              border: `1px solid ${T.panelBorder}`,
              height: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {editorMode === "interact" ? <CodePreviewPanel /> : selectedElements.length > 0 ? <PropertiesPanel /> : <GuidePanel />}
          </div>
        </div>

        {/* Zoom controls — bottom-right, above panels */}
        {(editorMode !== "interact" || canvasMode === "canvas") && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: showPanels ? 296 : 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: T.panel,
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 11,
              boxShadow: T.panelShadow,
              border: `1px solid ${T.panelBorder}`,
              zIndex: 10,
              userSelect: "none",
              transition: "right 0.2s ease",
            }}
          >
            <button
              onClick={() => bridge.send({ type: "ZOOM_OUT" })}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: T.textSub, padding: "0 2px", lineHeight: 1 }}
            >
              −
            </button>
            <span
              onClick={() => bridge.send({ type: "ZOOM_RESET" })}
              style={{ cursor: "pointer", minWidth: 36, textAlign: "center", fontSize: 11, fontWeight: 500, color: T.textSub }}
            >
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => bridge.send({ type: "ZOOM_IN" })}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: T.textSub, padding: "0 2px", lineHeight: 1 }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showImportModal && (
        <ImportJSXModal
          onImport={handleImportJSX}
          onClose={() => {
            setShowImportModal(false)
            setImportWarnings([])
          }}
          warnings={importWarnings}
        />
      )}
      {(editorMode !== "interact" || canvasMode === "canvas") && <LayoutGuide />}
    </div>
  )
})
