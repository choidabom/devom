import type { DocumentStore } from "@devom/editor-core"

export interface DropTarget {
  containerId: string
  insertIndex: number
}

/**
 * Find the auto-layout container under the given point, if any.
 */
export function findDropTarget(clientX: number, clientY: number, draggedIds: string[], documentStore: DocumentStore): DropTarget | null {
  const containers = documentStore.getAllElements().filter((el) => el.layoutMode === "flex" && !draggedIds.includes(el.id))

  for (const container of containers) {
    const dom = document.querySelector(`[data-element-id="${container.id}"]`) as HTMLElement | null
    if (!dom) continue

    const rect = dom.getBoundingClientRect()
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue

    const insertIndex = calcInsertionIndex(container.id, container.layoutProps.direction, clientX, clientY, draggedIds, documentStore)
    return { containerId: container.id, insertIndex }
  }

  return null
}

/**
 * Calculate the insertion index within an auto-layout container.
 */
export function calcInsertionIndex(containerId: string, direction: "row" | "column", clientX: number, clientY: number, draggedIds: string[], documentStore: DocumentStore): number {
  const container = documentStore.getElement(containerId)
  if (!container) return 0

  const childIds = container.children.filter((id) => !draggedIds.includes(id))
  if (childIds.length === 0) return 0

  for (let i = 0; i < childIds.length; i++) {
    const childDom = document.querySelector(`[data-element-id="${childIds[i]}"]`) as HTMLElement | null
    if (!childDom) continue

    const childRect = childDom.getBoundingClientRect()
    const centerX = childRect.left + childRect.width / 2
    const centerY = childRect.top + childRect.height / 2

    if (direction === "row" && clientX < centerX) return i
    if (direction === "column" && clientY < centerY) return i
  }

  return childIds.length
}

/**
 * Calculate the position and dimensions of the insertion indicator line.
 */
export function calcInsertionIndicator(
  containerId: string,
  insertIndex: number,
  direction: "row" | "column",
  draggedIds: string[],
  documentStore: DocumentStore
): { x: number; y: number; width: number; height: number } | null {
  const container = documentStore.getElement(containerId)
  if (!container) return null

  const containerDom = document.querySelector(`[data-element-id="${containerId}"]`) as HTMLElement | null
  if (!containerDom) return null

  const containerRect = containerDom.getBoundingClientRect()
  const childIds = container.children.filter((id) => !draggedIds.includes(id))

  const THICKNESS = 2
  const INSET = 4

  if (childIds.length === 0) {
    if (direction === "row") {
      return { x: containerRect.left + INSET, y: containerRect.top + INSET, width: THICKNESS, height: containerRect.height - INSET * 2 }
    }
    return { x: containerRect.left + INSET, y: containerRect.top + INSET, width: containerRect.width - INSET * 2, height: THICKNESS }
  }

  if (insertIndex >= childIds.length) {
    const lastDom = document.querySelector(`[data-element-id="${childIds[childIds.length - 1]}"]`) as HTMLElement | null
    if (!lastDom) return null
    const lastRect = lastDom.getBoundingClientRect()

    if (direction === "row") {
      return { x: lastRect.right + 2, y: containerRect.top + INSET, width: THICKNESS, height: containerRect.height - INSET * 2 }
    }
    return { x: containerRect.left + INSET, y: lastRect.bottom + 2, width: containerRect.width - INSET * 2, height: THICKNESS }
  }

  const childDom = document.querySelector(`[data-element-id="${childIds[insertIndex]}"]`) as HTMLElement | null
  if (!childDom) return null
  const childRect = childDom.getBoundingClientRect()

  if (direction === "row") {
    return { x: childRect.left - 2, y: containerRect.top + INSET, width: THICKNESS, height: containerRect.height - INSET * 2 }
  }
  return { x: containerRect.left + INSET, y: childRect.top - 2, width: containerRect.width - INSET * 2, height: THICKNESS }
}
