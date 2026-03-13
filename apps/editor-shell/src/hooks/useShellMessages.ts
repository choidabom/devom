import { useCallback, useEffect } from "react"
import type { EditorMessage, ElementType, SectionRole } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"

interface UseShellMessagesOptions {
  editorMode: "edit" | "interact"
  setEditorMode: (mode: "edit" | "interact") => void
  setCanvasMode: React.Dispatch<React.SetStateAction<"canvas" | "page">>
  setShowPanels: React.Dispatch<React.SetStateAction<boolean>>
  setCanvasZoom: (zoom: number) => void
  handleDelete: () => void
  handleUndo: () => void
  handleRedo: () => void
  handleCopy: () => void
  handleCut: () => void
  handlePaste: () => void
  handleDuplicate: () => void
  getVisibleCanvasInfo: () => { visibleWidth: number | undefined; leftOffset: number | undefined }
}

export function useShellMessages({
  editorMode,
  setEditorMode,
  setCanvasMode,
  setShowPanels,
  setCanvasZoom,
  handleDelete,
  handleUndo,
  handleRedo,
  handleCopy,
  handleCut,
  handlePaste,
  handleDuplicate,
  getVisibleCanvasInfo,
}: UseShellMessagesOptions) {
  const syncToCanvas = useCallback(() => {
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }, [])

  const handleAddElement = useCallback(
    (type: ElementType, props?: Record<string, unknown>) => {
      historyStore.pushSnapshot()
      const id = documentStore.addElement(type, undefined, props)
      if (id) {
        selectionStore.select(id)
        syncToCanvas()
        bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [id] } })
      }
    },
    [syncToCanvas]
  )

  const handleAddSection = useCallback(
    (role: SectionRole) => {
      historyStore.pushSnapshot()
      documentStore.addSection(role)
      syncToCanvas()
    },
    [syncToCanvas]
  )

  const handleLoadTemplate = useCallback((templateId: string) => {
    historyStore.pushSnapshot()
    documentStore.loadTemplate(templateId)
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }, [])

  const handleAlign = useCallback(
    (type: import("../components/Toolbar").AlignType) => {
      const elements = selectionStore.selectedElements.filter((el) => !el.locked && el.id !== documentStore.rootId && el.style.position === "absolute")
      if (elements.length < 2) return

      historyStore.pushSnapshot()

      const bounds = elements.map((el) => ({
        id: el.id,
        left: typeof el.style.left === "number" ? el.style.left : 0,
        top: typeof el.style.top === "number" ? el.style.top : 0,
        width: typeof el.style.width === "number" ? el.style.width : 100,
        height: typeof el.style.height === "number" ? el.style.height : 40,
      }))

      switch (type) {
        case "left": {
          const min = Math.min(...bounds.map((b) => b.left))
          for (const b of bounds) documentStore.updateStyle(b.id, { left: min })
          break
        }
        case "right": {
          const max = Math.max(...bounds.map((b) => b.left + b.width))
          for (const b of bounds) documentStore.updateStyle(b.id, { left: max - b.width })
          break
        }
        case "center-h": {
          const min = Math.min(...bounds.map((b) => b.left))
          const max = Math.max(...bounds.map((b) => b.left + b.width))
          const center = (min + max) / 2
          for (const b of bounds) documentStore.updateStyle(b.id, { left: Math.round(center - b.width / 2) })
          break
        }
        case "top": {
          const min = Math.min(...bounds.map((b) => b.top))
          for (const b of bounds) documentStore.updateStyle(b.id, { top: min })
          break
        }
        case "bottom": {
          const max = Math.max(...bounds.map((b) => b.top + b.height))
          for (const b of bounds) documentStore.updateStyle(b.id, { top: max - b.height })
          break
        }
        case "center-v": {
          const min = Math.min(...bounds.map((b) => b.top))
          const max = Math.max(...bounds.map((b) => b.top + b.height))
          const center = (min + max) / 2
          for (const b of bounds) documentStore.updateStyle(b.id, { top: Math.round(center - b.height / 2) })
          break
        }
        case "distribute-h": {
          if (bounds.length < 3) break
          const sorted = [...bounds].sort((a, b) => a.left - b.left)
          const first = sorted[0]!
          const last = sorted[sorted.length - 1]!
          const totalWidth = sorted.reduce((sum, b) => sum + b.width, 0)
          const gap = (last.left + last.width - first.left - totalWidth) / (sorted.length - 1)
          let x = first.left + first.width + gap
          for (let i = 1; i < sorted.length - 1; i++) {
            documentStore.updateStyle(sorted[i]!.id, { left: Math.round(x) })
            x += sorted[i]!.width + gap
          }
          break
        }
        case "distribute-v": {
          if (bounds.length < 3) break
          const sorted = [...bounds].sort((a, b) => a.top - b.top)
          const first = sorted[0]!
          const last = sorted[sorted.length - 1]!
          const totalHeight = sorted.reduce((sum, b) => sum + b.height, 0)
          const gap = (last.top + last.height - first.top - totalHeight) / (sorted.length - 1)
          let y = first.top + first.height + gap
          for (let i = 1; i < sorted.length - 1; i++) {
            documentStore.updateStyle(sorted[i]!.id, { top: Math.round(y) })
            y += sorted[i]!.height + gap
          }
          break
        }
      }

      syncToCanvas()
    },
    [syncToCanvas]
  )

  const handleToggleCanvasMode = useCallback(() => {
    setCanvasMode((prev) => {
      const next = prev === "canvas" ? "page" : "canvas"
      historyStore.pushSnapshot()
      documentStore.setCanvasMode(next)
      syncToCanvas()
      {
        const info = getVisibleCanvasInfo()
        bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: next, ...info } })
      }
      return next
    })
  }, [syncToCanvas, getVisibleCanvasInfo, setCanvasMode])

  const handleToggleMode = useCallback(() => {
    setEditorMode((prev) => {
      const next = prev === "edit" ? "interact" : "edit"
      bridge.send({ type: "SET_MODE", payload: { mode: next, canvasMode: documentStore.canvasMode } })
      if (next === "interact") {
        selectionStore.clear()
        if (documentStore.canvasMode === "page") setShowPanels(false)
      } else {
        setShowPanels(true)
        if (documentStore.canvasMode === "page") {
          requestAnimationFrame(() => {
            const info = getVisibleCanvasInfo()
            bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: "page", ...info } })
          })
        }
      }
      return next
    })
  }, [getVisibleCanvasInfo, setEditorMode, setShowPanels])

  useEffect(() => {
    const dispose = bridge.onMessage((msg: EditorMessage) => {
      switch (msg.type) {
        case "CANVAS_READY": {
          const data = documentStore.toSerializable()
          bridge.send({ type: "SYNC_DOCUMENT", payload: data })
          if (documentStore.canvasMode !== "canvas") {
            {
              const info = getVisibleCanvasInfo()
              bridge.send({ type: "SET_CANVAS_MODE", payload: { mode: documentStore.canvasMode, ...info } })
            }
            setCanvasMode(documentStore.canvasMode)
          }
          break
        }
        case "ELEMENT_CLICKED":
          if (msg.payload.shiftKey) {
            selectionStore.toggle(msg.payload.id)
          } else {
            selectionStore.select(msg.payload.id, msg.payload.bounds)
          }
          bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [...selectionStore.selectedIds] } })
          break
        case "ELEMENT_MOVED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { left: msg.payload.x, top: msg.payload.y })
          syncToCanvas()
          break
        case "ELEMENTS_MOVED":
          historyStore.pushSnapshot()
          for (const move of msg.payload.moves) {
            documentStore.updateStyle(move.id, { left: move.x, top: move.y })
          }
          syncToCanvas()
          break
        case "ELEMENT_RESIZED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { width: msg.payload.width, height: msg.payload.height })
          syncToCanvas()
          break
        case "CANVAS_CLICKED":
          selectionStore.clear()
          break
        case "MARQUEE_SELECT":
          selectionStore.setIds(msg.payload.ids)
          break
        case "KEY_EVENT": {
          const k = msg.payload
          if (k.key === "Escape" && editorMode === "interact") {
            setEditorMode("edit")
            bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
            setShowPanels(true)
            return
          }
          if (k.key === "Delete" || k.key === "Backspace") {
            handleDelete()
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyZ") {
            if (k.shiftKey) handleRedo()
            else handleUndo()
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "Backslash") {
            setShowPanels((prev) => !prev)
            return
          }
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyC") handleCopy()
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyX") handleCut()
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyV") handlePaste()
          if ((k.metaKey || k.ctrlKey) && k.code === "KeyD") handleDuplicate()
          break
        }
        case "REORDER_CHILD":
          historyStore.pushSnapshot()
          documentStore.reorderChild(msg.payload.parentId, msg.payload.childId, msg.payload.newIndex)
          syncToCanvas()
          break
        case "REPARENT_ELEMENT":
          historyStore.pushSnapshot()
          documentStore.reparentElement(msg.payload.id, msg.payload.newParentId, msg.payload.index, msg.payload.dropPosition)
          syncToCanvas()
          break
        case "SET_PAGE_VIEWPORT_REQUEST":
          documentStore.setPageViewport(msg.payload.width)
          syncToCanvas()
          {
            const info = getVisibleCanvasInfo()
            bridge.send({ type: "SET_PAGE_VIEWPORT", payload: { width: msg.payload.width, ...info } })
          }
          break
        case "INSERT_SECTION_REQUEST":
          historyStore.pushSnapshot()
          documentStore.addSection(msg.payload.preset, msg.payload.index)
          syncToCanvas()
          break
        case "GROUP_ELEMENTS_REQUEST": {
          historyStore.pushSnapshot()
          const groupId = documentStore.groupElements(msg.payload.ids, msg.payload.elementBounds)
          if (groupId) {
            selectionStore.select(groupId)
            syncToCanvas()
            bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [groupId] } })
          }
          break
        }
        case "DND_CREATE_ELEMENT": {
          const elType = msg.payload.elementType as ElementType
          historyStore.pushSnapshot()
          const id = documentStore.addElement(elType)
          if (id) {
            if (documentStore.canvasMode === "canvas") {
              documentStore.updateStyle(id, { left: msg.payload.x, top: msg.payload.y })
            }
            selectionStore.select(id)
            syncToCanvas()
            bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [id] } })
          }
          break
        }
        case "ZOOM_CHANGED":
          setCanvasZoom(msg.payload.zoom)
          break
        case "UNGROUP_ELEMENTS_REQUEST": {
          const ids = msg.payload.ids.filter((id: string) => {
            const el = documentStore.getElement(id)
            return el && !el.locked && el.id !== documentStore.rootId
          })
          if (ids.length === 0) break
          historyStore.pushSnapshot()
          const newSelection = documentStore.ungroupElements(ids)
          selectionStore.setIds(newSelection)
          syncToCanvas()
          if (newSelection.length > 0) {
            bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newSelection } })
          }
          break
        }
      }
    })

    return dispose
  }, [])

  return {
    syncToCanvas,
    handleAddElement,
    handleAddSection,
    handleLoadTemplate,
    handleAlign,
    handleToggleCanvasMode,
    handleToggleMode,
  }
}
