import { useCallback } from "react"
import type { EditorElement } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"

let clipboard: EditorElement[] = []

export function useClipboard(syncToCanvas: () => void) {
  const handleCopy = useCallback(() => {
    const elements = selectionStore.selectedElements.filter((el) => !el.locked && el.id !== documentStore.rootId)
    if (elements.length === 0) return
    const selectedSet = new Set(elements.map((el) => el.id))
    const topLevel = elements.filter((el) => {
      let cur = el.parentId
      while (cur) {
        if (selectedSet.has(cur)) return false
        const p = documentStore.getElement(cur)
        cur = p?.parentId ?? null
      }
      return true
    })
    clipboard = topLevel.flatMap((el) => documentStore.collectSubtree(el.id))
  }, [])

  const handleDelete = useCallback(() => {
    if (selectionStore.selectedIds.length === 0) return
    historyStore.pushSnapshot()
    const toDelete = [...selectionStore.selectedIds].filter((id) => {
      const el = documentStore.getElement(id)
      return el && !el.locked && el.id !== documentStore.rootId
    })
    for (const id of toDelete) {
      documentStore.removeElement(id)
    }
    selectionStore.clear()
    syncToCanvas()
  }, [syncToCanvas])

  const handleCut = useCallback(() => {
    handleCopy()
    handleDelete()
  }, [handleCopy, handleDelete])

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return
    historyStore.pushSnapshot()
    const newIds = documentStore.pasteElements(clipboard)
    selectionStore.setIds(newIds)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newIds } })
  }, [syncToCanvas])

  const handleDuplicate = useCallback(() => {
    const ids = selectionStore.selectedIds.filter((id) => {
      const el = documentStore.getElement(id)
      return el && !el.locked && el.id !== documentStore.rootId
    })
    if (ids.length === 0) return
    historyStore.pushSnapshot()
    const newIds = documentStore.duplicateElements(ids)
    selectionStore.setIds(newIds)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newIds } })
  }, [syncToCanvas])

  return { handleCopy, handleCut, handlePaste, handleDuplicate, handleDelete }
}
