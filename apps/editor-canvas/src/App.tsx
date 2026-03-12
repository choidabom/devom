import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"
import { ElementRenderer } from "./components/ElementRenderer"
import { SelectionOverlay } from "./components/SelectionOverlay"
import { SnapGuides } from "./components/SnapGuides"
import { InsertionIndicator } from "./components/InsertionIndicator"

import type { SnapLine } from "./utils/snap"

const SHELL_ORIGIN = import.meta.env.VITE_SHELL_ORIGIN || (import.meta.env.DEV ? "http://localhost:4000" : window.location.origin)

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
  const selectedIdsRef = useRef<string[]>([])
  selectedIdsRef.current = selectedIds
  const [isDragging, setIsDragging] = useState(false)
  const [snapLines, setSnapLines] = useState<SnapLine[]>([])
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const marqueeRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null)
  const [editorMode, setEditorMode] = useState<"edit" | "interact">("edit")
  const [canvasMode, setCanvasMode] = useState<"canvas" | "page">("canvas")
  const [pageViewport, setPageViewport] = useState(1280)
  const [insertionIndicator, setInsertionIndicator] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [dropHighlightId, setDropHighlightId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Viewport: zoom & pan
  const [viewport, setViewport] = useState({ zoom: 1, panX: 0, panY: 0 })
  const savedViewportRef = useRef<{ zoom: number; panX: number; panY: number } | null>(null)
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const outerRef = useRef<HTMLDivElement>(null)
  const initialCenterDoneRef = useRef(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const spaceHeldRef = useRef(false)
  const panDragRef = useRef<{ x: number; y: number } | null>(null)

  // Close context menu on Escape
  useEffect(() => {
    if (!contextMenu) return
    const onKey = (e: KeyboardEvent) => { if (e.code === "Escape") setContextMenu(null) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [contextMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (editorMode !== "edit") return
    e.preventDefault()

    // Right-click on an element should select it if not already selected
    // But if any ancestor is already selected, keep that selection
    const target = e.target as HTMLElement
    const elDom = target.closest("[data-element-id]") as HTMLElement | null
    if (elDom) {
      const id = elDom.getAttribute("data-element-id")!
      const el = documentStore.getElement(id)
      if (el && el.parentId !== null) {
        // Check if this element or any ancestor is already in the selection
        let ancestorSelected = false
        let checkId: string | null = id
        while (checkId) {
          if (selectedIdsRef.current.includes(checkId)) { ancestorSelected = true; break }
          const checkEl = documentStore.getElement(checkId)
          checkId = checkEl?.parentId ?? null
        }
        if (!ancestorSelected) {
          setSelectedIds([id])
          bridge.send({
            type: "ELEMENT_CLICKED",
            payload: { id, bounds: { x: 0, y: 0, width: 0, height: 0 }, shiftKey: false },
          })
        }
      }
    }

    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [editorMode])

  const sendGroupRequest = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length < 2) return
    const z = viewport.zoom
    const rootDom = document.querySelector(`[data-element-id="${documentStore.rootId}"]`)
    if (!rootDom) return
    const rootRect = rootDom.getBoundingClientRect()
    const elementBounds: Record<string, { left: number; top: number; width: number; height: number }> = {}
    for (const id of ids) {
      const dom = document.querySelector(`[data-element-id="${id}"]`)
      if (!dom) continue
      const rect = dom.getBoundingClientRect()
      elementBounds[id] = {
        left: (rect.left - rootRect.left) / z,
        top: (rect.top - rootRect.top) / z,
        width: rect.width / z,
        height: rect.height / z,
      }
    }
    bridge.send({ type: "GROUP_ELEMENTS_REQUEST", payload: { ids, elementBounds } })
  }, [viewport.zoom])

  const sendUngroupRequest = useCallback(() => {
    bridge.send({ type: "UNGROUP_ELEMENTS_REQUEST", payload: { ids: selectedIdsRef.current } })
  }, [])

  const handleShellMessage = useCallback((msg: EditorMessage) => {
    switch (msg.type) {
      case "SYNC_DOCUMENT":
        documentStore.loadFromSerializable(msg.payload)
        // Center elements in viewport on first canvas load (canvas mode only)
        if (!initialCenterDoneRef.current) {
          initialCenterDoneRef.current = true
          if (canvasMode !== 'canvas') { setCanvasReady(true); break }
          requestAnimationFrame(() => {
            const outer = outerRef.current
            if (!outer) { setCanvasReady(true); return }
            const root = documentStore.root
            if (!root || root.children.length === 0) { setCanvasReady(true); return }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
            for (const childId of root.children) {
              const child = documentStore.getElement(childId)
              if (!child) continue
              const x = typeof child.style.left === 'number' ? child.style.left : 0
              const y = typeof child.style.top === 'number' ? child.style.top : 0
              const w = typeof child.style.width === 'number' ? child.style.width : 200
              const h = typeof child.style.height === 'number' ? child.style.height : 100
              if (w <= 0 || h <= 0) continue
              minX = Math.min(minX, x)
              minY = Math.min(minY, y)
              maxX = Math.max(maxX, x + w)
              maxY = Math.max(maxY, y + h)
            }
            if (isFinite(minX)) {
              const contentCx = minX + (maxX - minX) / 2
              const rect = outer.getBoundingClientRect()
              setViewport({ zoom: 1, panX: rect.width / 2 - contentCx, panY: 60 - minY })
            }
            setCanvasReady(true)
          })
        }
        break
      case "DND_DROP": {
        // Convert screen-relative coords to canvas coords accounting for viewport
        const vp = viewportRef.current
        const x = (msg.payload.clientX - vp.panX) / vp.zoom
        const y = (msg.payload.clientY - vp.panY) / vp.zoom
        bridge.send({ type: "DND_CREATE_ELEMENT", payload: { elementType: msg.payload.elementType, x: Math.round(x), y: Math.round(y) } })
        break
      }
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
        if (msg.payload.mode === "interact") {
          setSelectedIds([])
          // Page mode: reset viewport for fullscreen preview
          // Canvas mode: keep current viewport (no expand)
          if (msg.payload.canvasMode !== 'canvas') {
            setViewport(prev => {
              savedViewportRef.current = prev
              return { zoom: 1, panX: 0, panY: 0 }
            })
          }
        } else {
          // Restore previous viewport (only if we saved one)
          if (savedViewportRef.current) {
            setViewport(savedViewportRef.current)
            savedViewportRef.current = null
          }
        }
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
            // Use visibleWidth from Shell (accounts for overlaid panels) or fall back to full width
            const availableWidth = msg.payload.visibleWidth ?? rect.width
            const fitZoom = Math.min(1, (availableWidth - 40) / pageViewport)
            // Center within the visible area using Shell's leftOffset
            const panelLeftOffset = msg.payload.leftOffset ?? 0
            setViewport({
              zoom: fitZoom,
              panX: panelLeftOffset + (availableWidth - pageViewport * fitZoom) / 2,
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
            const availableWidth = msg.payload.visibleWidth ?? rect.width
            const fitZoom = Math.min(1, (availableWidth - 40) / msg.payload.width)
            const panelLeftOffset = msg.payload.leftOffset ?? 0
            setViewport({
              zoom: fitZoom,
              panX: panelLeftOffset + (availableWidth - msg.payload.width * fitZoom) / 2,
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
      // Group: Cmd+G (must come BEFORE generic KEY_EVENT forwarding)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.code === "KeyG") {
        e.preventDefault()
        sendGroupRequest()
        return
      }

      // Ungroup: Cmd+Shift+G
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") {
        e.preventDefault()
        sendUngroupRequest()
        return
      }
      // Prevent browser native undo/redo/copy/paste in iframe
      if ((e.metaKey || e.ctrlKey) && ["KeyZ", "KeyC", "KeyX", "KeyV", "KeyD", "Backslash"].includes(e.code)) {
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

  // Interact mode: override root element styles for real-page preview (page mode only)
  useEffect(() => {
    if (!(editorMode === "interact" && canvasMode === 'page')) return
    const r = documentStore.root
    if (!r) return
    const rootEl = document.querySelector(`[data-element-id="${r.id}"]`) as HTMLElement | null
    if (!rootEl) return
    const rootWidth = typeof r.style.width === 'number' ? r.style.width : pageViewport
    // Keep flex layout, just expand to full viewport and remove visual chrome
    rootEl.style.setProperty('width', '100%', 'important')
    rootEl.style.setProperty('min-height', '100vh', 'important')
    rootEl.style.setProperty('overflow', 'visible', 'important')
    rootEl.style.setProperty('padding', '0', 'important')
    rootEl.style.setProperty('background', 'transparent', 'important')
    rootEl.style.setProperty('gap', '0', 'important')
    rootEl.style.setProperty('align-items', 'center', 'important')
    // Center first child (Page) with max-width
    const firstChild = rootEl.querySelector(':scope > [data-element-id]') as HTMLElement | null
    if (firstChild) {
      firstChild.style.setProperty('max-width', `${rootWidth}px`, 'important')
      firstChild.style.setProperty('align-self', 'center', 'important')
    }
    // Override cursor/select on all editor elements
    const allEls = rootEl.querySelectorAll('[data-element-id]') as NodeListOf<HTMLElement>
    for (const el of allEls) {
      el.style.setProperty('cursor', 'default', 'important')
      el.style.setProperty('user-select', 'auto', 'important')
    }
    // Cleanup: remove overrides when leaving interact mode
    return () => {
      rootEl.style.removeProperty('width')
      rootEl.style.removeProperty('min-height')
      rootEl.style.removeProperty('overflow')
      rootEl.style.removeProperty('padding')
      rootEl.style.removeProperty('background')
      rootEl.style.removeProperty('gap')
      rootEl.style.removeProperty('align-items')
      if (firstChild) {
        firstChild.style.removeProperty('max-width')
        firstChild.style.removeProperty('align-self')
      }
      for (const el of allEls) {
        el.style.removeProperty('cursor')
        el.style.removeProperty('user-select')
      }
    }
  }, [editorMode, documentStore.root?.id, documentStore.root?.style?.width, pageViewport])

  // Wheel: Cmd+wheel = zoom, plain wheel = pan (disabled in interact mode for natural scroll)
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    if (editorMode === "interact") return // allow natural scroll
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
  }, [editorMode])

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
    // Right-click: skip marquee/capture — let contextmenu handle it
    if (e.button === 2) return
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

    // Right-click: don't deselect or handle marquee
    if (e.button === 2) return

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
      style={{
        width: "100%", height: "100%",
        background: (editorMode === "interact" && canvasMode === 'page') ? "#ffffff" : "#eeeef2",
        position: "relative",
        overflow: (editorMode === "interact" && canvasMode === 'page') ? "auto" : "hidden",
        cursor: spaceHeldRef.current ? "grab" : undefined,
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onContextMenu={handleContextMenu}
    >
      {(editorMode === "interact" && canvasMode === 'page') ? (
        /* Page interact mode: no transform, natural scroll — useEffect handles root style overrides */
        <ElementRenderer elementId={root.id} selectedIds={[]} onSelect={handleSelect} onDragChange={setIsDragging} onSnapLines={setSnapLines} onInsertionIndicator={setInsertionIndicator} onDropHighlight={setDropHighlightId} documentStore={documentStore} bridge={bridge} editorMode={editorMode} zoom={1} />
      ) : (
        <>
        {/* Viewport transform wrapper (canvas space) */}
        <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', opacity: canvasReady ? 1 : 0 }}>
          <ElementRenderer elementId={root.id} selectedIds={selectedIds} onSelect={handleSelect} onDragChange={setIsDragging} onSnapLines={setSnapLines} onInsertionIndicator={setInsertionIndicator} onDropHighlight={setDropHighlightId} documentStore={documentStore} bridge={bridge} editorMode={editorMode} zoom={zoom} />
          {!isDragging && selectedIds.map(id => (
            <SelectionOverlay key={id} elementId={id} documentStore={documentStore} bridge={bridge} zoom={zoom} />
          ))}
          <SnapGuides lines={snapLines} />
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
        </>
      )}

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

      {/* Viewport preset bar (Page Mode only, hidden in interact mode) */}
      {canvasMode === 'page' && editorMode !== 'interact' && (
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
            { label: 'Desktop', width: 1280, tooltip: '' },
            { label: 'Tablet', width: 768, tooltip: '반응형 미리보기 — 준비 중' },
            { label: 'Mobile', width: 375, tooltip: '반응형 미리보기 — 준비 중' },
          ] as const).map(p => (
            <button
              key={p.width}
              title={p.tooltip}
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

      {/* Context menu */}
      {contextMenu && (() => {
        const ids = selectedIds
        const hasSelection = ids.length > 0
        const canGroup = ids.length >= 2
        const canUngroup = ids.some(id => {
          const el = documentStore.getElement(id)
          return el && el.children.length > 0 && el.parentId !== null
        })

        type MenuItem = { label: string; shortcut?: string; onClick: () => void; disabled?: boolean } | "separator"
        const items: MenuItem[] = []

        if (canGroup) items.push({ label: "Group", shortcut: "⌘G", onClick: sendGroupRequest })
        if (canUngroup) items.push({ label: "Ungroup", shortcut: "⇧⌘G", onClick: sendUngroupRequest })
        if (items.length > 0) items.push("separator")

        if (hasSelection) {
          items.push({ label: "Cut", shortcut: "⌘X", onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "x", code: "KeyX", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }) })
          items.push({ label: "Copy", shortcut: "⌘C", onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "c", code: "KeyC", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }) })
          items.push({ label: "Duplicate", shortcut: "⌘D", onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "d", code: "KeyD", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }) })
          items.push("separator")
          items.push({ label: "Delete", shortcut: "⌫", onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "Backspace", code: "Backspace", metaKey: false, ctrlKey: false, shiftKey: false, altKey: false } }) })
        }
        items.push({ label: "Paste", shortcut: "⌘V", onClick: () => bridge.send({ type: "KEY_EVENT", payload: { key: "v", code: "KeyV", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } }) })

        if (items.length === 0) return null

        return (
          <>
          {/* Invisible backdrop to close menu on outside click */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
            onPointerDown={(e) => { e.stopPropagation(); setContextMenu(null) }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu(null) }}
          />
          <div
            ref={contextMenuRef}
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: contextMenu.x, top: contextMenu.y, zIndex: 10000,
              background: "#fff", borderRadius: 8, padding: 4,
              boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
              minWidth: 180, fontSize: 12, userSelect: "none",
            }}
          >
            {items.map((item, i) =>
              item === "separator" ? (
                <div key={`sep-${i}`} style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />
              ) : (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); setContextMenu(null) }}
                  disabled={item.disabled}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "6px 10px", border: "none", background: "none",
                    cursor: item.disabled ? "default" : "pointer", borderRadius: 4,
                    color: item.disabled ? "#9ca3af" : "#1f2937", fontSize: 12,
                  }}
                  onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = "#f3f4f6" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none" }}
                >
                  <span>{item.label}</span>
                  {item.shortcut && <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 24 }}>{item.shortcut}</span>}
                </button>
              )
            )}
          </div>
          </>
        )
      })()}

      {/* Zoom indicator — hidden in interact mode */}
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{
        position: "absolute", bottom: 12, right: 12,
        display: (editorMode === "interact" && canvasMode === 'page') ? "none" : "flex", alignItems: "center", gap: 4,
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
