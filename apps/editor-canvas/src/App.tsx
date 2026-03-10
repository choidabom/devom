import { useCallback, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"

const documentStore = new DocumentStore()
const bridge = new MessageBridge("http://localhost:4000")

export const App = observer(function App() {
  const initialized = useRef(false)
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
    if (initialized.current) return
    initialized.current = true

    bridge.setTarget(window.parent)
    const dispose = bridge.onMessage(handleShellMessage)
    bridge.send({ type: "CANVAS_READY" })

    return dispose
  }, [handleShellMessage])

  const root = documentStore.root
  if (!root) return null

  const handleCanvasClick = () => {
    setSelectedId(null)
    bridge.send({ type: "CANVAS_CLICKED" })
  }

  return (
    <div
      style={{ width: "100%", height: "100%", background: "#f1f5f9", position: "relative" }}
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
    const startLeft = parseInt(String(element.style.left ?? 0))
    const startTop = parseInt(String(element.style.top ?? 0))

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      documentStore.updateStyle(element.id, {
        left: startLeft + dx,
        top: startTop + dy,
      })
    }

    const onUp = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
      bridge.send({
        type: "ELEMENT_MOVED",
        payload: {
          id: element.id,
          x: parseInt(String(element.style.left ?? 0)),
          y: parseInt(String(element.style.top ?? 0)),
        },
      })
    }

    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  const content = getElementContent(element.type, element.props)

  return (
    <div
      data-element-id={element.id}
      style={{
        ...element.style,
        outline: isSelected ? "2px solid #3b82f6" : undefined,
        outlineOffset: isSelected ? -2 : undefined,
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
  if (!element || element.parentId === null) return null

  const targetElement = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement
  if (!targetElement) return null

  const rect = targetElement.getBoundingClientRect()

  const handles = [
    { position: "nw", cursor: "nw-resize", x: -3, y: -3 },
    { position: "n", cursor: "n-resize", x: rect.width / 2 - 3, y: -3 },
    { position: "ne", cursor: "ne-resize", x: rect.width - 3, y: -3 },
    { position: "e", cursor: "e-resize", x: rect.width - 3, y: rect.height / 2 - 3 },
    { position: "se", cursor: "se-resize", x: rect.width - 3, y: rect.height - 3 },
    { position: "s", cursor: "s-resize", x: rect.width / 2 - 3, y: rect.height - 3 },
    { position: "sw", cursor: "sw-resize", x: -3, y: rect.height - 3 },
    { position: "w", cursor: "w-resize", x: -3, y: rect.height / 2 - 3 },
  ]

  const handlePointerDown = (e: React.PointerEvent, position: string) => {
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = parseInt(String(element.style.width ?? rect.width))
    const startHeight = parseInt(String(element.style.height ?? rect.height))
    const startLeft = parseInt(String(element.style.left ?? 0))
    const startTop = parseInt(String(element.style.top ?? 0))

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
        width: newWidth,
        height: newHeight,
        left: newLeft,
        top: newTop,
      })
    }

    const onUp = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)

      const finalWidth = parseInt(String(element.style.width ?? rect.width))
      const finalHeight = parseInt(String(element.style.height ?? rect.height))
      bridge.send({
        type: "ELEMENT_RESIZED",
        payload: {
          id: element.id,
          width: finalWidth,
          height: finalHeight,
        },
      })
    }

    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  return (
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
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
            width: 6,
            height: 6,
            background: "#fff",
            border: "1px solid #3b82f6",
            cursor: handle.cursor,
            pointerEvents: "auto",
          }}
        />
      ))}
    </div>
  )
})
