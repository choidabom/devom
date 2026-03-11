import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"
import { ElementRenderer } from "./components/ElementRenderer"
import { SelectionOverlay } from "./components/SelectionOverlay"
import { SnapGuides } from "./components/SnapGuides"
import { InsertionIndicator } from "./components/InsertionIndicator"

import type { SnapLine } from "./utils/snap"

const SHELL_ORIGIN = import.meta.env.VITE_SHELL_ORIGIN || "http://localhost:4000"

const documentStore = new DocumentStore()
const bridge = new MessageBridge(SHELL_ORIGIN)

if (import.meta.hot) {
  import.meta.hot.dispose(() => bridge.destroy())
}

function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export const App = observer(function App() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [snapLines, setSnapLines] = useState<SnapLine[]>([])
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const marqueeRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null)
  const [editorMode, setEditorMode] = useState<"edit" | "interact">("edit")
  const [canvasMode, setCanvasMode] = useState<"canvas" | "page">("canvas")
  const [pageViewport, setPageViewport] = useState(1280)
  const [insertionIndicator, setInsertionIndicator] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [dropHighlightId, setDropHighlightId] = useState<string | null>(null)

  // Viewport: zoom & pan
  const [viewport, setViewport] = useState({ zoom: 1, panX: 0, panY: 0 })
  const outerRef = useRef<HTMLDivElement>(null)
  const spaceHeldRef = useRef(false)
  const panDragRef = useRef<{ x: number; y: number } | null>(null)

  const handleShellMessage = useCallback((msg: EditorMessage) => {
    switch (msg.type) {
      case "SYNC_DOCUMENT":
        documentStore.loadFromSerializable(msg.payload)
        break
      case "ADD_ELEMENT":
        documentStore.addElementFromRemote(msg.payload)
        break
      case "DELETE_ELEMENT":
        documentStore.removeElement(msg.payload.id)
        break
      case "UPDATE_STYLE":
        documentStore.updateStyle(msg.payload.id, msg.payload.style)
        break
      case "UPDATE_PROPS":
        documentStore.updateProps(msg.payload.id, msg.payload.props)
        break
      case "SELECT_ELEMENT":
        setSelectedIds(msg.payload.ids)
        break
      case "SET_MODE":
        setEditorMode(msg.payload.mode)
        if (msg.payload.mode === "interact") setSelectedIds([])
        break
      case "SET_LAYOUT_MODE":
        documentStore.setLayoutMode(msg.payload.id, msg.payload.mode)
        break
      case "UPDATE_LAYOUT_PROPS":
        documentStore.updateLayoutProps(msg.payload.id, msg.payload.layoutProps)
        break
      case "UPDATE_SIZING":
        documentStore.updateSizing(msg.payload.id, msg.payload.sizing)
        break
      case "SET_CANVAS_MODE":
        // Don't call documentStore.setCanvasMode() — SYNC_DOCUMENT already has the transformed data
        setCanvasMode(msg.payload.mode)
        // Zoom-to-fit and center page when switching to page mode
        if (msg.payload.mode === 'page') {
          const el = outerRef.current
          if (el) {
            const rect = el.getBoundingClientRect()
            const fitZoom = Math.min(1, (rect.width - 40) / pageViewport)
            setViewport({
              zoom: fitZoom,
              panX: (rect.width - pageViewport * fitZoom) / 2,
              panY: 20,
            })
          }
        } else {
          // Reset to 100% when switching back to canvas mode
          setViewport({ zoom: 1, panX: 0, panY: 0 })
        }
        break
      case "SET_PAGE_VIEWPORT":
        // Don't call documentStore.setPageViewport() — SYNC_DOCUMENT already has the transformed data
        setPageViewport(msg.payload.width)
        // Zoom-to-fit and re-center with new width
        {
          const el = outerRef.current
          if (el) {
            const rect = el.getBoundingClientRect()
            const fitZoom = Math.min(1, (rect.width - 40) / msg.payload.width)
            setViewport({
              zoom: fitZoom,
              panX: (rect.width - msg.payload.width * fitZoom) / 2,
              panY: 20,
            })
          }
        }
        break
    }
  }, [pageViewport])

  useEffect(() => {
    bridge.setTarget(window.parent)
    const dispose = bridge.onMessage(handleShellMessage)
    bridge.send({ type: "CANVAS_READY" })

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't forward keystrokes when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          bridge.send({
            type: "KEY_EVENT",
            payload: { key: e.key, code: e.code, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey },
          })
        }
        return
      }
      // Space for pan mode
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        spaceHeldRef.current = true
        return
      }
      // Keyboard zoom: Cmd+=/- and Cmd+0
      if ((e.metaKey || e.ctrlKey) && (e.code === "Equal" || e.code === "Minus" || e.code === "Digit0")) {
        e.preventDefault()
        if (e.code === "Digit0") {
          setViewport({ zoom: 1, panX: 0, panY: 0 })
        } else {
          const factor = e.code === "Equal" ? 1.2 : 1 / 1.2
          setViewport(prev => {
            const el = outerRef.current
            if (!el) return prev
            const rect = el.getBoundingClientRect()
            const cx = rect.width / 2, cy = rect.height / 2
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor))
            const scale = newZoom / prev.zoom
            return { zoom: newZoom, panX: cx - (cx - prev.panX) * scale, panY: cy - (cy - prev.panY) * scale }
          })
        }
        return
      }
      // Prevent browser native undo/redo/copy/paste in iframe
      if ((e.metaKey || e.ctrlKey) && ["KeyZ", "KeyC", "KeyV", "KeyD"].includes(e.code)) {
        e.preventDefault()
      }
      bridge.send({
        type: "KEY_EVENT",
        payload: { key: e.key, code: e.code, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey },
      })
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = false
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => { dispose(); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp) }
  }, [handleShellMessage])

  // Wheel: Cmd+wheel = zoom, plain wheel = pan
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.metaKey || e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const factor = e.deltaY > 0 ? 0.95 : 1.05
        setViewport(prev => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor))
          const scale = newZoom / prev.zoom
          return { zoom: newZoom, panX: mx - (mx - prev.panX) * scale, panY: my - (my - prev.panY) * scale }
        })
      } else {
        setViewport(prev => ({ ...prev, panX: prev.panX - e.deltaX, panY: prev.panY - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const root = documentStore.root
  if (!root) return null

  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds(prev => {
      if (shiftKey) {
        return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      }
      return [id]
    })
  }, [])

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement
    // Space+drag → pan (works in all modes)
    if (spaceHeldRef.current) {
      target.setPointerCapture(e.pointerId)
      panDragRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    // In interact mode, don't capture pointer or start marquee — let components handle events
    if (editorMode === "interact") return
    target.setPointerCapture(e.pointerId)
    const rect = target.getBoundingClientRect()
    marqueeRef.current = {
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      active: false,
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    // Pan drag
    if (panDragRef.current) {
      const dx = e.clientX - panDragRef.current.x
      const dy = e.clientY - panDragRef.current.y
      panDragRef.current = { x: e.clientX, y: e.clientY }
      setViewport(prev => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }))
      return
    }
    if (!marqueeRef.current) return
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - marqueeRef.current.startX
    const dy = y - marqueeRef.current.startY

    if (!marqueeRef.current.active && Math.abs(dx) + Math.abs(dy) > 5) {
      marqueeRef.current.active = true
    }

    if (marqueeRef.current.active) {
      setMarquee({
        startX: marqueeRef.current.startX,
        startY: marqueeRef.current.startY,
        endX: x,
        endY: y,
      })
    }
  }

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement
    try { target.releasePointerCapture(e.pointerId) } catch { /* not captured */ }

    // End pan drag
    if (panDragRef.current) {
      panDragRef.current = null
      return
    }

    // In interact mode, don't handle marquee or canvas click
    if (editorMode === "interact") return

    if (marqueeRef.current?.active && marquee) {
      const selRect = {
        left: Math.min(marquee.startX, marquee.endX),
        top: Math.min(marquee.startY, marquee.endY),
        right: Math.max(marquee.startX, marquee.endX),
        bottom: Math.max(marquee.startY, marquee.endY),
      }
      const containerRect = target.getBoundingClientRect()
      const ids: string[] = []

      const elementDoms = target.querySelectorAll("[data-element-id]")
      for (const dom of elementDoms) {
        const id = dom.getAttribute("data-element-id")!
        const el = documentStore.getElement(id)
        if (!el || el.parentId === null) continue

        const elRect = dom.getBoundingClientRect()
        const rel = {
          left: elRect.left - containerRect.left,
          top: elRect.top - containerRect.top,
          right: elRect.right - containerRect.left,
          bottom: elRect.bottom - containerRect.top,
        }

        if (rectsIntersect(selRect, rel)) {
          ids.push(id)
        }
      }

      setSelectedIds(ids)
      bridge.send({ type: "MARQUEE_SELECT", payload: { ids } })
    } else if (!marqueeRef.current?.active) {
      setSelectedIds([])
      bridge.send({ type: "CANVAS_CLICKED" })
    }

    setMarquee(null)
    marqueeRef.current = null
  }

  const { zoom, panX, panY } = viewport

  return (
    <div
      ref={outerRef}
      style={{ width: "100%", height: "100%", background: "#eeeef2", position: "relative", overflow: "hidden", cursor: spaceHeldRef.current ? "grab" : undefined }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
    >
      {/* Viewport transform wrapper (canvas space) */}
      <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute' }}>
        <ElementRenderer elementId={root.id} selectedIds={selectedIds} onSelect={handleSelect} onDragChange={setIsDragging} onSnapLines={setSnapLines} onInsertionIndicator={setInsertionIndicator} onDropHighlight={setDropHighlightId} documentStore={documentStore} bridge={bridge} editorMode={editorMode} zoom={zoom} />
        {editorMode === "edit" && !isDragging && selectedIds.map(id => (
          <SelectionOverlay key={id} elementId={id} documentStore={documentStore} bridge={bridge} zoom={zoom} />
        ))}
        {editorMode === "edit" && <SnapGuides lines={snapLines} />}
        {dropHighlightId && (() => {
          const dom = document.querySelector(`[data-element-id="${dropHighlightId}"]`) as HTMLElement | null
          if (!dom) return null
          const parentEl = dom.offsetParent as HTMLElement | null
          if (!parentEl) return null
          const parentRect = parentEl.getBoundingClientRect()
          const domRect = dom.getBoundingClientRect()
          return (
            <div style={{
              position: 'absolute',
              left: (domRect.left - parentRect.left) / zoom,
              top: (domRect.top - parentRect.top) / zoom,
              width: domRect.width / zoom,
              height: domRect.height / zoom,
              border: '2px solid #3b82f6',
              borderRadius: 4,
              pointerEvents: 'none',
              zIndex: 9998,
            }} />
          )
        })()}
      </div>

      {/* Screen-space overlays */}
      {insertionIndicator && <InsertionIndicator {...insertionIndicator} />}
      {marquee && (
        <div style={{
          position: "absolute",
          left: Math.min(marquee.startX, marquee.endX),
          top: Math.min(marquee.startY, marquee.endY),
          width: Math.abs(marquee.endX - marquee.startX),
          height: Math.abs(marquee.endY - marquee.startY),
          border: "1.5px dashed #6366f1",
          background: "rgba(99, 102, 241, 0.08)",
          borderRadius: 2,
          pointerEvents: "none",
        }} />
      )}

      {/* Viewport preset bar (Page Mode only) */}
      {canvasMode === 'page' && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.95)', borderRadius: 8,
          padding: '4px 8px', fontSize: 11, color: '#64748b',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 100,
          userSelect: 'none', pointerEvents: 'auto',
        }}>
          {([
            { label: 'Desktop', width: 1280 },
            { label: 'Tablet', width: 768 },
            { label: 'Mobile', width: 375 },
          ] as const).map(p => (
            <button
              key={p.width}
              onClick={() => {
                bridge.send({ type: "SET_PAGE_VIEWPORT_REQUEST", payload: { width: p.width } })
              }}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 500,
                background: pageViewport === p.width ? '#6366f1' : 'transparent',
                color: pageViewport === p.width ? '#fff' : '#64748b',
                border: `1px solid ${pageViewport === p.width ? '#6366f1' : '#e2e8f0'}`,
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              {p.label} ({p.width})
            </button>
          ))}
        </div>
      )}

      {/* Zoom indicator */}
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{
        position: "absolute", bottom: 12, right: 12,
        display: "flex", alignItems: "center", gap: 4,
        background: "rgba(255,255,255,0.9)", borderRadius: 6,
        padding: "4px 8px", fontSize: 11, color: "#64748b",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)", pointerEvents: "auto",
        userSelect: "none",
      }}>
        <button onClick={() => setViewport(prev => { const nz = Math.max(MIN_ZOOM, prev.zoom / 1.2); const el = outerRef.current; if (!el) return prev; const r = el.getBoundingClientRect(); const cx = r.width/2, cy = r.height/2; const s = nz/prev.zoom; return {zoom: nz, panX: cx-(cx-prev.panX)*s, panY: cy-(cy-prev.panY)*s} })} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#64748b", padding: "0 2px" }}>−</button>
        <span onClick={() => setViewport({ zoom: 1, panX: 0, panY: 0 })} style={{ cursor: "pointer", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setViewport(prev => { const nz = Math.min(MAX_ZOOM, prev.zoom * 1.2); const el = outerRef.current; if (!el) return prev; const r = el.getBoundingClientRect(); const cx = r.width/2, cy = r.height/2; const s = nz/prev.zoom; return {zoom: nz, panX: cx-(cx-prev.panX)*s, panY: cy-(cy-prev.panY)*s} })} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#64748b", padding: "0 2px" }}>+</button>
      </div>
    </div>
  )
})
