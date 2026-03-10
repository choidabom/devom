import { useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"

interface ElementRendererProps {
  elementId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  documentStore: DocumentStore
  bridge: MessageBridge
}

export const ElementRenderer = observer(function ElementRenderer({ elementId, selectedId, onSelect, documentStore, bridge }: ElementRendererProps) {
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
        <ElementRenderer key={childId} elementId={childId} selectedId={selectedId} onSelect={onSelect} documentStore={documentStore} bridge={bridge} />
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
    case "sc:button":
      return (
        <Button
          variant={(props.variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link") ?? "default"}
          size={(props.size as "default" | "sm" | "lg" | "icon") ?? "default"}
        >
          {String(props.label ?? "Button")}
        </Button>
      )
    case "sc:card":
      return (
        <Card>
          <CardHeader>
            <CardTitle>{String(props.title ?? "Card Title")}</CardTitle>
            <CardDescription>{String(props.description ?? "")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{String(props.content ?? "")}</p>
          </CardContent>
        </Card>
      )
    case "sc:input":
      return (
        <Input
          placeholder={String(props.placeholder ?? "")}
          type={String(props.type ?? "text")}
          readOnly
        />
      )
    case "sc:badge":
      return (
        <Badge variant={(props.variant as "default" | "secondary" | "destructive" | "outline") ?? "default"}>
          {String(props.label ?? "Badge")}
        </Badge>
      )
    default:
      return null
  }
}
