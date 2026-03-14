import React, { useEffect, useRef, useMemo } from "react"
import { observer } from "mobx-react-lite"
import type { DocumentStore, SectionRole, FormFieldConfig } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"
import { getContainerStyles, getChildSizingStyles, getSectionStyles, getSectionContentStyles } from "@devom/editor-core"
import { calcSnap, type SnapLine, type Bounds } from "../utils/snap"
import { findDropTarget, calcInsertionIndicator } from "../utils/autoLayoutDrag"
import { SectionInsertButton } from "./SectionInsertButton"
import { getElementContent } from "./componentRegistry"
import { useFormRuntime } from "../hooks/useFormRuntime"
import { FormRuntimeContext, useFormRuntimeContext } from "../contexts/FormRuntimeContext"

interface ElementRendererProps {
  elementId: string
  selectedIds: string[]
  onSelect: (id: string, shiftKey: boolean) => void
  onDragChange?: (dragging: boolean) => void
  onSnapLines?: (lines: SnapLine[]) => void
  onInsertionIndicator?: (indicator: { x: number; y: number; width: number; height: number } | null) => void
  onDropHighlight?: (containerId: string | null) => void
  documentStore: DocumentStore
  bridge: MessageBridge
  editorMode: "edit" | "interact"
  zoom?: number
}

