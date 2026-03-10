import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"

const SHELL_ORIGIN = import.meta.env.VITE_SHELL_ORIGIN || "http://localhost:4000"

const documentStore = new DocumentStore()
const bridge = new MessageBridge(SHELL_ORIGIN)

if (import.meta.hot) {
  import.meta.hot.dispose(() => bridge.destroy())
}

export const App = observer(function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
        setSelectedId(msg.payload.id)
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

  const handleCanvasClick = () => {
    setSelectedId(null)
    bridge.send({ type: "CANVAS_CLICKED" })
  }

  return (
    <div
      style={{ width: "100%", height: "100%", background: "#eeeef2", position: "relative" }}
      onClick={handleCanvasClick}
    >
      <ElementRenderer elementId={root.id} selectedId={selectedId} onSelect={setSelectedId} />
      {selectedId && <SelectionOverlay elementId={selectedId} />}
    </div>
  )
})

interface ElementRendererProps {
  elementId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
}

const ElementRenderer = observer(function ElementRenderer({ elementId, selectedId, onSelect }: ElementRendererProps) {
  const element = documentStore.getElement(elementId)
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    return () => { dragCleanupRef.current?.() }
  }, [])

  if (!element || !element.visible) return null

  const isSelected = selectedId === elementId
  const isRoot = element.parentId === null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (element.locked) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onSelect(element.id)
    bridge.send({
      type: "ELEMENT_CLICKED",
      payload: {
        id: element.id,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      },
    })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (element.locked || isRoot) return
    if (element.style.position !== "absolute") return
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const startLeft = typeof element.style.left === "number" ? element.style.left : 0
    const startTop = typeof element.style.top === "number" ? element.style.top : 0

    const cleanup = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
      dragCleanupRef.current = null
    }

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      setDragDelta({ x: dx, y: dy })
    }

    const onUp = (me: PointerEvent) => {
      cleanup()
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      const finalLeft = Math.round(startLeft + dx)
      const finalTop = Math.round(startTop + dy)
      setDragDelta(null)
      documentStore.updateStyle(element.id, { left: finalLeft, top: finalTop })
      bridge.send({
        type: "ELEMENT_MOVED",
        payload: { id: element.id, x: finalLeft, y: finalTop },
      })
    }

    dragCleanupRef.current = cleanup
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  const content = getElementContent(element.type, element.props)

  return (
    <div
      data-element-id={element.id}
      style={{
        ...element.style,
        transform: dragDelta ? `translate(${dragDelta.x}px, ${dragDelta.y}px)` : undefined,
        willChange: dragDelta ? "transform" : undefined,
        outline: isSelected ? "1.5px dashed #6366f1" : undefined,
        outlineOffset: isSelected ? 2 : undefined,
        cursor: element.locked || isRoot ? "default" : "move",
        userSelect: "none",
      }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      {content}
      {element.children.map((childId) => (
        <ElementRenderer key={childId} elementId={childId} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
})

function getElementContent(type: string, props: Record<string, unknown>): React.ReactNode {
  switch (type) {
    case "text":
      return String(props.content ?? "Text")
    case "button":
      return String(props.label ?? "Button")
    case "input":
      return (
        <input
          placeholder={String(props.placeholder ?? "")}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            font: "inherit",
            color: "inherit",
            padding: 0,
          }}
          readOnly
        />
      )
    case "image":
      return props.src ? (
        <img
          src={String(props.src)}
          alt={String(props.alt ?? "")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            fontSize: 14,
          }}
        >
          Image
        </div>
      )
    default:
      return null
  }
}

const SelectionOverlay = observer(function SelectionOverlay({ elementId }: { elementId: string }) {
  const element = documentStore.getElement(elementId)
  const resizeCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => { resizeCleanupRef.current?.() }
  }, [])

  if (!element || element.parentId === null) return null

  const elWidth = typeof element.style.width === "number" ? element.style.width : 100
  const elHeight = typeof element.style.height === "number" ? element.style.height : 100
  const elLeft = typeof element.style.left === "number" ? element.style.left : 0
  const elTop = typeof element.style.top === "number" ? element.style.top : 0

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

  const handlePointerDown = (e: React.PointerEvent, position: string) => {
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = elWidth
    const startHeight = elHeight
    const startLeft = elLeft
    const startTop = elTop

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
      style={{
        position: "absolute",
        left: elLeft,
        top: elTop,
        width: elWidth,
        height: elHeight,
        pointerEvents: "none",
      }}
    >
      {handles.map((handle) => (
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
      ))}
    </div>
  )
})
