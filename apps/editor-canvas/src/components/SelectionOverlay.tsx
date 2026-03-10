import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { Lock } from "lucide-react"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"
import { isAutoLayoutChild } from "@devom/editor-core"

interface SelectionOverlayProps {
  elementId: string
  documentStore: DocumentStore
  bridge: MessageBridge
}

export const SelectionOverlay = observer(function SelectionOverlay({ elementId, documentStore, bridge }: SelectionOverlayProps) {
  const element = documentStore.getElement(elementId)
  const inAutoLayout = element ? isAutoLayoutChild(element, (id) => documentStore.getElement(id)) : false
  const resizeCleanupRef = useRef<(() => void) | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useEffect(() => {
    return () => { resizeCleanupRef.current?.() }
  }, [])

  // Subscribe to MobX style changes so we re-measure when style updates
  const _l = element?.style.left
  const _t = element?.style.top
  const _w = element?.style.width
  const _h = element?.style.height

  // Measure actual DOM element bounds after render
  useLayoutEffect(() => {
    const targetEl = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement | null
    const parent = overlayRef.current?.parentElement
    if (!targetEl || !parent) return

    const parentRect = parent.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()

    setBounds({
      left: targetRect.left - parentRect.left,
      top: targetRect.top - parentRect.top,
      width: targetRect.width,
      height: targetRect.height,
    })
  }, [elementId, _l, _t, _w, _h])

  // ResizeObserver for external size changes (e.g. content-sized elements)
  useEffect(() => {
    const targetEl = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement | null
    const parent = overlayRef.current?.parentElement
    if (!targetEl || !parent) return

    const observer = new ResizeObserver(() => {
      const parentRect = parent.getBoundingClientRect()
      const targetRect = targetEl.getBoundingClientRect()
      setBounds({
        left: targetRect.left - parentRect.left,
        top: targetRect.top - parentRect.top,
        width: targetRect.width,
        height: targetRect.height,
      })
    })
    observer.observe(targetEl)
    return () => observer.disconnect()
  }, [elementId])

  if (!element || element.parentId === null || !bounds) {
    // Render invisible ref anchor so overlayRef is available for measurement
    return <div ref={overlayRef} style={{ display: "none" }} />
  }

  const { left: elLeft, top: elTop, width: elWidth, height: elHeight } = bounds

  const handles = [
    { position: "nw", cursor: "nw-resize", x: -4, y: -4 },
    { position: "n", cursor: "n-resize", x: elWidth / 2 - 4, y: -4 },
    { position: "ne", cursor: "ne-resize", x: elWidth - 4, y: -4 },
    { position: "e", cursor: "e-resize", x: elWidth - 4, y: elHeight / 2 - 4 },
    { position: "se", cursor: "se-resize", x: elWidth - 4, y: elHeight - 4 },
    { position: "s", cursor: "s-resize", x: elWidth / 2 - 4, y: elHeight - 4 },
    { position: "sw", cursor: "sw-resize", x: -4, y: elHeight - 4 },
    { position: "w", cursor: "w-resize", x: -4, y: elHeight / 2 - 4 },
  ]

  const filteredHandles = inAutoLayout && element
    ? handles.filter(h => {
        const parentEl = documentStore.getElement(element.parentId!)
        if (!parentEl) return true
        const dir = parentEl.layoutProps.direction
        // Main axis: row → w controls width (e/w handles), column → h controls height (n/s handles)
        const mainSizing = dir === 'row' ? element.sizing.w : element.sizing.h
        const crossSizing = dir === 'row' ? element.sizing.h : element.sizing.w
        const mainHandles = dir === 'row' ? ['e', 'w'] : ['n', 's']
        const crossHandles = dir === 'row' ? ['n', 's'] : ['e', 'w']
        // Hide main axis handles if fill (flex determines size)
        if (mainSizing === 'fill' && mainHandles.some(a => h.position.includes(a))) return false
        // Hide cross axis handles if fill (stretch determines size)
        if (crossSizing === 'fill' && crossHandles.some(a => h.position.includes(a))) return false
        return true
      })
    : handles

  const handlePointerDown = (e: React.PointerEvent, position: string) => {
    if (element.locked) return
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = elWidth
    const startHeight = elHeight
    const startLeft = typeof element.style.left === "number" ? element.style.left : elLeft
    const startTop = typeof element.style.top === "number" ? element.style.top : elTop

    const cleanup = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
      resizeCleanupRef.current = null
    }

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight
      let newLeft = startLeft
      let newTop = startTop

      if (position.includes("e")) newWidth = Math.max(20, startWidth + dx)
      if (position.includes("w")) {
        newWidth = Math.max(20, startWidth - dx)
        newLeft = startLeft + (startWidth - newWidth)
      }
      if (position.includes("s")) newHeight = Math.max(20, startHeight + dy)
      if (position.includes("n")) {
        newHeight = Math.max(20, startHeight - dy)
        newTop = startTop + (startHeight - newHeight)
      }

      documentStore.updateStyle(element.id, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        left: Math.round(newLeft),
        top: Math.round(newTop),
      })
    }

    const onUp = () => {
      cleanup()
      bridge.send({
        type: "ELEMENT_RESIZED",
        payload: {
          id: element.id,
          width: typeof element.style.width === "number" ? element.style.width : startWidth,
          height: typeof element.style.height === "number" ? element.style.height : startHeight,
        },
      })
    }

    resizeCleanupRef.current = cleanup
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        left: elLeft,
        top: elTop,
        width: elWidth,
        height: elHeight,
        pointerEvents: "none",
      }}
    >
      {element.locked ? (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: elWidth / 2 - 10,
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            border: "1.5px solid #94a3b8",
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          <Lock size={12} />
        </div>
      ) : (
        filteredHandles.map((handle) => (
          <div
            key={handle.position}
            onPointerDown={(e) => handlePointerDown(e, handle.position)}
            style={{
              position: "absolute",
              left: handle.x,
              top: handle.y,
              width: 8,
              height: 8,
              background: "#fff",
              border: "1.5px solid #6366f1",
              borderRadius: 2,
              cursor: handle.cursor,
              pointerEvents: "auto",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          />
        ))
      )}
    </div>
  )
})
