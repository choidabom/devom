import { nanoid } from "nanoid"
import type { ObservableMap } from "mobx"
import { DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement } from "../../types"

export function findLCA(elements: ObservableMap<string, EditorElement>, rootId: string, ids: string[]): string | null {
  if (ids.length === 0) return null

  const paths: string[][] = []
  for (const id of ids) {
    const path: string[] = []
    let current: string | null = id
    while (current) {
      path.unshift(current)
      const el = elements.get(current)
      if (!el) break
      current = el.parentId
    }
    paths.push(path)
  }

  let lca = rootId
  const minLen = Math.min(...paths.map((p) => p.length))
  for (let i = 0; i < minLen; i++) {
    const val = paths[0]?.[i]
    if (!val) break
    if (paths.every((p) => p[i] === val)) {
      lca = val
    } else {
      break
    }
  }

  return lca
}

export function isAncestor(elements: ObservableMap<string, EditorElement>, ancestorId: string, descendantId: string): boolean {
  let current: string | null = descendantId
  while (current) {
    const el = elements.get(current)
    if (!el || !el.parentId) return false
    if (el.parentId === ancestorId) return true
    current = el.parentId
  }
  return false
}

export function groupElements(
  elements: ObservableMap<string, EditorElement>,
  rootId: string,
  ids: string[],
  elementBounds: Record<string, { left: number; top: number; width: number; height: number }>
): string | null {
  const validIds = ids.filter((id) => {
    const el = elements.get(id)
    return el && !el.locked && id !== rootId
  })
  if (validIds.length < 2) return null

  for (const a of validIds) {
    for (const b of validIds) {
      if (a !== b && isAncestor(elements, a, b)) return null
    }
  }

  const lcaId = findLCA(elements, rootId, validIds)
  if (!lcaId) return null

  for (const id of validIds) {
    if (!elementBounds[id]) return null
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const id of validIds) {
    const b = elementBounds[id]!
    minX = Math.min(minX, b.left)
    minY = Math.min(minY, b.top)
    maxX = Math.max(maxX, b.left + b.width)
    maxY = Math.max(maxY, b.top + b.height)
  }

  const groupId = nanoid()
  const lca = elements.get(lcaId)!

  const group: EditorElement = {
    id: groupId,
    type: "div",
    name: `Group-${groupId.slice(0, 4)}`,
    parentId: lcaId,
    children: [],
    style: {
      position: "absolute" as const,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    props: {},
    locked: false,
    visible: true,
    layoutMode: "none" as const,
    layoutProps: { ...DEFAULT_LAYOUT_PROPS },
    sizing: { ...DEFAULT_SIZING },
    canvasPosition: null,
  }
  elements.set(groupId, group)

  let insertIndex = lca.children.length
  for (const id of validIds) {
    const el = elements.get(id)
    if (el && el.parentId === lcaId) {
      const idx = lca.children.indexOf(id)
      if (idx !== -1 && idx < insertIndex) insertIndex = idx
    }
  }

  for (const id of validIds) {
    const el = elements.get(id)
    if (!el) continue

    const oldParent = el.parentId ? elements.get(el.parentId) : undefined
    if (oldParent) {
      oldParent.children = oldParent.children.filter((c) => c !== id)
    }

    const b = elementBounds[id]
    const left = b ? b.left - minX : 0
    const top = b ? b.top - minY : 0
    el.style = {
      ...el.style,
      position: "absolute" as const,
      left,
      top,
    }

    el.parentId = groupId
    group.children.push(id)
  }

  lca.children = [...lca.children.slice(0, insertIndex), groupId, ...lca.children.slice(insertIndex)]

  return groupId
}

export function ungroupElements(elements: ObservableMap<string, EditorElement>, rootId: string, ids: string[]): string[] {
  const newSelection: string[] = []

  for (const id of ids) {
    const element = elements.get(id)
    if (!element || id === rootId) continue

    const hasChildren = element.children.length > 0

    if (hasChildren) {
      const parent = element.parentId ? elements.get(element.parentId) : undefined
      if (!parent) continue

      const containerIndex = parent.children.indexOf(id)
      if (containerIndex === -1) continue

      const directChildIds = [...element.children]

      // Container offset for coordinate restoration
      const containerLeft = typeof element.style.left === "number" ? element.style.left : 0
      const containerTop = typeof element.style.top === "number" ? element.style.top : 0

      for (const childId of directChildIds) {
        const child = elements.get(childId)
        if (!child) continue

        child.parentId = parent.id

        if (parent.layoutMode === "flex" || parent.layoutMode === "grid") {
          const { position, left, top, ...rest } = child.style
          child.style = { ...rest, position: "relative" as const }
        } else {
          // Restore absolute coordinates by adding container offset
          const childLeft = typeof child.style.left === "number" ? child.style.left : 0
          const childTop = typeof child.style.top === "number" ? child.style.top : 0
          child.style = {
            ...child.style,
            position: "absolute" as const,
            left: childLeft + containerLeft,
            top: childTop + containerTop,
          }
        }

        newSelection.push(childId)
      }

      const before = parent.children.slice(0, containerIndex)
      const after = parent.children.slice(containerIndex + 1)
      parent.children = [...before, ...directChildIds, ...after]

      element.children = []
      elements.delete(id)
    } else {
      const parent = element.parentId ? elements.get(element.parentId) : undefined
      if (!parent || parent.id === rootId) continue

      const grandparent = parent.parentId ? elements.get(parent.parentId) : undefined
      if (!grandparent) continue

      parent.children = parent.children.filter((cid) => cid !== id)

      const parentIndex = grandparent.children.indexOf(parent.id)
      const gpBefore = grandparent.children.slice(0, parentIndex + 1)
      const gpAfter = grandparent.children.slice(parentIndex + 1)
      grandparent.children = [...gpBefore, id, ...gpAfter]
      element.parentId = grandparent.id

      if (grandparent.layoutMode === "flex" || grandparent.layoutMode === "grid") {
        const { position, left, top, ...rest } = element.style
        element.style = { ...rest, position: "relative" as const }
      } else {
        element.style = { ...element.style, position: "absolute" as const }
      }

      newSelection.push(id)
    }
  }

  return newSelection
}
