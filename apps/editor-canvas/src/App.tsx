import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"
import { ElementRenderer } from "./components/ElementRenderer"
import { SelectionOverlay } from "./components/SelectionOverlay"
import { SnapGuides } from "./components/SnapGuides"
import { InsertionIndicator } from "./components/InsertionIndicator"
import { ContextMenu } from "./components/ContextMenu"
import { ViewportBar } from "./components/ViewportBar"
import { useCanvasViewport } from "./hooks/useCanvasViewport"
import { useCanvasMessages } from "./hooks/useCanvasMessages"

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

  const outerRef = useRef<HTMLDivElement>(null)
  const initialCenterDoneRef = useRef(false)
  const savedViewportRef = useRef<{ zoom: number; panX: number; panY: number } | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)

  const { viewport, setViewport, viewportRef, spaceHeldRef, panDragRef } = useCanvasViewport(outerRef, editorMode)

  const { handleShellMessage } = useCanvasMessages({
    documentStore,
    bridge,
    canvasMode,
    pageViewport,
    outerRef,
    viewportRef,
    initialCenterDoneRef,
    savedViewportRef,
    setSelectedIds,
    setEditorMode,
    setCanvasMode,
    setPageViewport,
    setViewport,
    setCanvasReady,
  })

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

    const target = e.target as HTMLElement
    const elDom = target.closest("[data-element-id]") as HTMLElement | null
    if (elDom) {
      const id = elDom.getAttribute("data-element-id")!
      const el = documentStore.getElement(id)
      if (el && el.parentId !== null) {
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

  // Notify Shell whenever zoom changes
  useEffect(() => {
    bridge.send({ type: "ZOOM_CHANGED", payload: { zoom: viewport.zoom } })
  }, [viewport.zoom])

  // Bridge setup + keyboard
  useEffect(() => {
    bridge.setTarget(window.parent)
    const dispose = bridge.onMessage(handleShellMessage)
    bridge.send({ type: "CANVAS_READY" })

    const onKeyDown = (e: KeyboardEvent) => {
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
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        spaceHeldRef.current = true
        return
      }
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
            const newZoom = Math.min(5, Math.max(0.1, prev.zoom * factor))
            const scale = newZoom / prev.zoom
            return { zoom: newZoom, panX: cx - (cx - prev.panX) * scale, panY: cy - (cy - prev.panY) * scale }
          })
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.code === "KeyG") {
        e.preventDefault()
        sendGroupRequest()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") {
        e.preventDefault()
        sendUngroupRequest()
        return
      }
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
    rootEl.style.setProperty('width', '100%', 'important')
    rootEl.style.setProperty('min-height', '100vh', 'important')
    rootEl.style.setProperty('overflow', 'visible', 'important')
    rootEl.style.setProperty('padding', '0', 'important')
    rootEl.style.setProperty('background', 'transparent', 'important')
    rootEl.style.setProperty('gap', '0', 'important')
    rootEl.style.setProperty('align-items', 'center', 'important')
    const firstChild = rootEl.querySelector(':scope > [data-element-id]') as HTMLElement | null
    if (firstChild) {
      firstChild.style.setProperty('max-width', `${rootWidth}px`, 'important')
      firstChild.style.setProperty('align-self', 'center', 'important')
    }
    const allEls = rootEl.querySelectorAll('[data-element-id]') as NodeListOf<HTMLElement>
    for (const el of allEls) {
      el.style.setProperty('cursor', 'default', 'important')
      el.style.setProperty('user-select', 'auto', 'important')
    }
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
    if (e.button === 2) return
    if (spaceHeldRef.current) {
      target.setPointerCapture(e.pointerId)
      panDragRef.current = { x: e.clientX, y: e.clientY }
      return
    }
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

    if (e.button === 2) return

    if (panDragRef.current) {
      panDragRef.current = null
      return
    }

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
        <ElementRenderer elementId={root.id} selectedIds={[]} onSelect={handleSelect} onDragChange={setIsDragging} onSnapLines={setSnapLines} onInsertionIndicator={setInsertionIndicator} onDropHighlight={setDropHighlightId} documentStore={documentStore} bridge={bridge} editorMode={editorMode} zoom={1} />
      ) : (
        <>
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
        <ViewportBar pageViewport={pageViewport} bridge={bridge} />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedIds={selectedIds}
          documentStore={documentStore}
          bridge={bridge}
          onClose={() => setContextMenu(null)}
          onGroup={sendGroupRequest}
          onUngroup={sendUngroupRequest}
        />
      )}
    </div>
  )
})