export const ElementRenderer = observer(function ElementRenderer({
  elementId,
  selectedIds,
  onSelect,
  onDragChange,
  onSnapLines,
  onInsertionIndicator,
  onDropHighlight,
  documentStore,
  bridge,
  editorMode,
  zoom = 1,
}: ElementRendererProps) {
  const element = documentStore.getElement(elementId)
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.()
    }
  }, [])

  if (!element || !element.visible) return null

  const isSelected = selectedIds.includes(elementId)
  const isRoot = element.parentId === null

  // Auto Layout styles
  const containerStyles = getContainerStyles(element)
  const parent = element.parentId ? documentStore.getElement(element.parentId) : undefined
  const inAutoLayout = (parent?.layoutMode === "flex" || parent?.layoutMode === "grid") && !!parent?.layoutProps
  const childSizingStyles = inAutoLayout ? getChildSizingStyles(element, parent!.layoutProps.direction, parent!.layoutProps.flexWrap) : {}

  // Section styles
  const sectionStyles = getSectionStyles(element)
  const contentStyles = getSectionContentStyles(element)
  const hasContentWrapper = element.sectionProps?.maxWidth != null

  const handleClick = (e: React.MouseEvent) => {
    if (editorMode === "interact") return
    e.stopPropagation()
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
    if (e.button === 2) return // Right-click: skip drag, let contextmenu handle
    if (editorMode === "interact") return
    if (element.locked || isRoot) {
      e.stopPropagation()
      return
    }
    if (inAutoLayout) return // Auto-layout drag handled separately
    if (element.style.position !== "absolute") return
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY

    // Block entire group drag if any selected element is locked
    const dragIds = selectedIds.includes(elementId) ? selectedIds : [elementId]
    const hasLockedInGroup = dragIds.some((id) => {
      const el = documentStore.getElement(id)
      return el?.locked
    })
    if (hasLockedInGroup) {
      target.releasePointerCapture(e.pointerId)
      return
    }

    // Collect all dragged elements (selected group or just this one)
    const dragTargets = dragIds
      .map((id) => {
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

    // Collect other elements' bounds for snap calculation (canvas space)
    const z = zoom
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
        left: (elRect.left - parentRect.left) / z,
        top: (elRect.top - parentRect.top) / z,
        width: elRect.width / z,
        height: elRect.height / z,
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
      const dx = (me.clientX - startX) / z
      const dy = (me.clientY - startY) / z

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

      // Check for auto-layout drop target
      const dropTarget = findDropTarget(me.clientX, me.clientY, dragIds, documentStore)
      if (dropTarget) {
        onDropHighlight?.(dropTarget.containerId)
        const container = documentStore.getElement(dropTarget.containerId)
        if (container) {
          const indicator = calcInsertionIndicator(dropTarget.containerId, dropTarget.insertIndex, container.layoutProps.direction, dragIds, documentStore)
          onInsertionIndicator?.(indicator)
        }
        onSnapLines?.([]) // Disable snap when over a container
      } else {
        onDropHighlight?.(null)
        onInsertionIndicator?.(null)
        onSnapLines?.(snap.lines)
      }
    }

    const onUp = (me: PointerEvent) => {
      cleanup()
      clearTransforms()

      // Check if dropping into auto-layout container
      const dropTarget = findDropTarget(me.clientX, me.clientY, dragIds, documentStore)
      if (dropTarget) {
        for (const t of dragTargets) {
          bridge.send({
            type: "REPARENT_ELEMENT",
            payload: {
              id: t.id,
              oldParentId: documentStore.getElement(t.id)?.parentId ?? documentStore.rootId,
              newParentId: dropTarget.containerId,
              index: dropTarget.insertIndex,
            },
          })
        }
        onInsertionIndicator?.(null)
        onDropHighlight?.(null)
        return // Skip the normal absolute move logic
      }

      const dx = (me.clientX - startX) / z + lastSnapDx
      const dy = (me.clientY - startY) / z + lastSnapDy
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
      onInsertionIndicator?.(null)
      onDropHighlight?.(null)
    }

    dragCleanupRef.current = cleanup
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
    target.addEventListener("pointercancel", onCancel)
  }

  const handleInsertSection = (role: SectionRole, index: number) => {
    bridge.send({ type: "INSERT_SECTION_REQUEST", payload: { preset: role, index } })
  }

  // Determine if this is a form in interact mode
  const isFormInteract = element.type === "form" && editorMode === "interact"

  // Collect form fields for form elements
  const formFields = useMemo(() => {
    if (!isFormInteract) return []
    const fields: Array<{ elementId: string; formField: FormFieldConfig }> = []
    const traverse = (id: string) => {
      const el = documentStore.getElement(id)
      if (!el) return
      if (el.formField) fields.push({ elementId: el.id, formField: el.formField })
      el.children.forEach(traverse)
    }
    element.children.forEach((cid) => traverse(cid))
    return fields
  }, [isFormInteract, element.children, documentStore])

  // Form runtime hook
  const formRuntime = useFormRuntime(formFields, isFormInteract)

  // Find the root-level ancestor (direct child of root) for this element
  const findRootAncestor = (): { id: string; el: typeof element; dom: HTMLElement } | null => {
    let cur = element
    while (cur) {
      if (cur.parentId === documentStore.rootId) {
        const dom = document.querySelector(`[data-element-id="${cur.id}"]`) as HTMLElement | null
        return dom ? { id: cur.id, el: cur, dom } : null
      }
      if (!cur.parentId) return null
      const p = documentStore.getElement(cur.parentId)
      if (!p) return null
      cur = p
    }
    return null
  }

  const handleAutoLayoutPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) return // Right-click: skip drag, let contextmenu handle
    if (editorMode === "interact") return
    if (element.locked || isRoot) {
      e.stopPropagation()
      return
    }
    if (!inAutoLayout || !parent) return
    e.stopPropagation()
    e.preventDefault()

    // Page mode: if the root-level ancestor is absolute-positioned, move it instead of reordering
    // Canvas mode: always allow individual element reorder within container
    const rootAncestor = documentStore.canvasMode === "page" ? findRootAncestor() : null
    const z = zoom
    if (rootAncestor && rootAncestor.el.style.position === "absolute") {
      const target = e.currentTarget as HTMLElement
      const containerDom = rootAncestor.dom
      target.setPointerCapture(e.pointerId)
      const startX = e.clientX
      const startY = e.clientY
      let hasMoved = false
      onDragChange?.(true)

      const cleanup = () => {
        try {
          target.releasePointerCapture(e.pointerId)
        } catch {
          /* */
        }
        target.removeEventListener("pointermove", onMove)
        target.removeEventListener("pointerup", onUp)
        target.removeEventListener("pointercancel", onCancel)
        dragCleanupRef.current = null
        onDragChange?.(false)
        containerDom.style.transform = ""
      }
      const onMove = (me: PointerEvent) => {
        const dx = me.clientX - startX
        const dy = me.clientY - startY
        if (!hasMoved && Math.abs(dx) + Math.abs(dy) < 3) return
        hasMoved = true
        containerDom.style.transform = `translate(${dx / z}px, ${dy / z}px)`
      }
      const onUp = (me: PointerEvent) => {
        if (!hasMoved) {
          cleanup()
          return
        }
        const dx = (me.clientX - startX) / z
        const dy = (me.clientY - startY) / z
        const curLeft = typeof rootAncestor.el.style.left === "number" ? rootAncestor.el.style.left : 0
        const curTop = typeof rootAncestor.el.style.top === "number" ? rootAncestor.el.style.top : 0
        const newX = Math.round(curLeft + dx)
        const newY = Math.round(curTop + dy)
        documentStore.updateStyle(rootAncestor.id, { left: newX, top: newY })
        cleanup()
        bridge.send({
          type: "ELEMENT_MOVED",
          payload: { id: rootAncestor.id, x: newX, y: newY },
        })
      }
      const onCancel = () => {
        cleanup()
      }
      dragCleanupRef.current = cleanup
      target.addEventListener("pointermove", onMove)
      target.addEventListener("pointerup", onUp)
      target.addEventListener("pointercancel", onCancel)
      return
    }

    // Normal auto-layout reorder drag (only within same container)
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    let hasMoved = false

    onDragChange?.(true)

    const cleanup = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
      target.removeEventListener("pointercancel", onCancel)
      dragCleanupRef.current = null
      onDragChange?.(false)
      onInsertionIndicator?.(null)
      onDropHighlight?.(null)
      target.style.transform = ""
      target.style.opacity = ""
      target.style.zIndex = ""
    }

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX
      const dy = me.clientY - startY

      if (!hasMoved && Math.abs(dx) + Math.abs(dy) < 3) return
      hasMoved = true

      target.style.transform = `translate(${dx / z}px, ${dy / z}px)`
      target.style.opacity = "0.7"
      target.style.zIndex = "1000"

      const dropTarget = findDropTarget(me.clientX, me.clientY, [elementId], documentStore)

      // Only show indicators for same-container reorder
      if (dropTarget && dropTarget.containerId === element.parentId) {
        onDropHighlight?.(dropTarget.containerId)
        const container = documentStore.getElement(dropTarget.containerId)
        if (container) {
          const indicator = calcInsertionIndicator(dropTarget.containerId, dropTarget.insertIndex, container.layoutProps.direction, [elementId], documentStore)
          onInsertionIndicator?.(indicator)
        }
      } else {
        onDropHighlight?.(null)
        onInsertionIndicator?.(null)
      }
    }

    const onUp = (me: PointerEvent) => {
      cleanup()

      if (!hasMoved) return

      const dropTarget = findDropTarget(me.clientX, me.clientY, [elementId], documentStore)

      // Only allow reorder within the same container — no reparenting
      if (dropTarget && dropTarget.containerId === element.parentId) {
        bridge.send({
          type: "REORDER_CHILD",
          payload: { parentId: dropTarget.containerId, childId: elementId, newIndex: dropTarget.insertIndex },
        })
      }
    }

    const onCancel = () => {
      cleanup()
    }

    dragCleanupRef.current = cleanup
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
    target.addEventListener("pointercancel", onCancel)
  }

  // Get form context for form fields
  const formCtx = useFormRuntimeContext()
  const fieldFormContext =
    formCtx && element.formField
      ? {
          value: formCtx.values[element.formField.name],
          error: formCtx.errors[element.formField.name] ?? null,
          onChange: (v: unknown) => formCtx.setValue(element.formField!.name, v),
        }
      : undefined

  const content = getElementContent(element.type, element.props, editorMode, fieldFormContext)

  // Render error message for form fields
  const errorMessage =
    editorMode === "interact" && element.formField && fieldFormContext?.error ? (
      <p style={{ color: "hsl(0 84% 60%)", fontSize: 12, marginTop: 4, padding: "0 2px" }}>{fieldFormContext.error}</p>
    ) : null

  // Determine wrapper tag: form elements use <form> in interact mode
  const WrapperTag = isFormInteract ? "form" : "div"

  // Form submit handler
  const handleFormSubmit = isFormInteract ? formRuntime.handleSubmit : undefined

  // Render children JSX
  const renderChildren = () => {
    if (hasContentWrapper) {
      return (
        <div style={contentStyles}>
          {element.children.map((childId) => (
            <ElementRenderer
              key={childId}
              elementId={childId}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onDragChange={onDragChange}
              onSnapLines={onSnapLines}
              onInsertionIndicator={onInsertionIndicator}
              onDropHighlight={onDropHighlight}
              documentStore={documentStore}
              bridge={bridge}
              editorMode={editorMode}
              zoom={zoom}
            />
          ))}
        </div>
      )
    }
    if (isRoot && documentStore.canvasMode === "page" && editorMode === "edit") {
      return (
        <>
          <SectionInsertButton index={0} onInsert={handleInsertSection} />
          {element.children.map((childId, i) => (
            <React.Fragment key={childId}>
              <ElementRenderer
                elementId={childId}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onDragChange={onDragChange}
                onSnapLines={onSnapLines}
                onInsertionIndicator={onInsertionIndicator}
                onDropHighlight={onDropHighlight}
                documentStore={documentStore}
                bridge={bridge}
                editorMode={editorMode}
                zoom={zoom}
              />
              <SectionInsertButton index={i + 1} onInsert={handleInsertSection} />
            </React.Fragment>
          ))}
        </>
      )
    }
    return element.children.map((childId) => (
      <ElementRenderer
        key={childId}
        elementId={childId}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onDragChange={onDragChange}
        onSnapLines={onSnapLines}
        onInsertionIndicator={onInsertionIndicator}
        onDropHighlight={onDropHighlight}
        documentStore={documentStore}
        bridge={bridge}
        editorMode={editorMode}
        zoom={zoom}
      />
    ))
  }

  // Wrap children with FormRuntimeContext for form elements in interact mode
  const childrenContent = isFormInteract ? (
    <FormRuntimeContext.Provider
      value={{
        values: formRuntime.values,
        errors: formRuntime.errors,
        setValue: formRuntime.setValue,
      }}
    >
      {renderChildren()}
    </FormRuntimeContext.Provider>
  ) : (
    renderChildren()
  )

  return (
    <WrapperTag
      data-element-id={element.id}
      style={{
        ...element.style,
        ...(inAutoLayout ? { position: "relative" as const, left: undefined, top: undefined } : {}),
        ...containerStyles,
        ...sectionStyles,
        ...childSizingStyles,
        ...(isRoot && documentStore.canvasMode === "page" && editorMode !== "interact"
          ? {
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              borderRadius: 2,
            }
          : {}),
        // Interact mode: convert fixed widths to max-width for responsiveness
        ...(editorMode === "interact" && inAutoLayout && typeof element.style.width === "number" && childSizingStyles.flex === undefined
          ? {
              maxWidth: element.style.width,
              width: "100%",
              overflowX: "auto" as const,
            }
          : {}),
        outline: editorMode === "edit" && isSelected ? "1.5px dashed #6366f1" : undefined,
        outlineOffset: editorMode === "edit" && isSelected ? 2 : undefined,
        cursor: editorMode === "interact" ? undefined : element.locked || isRoot ? "default" : inAutoLayout ? "grab" : "move",
        userSelect: editorMode === "interact" ? undefined : "none",
      }}
      onClick={handleClick}
      onPointerDown={inAutoLayout ? handleAutoLayoutPointerDown : handlePointerDown}
      onSubmit={handleFormSubmit}
    >
      {content}
      {errorMessage}
      {childrenContent}
    </WrapperTag>
  )
})
