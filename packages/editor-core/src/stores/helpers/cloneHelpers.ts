import { nanoid } from "nanoid"
import type { ObservableMap } from "mobx"
import { type CanvasMode, type EditorElement, type ElementTemplate } from "../../types"

export function collectSubtree(
  elements: ObservableMap<string, EditorElement>,
  id: string,
): EditorElement[] {
  const el = elements.get(id)
  if (!el) return []
  const result: EditorElement[] = [JSON.parse(JSON.stringify(el))]
  for (const childId of el.children) {
    result.push(...collectSubtree(elements, childId))
  }
  return result
}

export function cloneTree(
  elements: ObservableMap<string, EditorElement>,
  rootId: string,
  canvasMode: CanvasMode,
  sourceElements: EditorElement[],
  targetParentId: string,
  offset: number,
): string[] {
  const target = elements.get(targetParentId)
  if (!target || sourceElements.length === 0) return []

  const idMap = new Map<string, string>()
  for (const el of sourceElements) {
    idMap.set(el.id, nanoid())
  }

  const copiedIds = new Set(sourceElements.map(e => e.id))
  const topLevelIds = new Set(
    sourceElements.filter(el => !el.parentId || !copiedIds.has(el.parentId)).map(e => e.id)
  )

  const newTopIds: string[] = []
  for (const el of sourceElements) {
    const newId = idMap.get(el.id)!
    const isTop = topLevelIds.has(el.id)
    const newParentId = isTop ? targetParentId : idMap.get(el.parentId!)
    if (!newParentId) continue

    const needsAbsolute = isTop && targetParentId === rootId && canvasMode === 'canvas'
    const style = {
      ...JSON.parse(JSON.stringify(el.style)),
      ...(isTop && typeof el.style.left === 'number' ? { left: el.style.left + offset } : {}),
      ...(isTop && typeof el.style.top === 'number' ? { top: el.style.top + offset } : {}),
    }
    if (needsAbsolute) {
      style.position = 'absolute'
      if (typeof style.left !== 'number') style.left = 100
      if (typeof style.top !== 'number') style.top = 100
    }

    const cloned: EditorElement = {
      ...JSON.parse(JSON.stringify(el)),
      id: newId,
      parentId: newParentId,
      name: `${el.type}-${newId.slice(0, 4)}`,
      children: el.children.map(cid => idMap.get(cid)).filter(Boolean) as string[],
      style,
      canvasPosition: null,
    }

    elements.set(newId, cloned)
    if (isTop) {
      target.children.push(newId)
      newTopIds.push(newId)
    }
  }

  return newTopIds
}

export function pasteElements(
  elements: ObservableMap<string, EditorElement>,
  rootId: string,
  canvasMode: CanvasMode,
  sourceElements: EditorElement[],
  offset = 20,
): string[] {
  return cloneTree(elements, rootId, canvasMode, sourceElements, rootId, offset)
}

export function duplicateElements(
  elements: ObservableMap<string, EditorElement>,
  rootId: string,
  canvasMode: CanvasMode,
  ids: string[],
  offset = 20,
): string[] {
  const idSet = new Set(ids)
  const topIds = ids.filter(id => {
    const el = elements.get(id)
    if (!el) return false
    let cur = el.parentId
    while (cur) {
      if (idSet.has(cur)) return false
      const p = elements.get(cur)
      cur = p?.parentId ?? null
    }
    return true
  })

  const newIds: string[] = []
  for (const id of topIds) {
    const el = elements.get(id)
    if (!el || el.locked || id === rootId || !el.parentId) continue
    const subtree = collectSubtree(elements, id)
    const cloned = cloneTree(elements, rootId, canvasMode, subtree, el.parentId, offset)
    newIds.push(...cloned)
  }
  return newIds
}

export function insertElementTree(
  elements: ObservableMap<string, EditorElement>,
  template: ElementTemplate,
  parentId: string,
  depth = 0,
): string {
  const id = nanoid()
  const { children: childTemplates, ...rest } = template
  const element: EditorElement = { ...rest, id, parentId, children: [] }
  elements.set(id, element)
  const parent = elements.get(parentId)
  if (parent) parent.children = [...parent.children, id]
  if (depth < 50) {
    for (const childTemplate of childTemplates) {
      insertElementTree(elements, childTemplate, id, depth + 1)
    }
  }
  return id
}

export function importElements(
  elements: ObservableMap<string, EditorElement>,
  rootId: string,
  templates: ElementTemplate[],
  targetParentId?: string,
): string[] {
  const parentId = targetParentId ?? rootId
  const parent = elements.get(parentId)
  if (!parent) return []
  const createdIds: string[] = []
  for (const template of templates) {
    const id = insertElementTree(elements, template, parentId)
    if (id) createdIds.push(id)
  }
  return createdIds
}
