import { useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"

interface ElementRendererProps {
  elementId: string
  selectedIds: string[]
  onSelect: (id: string, shiftKey: boolean) => void
  onDragChange?: (dragging: boolean) => void
  documentStore: DocumentStore
  bridge: MessageBridge
}

export const ElementRenderer = observer(function ElementRenderer({ elementId, selectedIds, onSelect, onDragChange, documentStore, bridge }: ElementRendererProps) {
  const element = documentStore.getElement(elementId)
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => { dragCleanupRef.current?.() }
  }, [])

  if (!element || !element.visible) return null

  const isSelected = selectedIds.includes(elementId)
  const isRoot = element.parentId === null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (element.locked) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onSelect(element.id, e.shiftKey)
    bridge.send({
      type: "ELEMENT_CLICKED",
      payload: {
        id: element.id,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        shiftKey: e.shiftKey,
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

    // Collect all dragged elements (selected group or just this one)
    const dragIds = selectedIds.includes(elementId) ? selectedIds : [elementId]
    const dragTargets = dragIds
      .map(id => {
        const el = documentStore.getElement(id)
        if (!el || el.locked || el.parentId === null || el.style.position !== "absolute") return null
        const dom = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement | null
        return {
          id,
          dom,
          startLeft: typeof el.style.left === "number" ? el.style.left : 0,
          startTop: typeof el.style.top === "number" ? el.style.top : 0,
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null && t.dom !== null)

    onDragChange?.(true)

    const clearTransforms = () => {
      for (const t of dragTargets) {
        t.dom!.style.transform = ""
        t.dom!.style.willChange = ""
      }
    }

    const cleanup = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
      target.removeEventListener("pointercancel", onCancel)
      dragCleanupRef.current = null
      onDragChange?.(false)
    }

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      for (const t of dragTargets) {
        t.dom!.style.transform = `translate(${dx}px, ${dy}px)`
        t.dom!.style.willChange = "transform"
      }
    }

    const onUp = (me: PointerEvent) => {
      cleanup()
      clearTransforms()
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      const moves: Array<{ id: string; x: number; y: number }> = []

      for (const t of dragTargets) {
        const finalLeft = Math.round(t.startLeft + dx)
        const finalTop = Math.round(t.startTop + dy)
        documentStore.updateStyle(t.id, { left: finalLeft, top: finalTop })
        moves.push({ id: t.id, x: finalLeft, y: finalTop })
      }

      if (moves.length === 1) {
        bridge.send({ type: "ELEMENT_MOVED", payload: moves[0] })
      } else {
        bridge.send({ type: "ELEMENTS_MOVED", payload: { moves } })
      }
    }

    const onCancel = () => {
      cleanup()
      clearTransforms()
    }

    dragCleanupRef.current = cleanup
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
    target.addEventListener("pointercancel", onCancel)
  }

  const content = getElementContent(element.type, element.props)

  return (
    <div
      data-element-id={element.id}
      style={{
        ...element.style,
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
        <ElementRenderer key={childId} elementId={childId} selectedIds={selectedIds} onSelect={onSelect} onDragChange={onDragChange} documentStore={documentStore} bridge={bridge} />
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
