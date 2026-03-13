import { useCallback } from "react"
import type { DocumentStore, EditorMessage, MessageBridge } from "@devom/editor-core"

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

interface UseCanvasMessagesOptions {
  documentStore: DocumentStore
  bridge: MessageBridge
  canvasMode: "canvas" | "page"
  pageViewport: number
  outerRef: React.RefObject<HTMLDivElement | null>
  viewportRef: React.RefObject<{ zoom: number; panX: number; panY: number }>
  initialCenterDoneRef: React.RefObject<boolean>
  savedViewportRef: React.RefObject<{ zoom: number; panX: number; panY: number } | null>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setEditorMode: React.Dispatch<React.SetStateAction<"edit" | "interact">>
  setCanvasMode: React.Dispatch<React.SetStateAction<"canvas" | "page">>
  setPageViewport: React.Dispatch<React.SetStateAction<number>>
  setViewport: React.Dispatch<React.SetStateAction<{ zoom: number; panX: number; panY: number }>>
  setCanvasReady: React.Dispatch<React.SetStateAction<boolean>>
}

export function useCanvasMessages({
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
}: UseCanvasMessagesOptions) {
  const handleShellMessage = useCallback((msg: EditorMessage) => {
    switch (msg.type) {
      case "SYNC_DOCUMENT":
        documentStore.loadFromSerializable(msg.payload)
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
          if (msg.payload.canvasMode !== 'canvas') {
            setViewport(prev => {
              savedViewportRef.current = prev
              return { zoom: 1, panX: 0, panY: 0 }
            })
          }
        } else {
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
        setCanvasMode(msg.payload.mode)
        if (msg.payload.mode === 'page') {
          const el = outerRef.current
          if (el) {
            const rect = el.getBoundingClientRect()
            const availableWidth = msg.payload.visibleWidth ?? rect.width
            const fitZoom = Math.min(1, (availableWidth - 40) / pageViewport)
            const panelLeftOffset = msg.payload.leftOffset ?? 0
            setViewport({
              zoom: fitZoom,
              panX: panelLeftOffset + (availableWidth - pageViewport * fitZoom) / 2,
              panY: 20,
            })
          }
        } else {
          setViewport({ zoom: 1, panX: 0, panY: 0 })
        }
        break
      case "ZOOM_IN":
        setViewport(prev => {
          const el = outerRef.current
          if (!el) return prev
          const r = el.getBoundingClientRect()
          const cx = r.width / 2, cy = r.height / 2
          const nz = Math.min(MAX_ZOOM, prev.zoom * 1.2)
          const s = nz / prev.zoom
          return { zoom: nz, panX: cx - (cx - prev.panX) * s, panY: cy - (cy - prev.panY) * s }
        })
        break
      case "ZOOM_OUT":
        setViewport(prev => {
          const el = outerRef.current
          if (!el) return prev
          const r = el.getBoundingClientRect()
          const cx = r.width / 2, cy = r.height / 2
          const nz = Math.max(MIN_ZOOM, prev.zoom / 1.2)
          const s = nz / prev.zoom
          return { zoom: nz, panX: cx - (cx - prev.panX) * s, panY: cy - (cy - prev.panY) * s }
        })
        break
      case "ZOOM_RESET":
        setViewport({ zoom: 1, panX: 0, panY: 0 })
        break
      case "SET_PAGE_VIEWPORT":
        setPageViewport(msg.payload.width)
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
  }, [canvasMode, pageViewport])

  return { handleShellMessage }
}
