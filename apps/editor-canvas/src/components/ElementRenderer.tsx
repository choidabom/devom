import { useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"
import { calcSnap, type SnapLine, type Bounds } from "../utils/snap"

interface ElementRendererProps {
  elementId: string
  selectedIds: string[]
  onSelect: (id: string, shiftKey: boolean) => void
  onDragChange?: (dragging: boolean) => void
  onSnapLines?: (lines: SnapLine[]) => void
  documentStore: DocumentStore
  bridge: MessageBridge
}

export const ElementRenderer = observer(function ElementRenderer({ elementId, selectedIds, onSelect, onDragChange, onSnapLines, documentStore, bridge }: ElementRendererProps) {
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

    // Block entire group drag if any selected element is locked
    const dragIds = selectedIds.includes(elementId) ? selectedIds : [elementId]
    const hasLockedInGroup = dragIds.some(id => {
      const el = documentStore.getElement(id)
      return el?.locked
    })
    if (hasLockedInGroup) {
      target.releasePointerCapture(e.pointerId)
      return
    }

    // Collect all dragged elements (selected group or just this one)
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

    // Collect other elements' bounds for snap calculation
    const otherBounds: Bounds[] = []
    const allElements = documentStore.getAllElements()
    for (const el of allElements) {
      if (dragIds.includes(el.id) || el.parentId === null || !el.visible) continue
      const dom = document.querySelector(`[data-element-id="${el.id}"]`) as HTMLElement | null
      if (!dom) continue
      const parentDom = dom.offsetParent as HTMLElement | null
      if (!parentDom) continue
      const parentRect = parentDom.getBoundingClientRect()
      const elRect = dom.getBoundingClientRect()
      otherBounds.push({
        left: elRect.left - parentRect.left,
        top: elRect.top - parentRect.top,
        width: elRect.width,
        height: elRect.height,
      })
    }

    if (dragTargets.length === 0) return

    // Primary dragged element bounds for snap reference
    const primaryTarget = dragTargets[0]!
    const primaryDom = primaryTarget.dom!

    onDragChange?.(true)
    let lastSnapDx = 0
    let lastSnapDy = 0

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
      onSnapLines?.([])
    }

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY

      // Calculate snap based on primary element's projected position
      const projectedBounds: Bounds = {
        left: primaryTarget.startLeft + dx,
        top: primaryTarget.startTop + dy,
        width: primaryDom.offsetWidth,
        height: primaryDom.offsetHeight,
      }
      const snap = calcSnap(projectedBounds, otherBounds)
      lastSnapDx = snap.dx
      lastSnapDy = snap.dy

      const snappedDx = dx + snap.dx
      const snappedDy = dy + snap.dy

      for (const t of dragTargets) {
        t.dom!.style.transform = `translate(${snappedDx}px, ${snappedDy}px)`
        t.dom!.style.willChange = "transform"
      }

      onSnapLines?.(snap.lines)
    }

    const onUp = (me: PointerEvent) => {
      cleanup()
      clearTransforms()
      const dx = me.clientX - startX + lastSnapDx
      const dy = me.clientY - startY + lastSnapDy
      const moves: Array<{ id: string; x: number; y: number }> = []

      for (const t of dragTargets) {
        const finalLeft = Math.round(t.startLeft + dx)
        const finalTop = Math.round(t.startTop + dy)
        documentStore.updateStyle(t.id, { left: finalLeft, top: finalTop })
        moves.push({ id: t.id, x: finalLeft, y: finalTop })
      }

      if (moves.length === 1) {
        bridge.send({ type: "ELEMENT_MOVED", payload: moves[0]! })
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
        <ElementRenderer key={childId} elementId={childId} selectedIds={selectedIds} onSelect={onSelect} onDragChange={onDragChange} onSnapLines={onSnapLines} documentStore={documentStore} bridge={bridge} />
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
