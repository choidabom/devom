import { useEffect, useState, useRef } from "react"

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export function useCanvasViewport(outerRef: React.RefObject<HTMLDivElement | null>, editorMode: "edit" | "interact") {
  const [viewport, setViewport] = useState({ zoom: 1, panX: 0, panY: 0 })
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const spaceHeldRef = useRef(false)
  const panDragRef = useRef<{ x: number; y: number } | null>(null)

  // Wheel: Cmd+wheel = zoom, plain wheel = pan (disabled in interact mode for natural scroll)
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    if (editorMode === "interact") return
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
  }, [editorMode, outerRef])

  return { viewport, setViewport, viewportRef, spaceHeldRef, panDragRef }
}
