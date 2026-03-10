import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"
import { ElementRenderer } from "./components/ElementRenderer"
import { SelectionOverlay } from "./components/SelectionOverlay"

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

export const App = observer(function App() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const marqueeRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null)

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
    }
  }, [])

  useEffect(() => {
    bridge.setTarget(window.parent)
    const dispose = bridge.onMessage(handleShellMessage)
    bridge.send({ type: "CANVAS_READY" })

    const onKeyDown = (e: KeyboardEvent) => {
      bridge.send({
        type: "KEY_EVENT",
        payload: { key: e.key, code: e.code, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey },
      })
    }
    window.addEventListener("keydown", onKeyDown)

    return () => { dispose(); window.removeEventListener("keydown", onKeyDown) }
  }, [handleShellMessage])

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
    target.setPointerCapture(e.pointerId)
    const rect = target.getBoundingClientRect()
    marqueeRef.current = {
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      active: false,
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
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
    target.releasePointerCapture(e.pointerId)

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
    } else if (e.target === e.currentTarget) {
      setSelectedIds([])
      bridge.send({ type: "CANVAS_CLICKED" })
    }

    setMarquee(null)
    marqueeRef.current = null
  }

  return (
    <div
      style={{ width: "100%", height: "100%", background: "#eeeef2", position: "relative" }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
    >
      <ElementRenderer elementId={root.id} selectedIds={selectedIds} onSelect={handleSelect} onDragChange={setIsDragging} documentStore={documentStore} bridge={bridge} />
      {!isDragging && selectedIds.map(id => (
        <SelectionOverlay key={id} elementId={id} documentStore={documentStore} bridge={bridge} />
      ))}
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
    </div>
  )
})
