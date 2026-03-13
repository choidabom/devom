import { nanoid } from "nanoid"
import type { DocumentStore } from "../../stores/DocumentStore"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement, type ElementType, type SizingProps } from "../../types"
import { getDefaultProps } from "../../utils/getDefaultProps"

export interface AddElementOverrides {
  name?: string
  style?: Partial<EditorElement["style"]>
  props?: Record<string, unknown>
  layoutMode?: "none" | "flex"
  layoutProps?: Partial<EditorElement["layoutProps"]>
  sizing?: Partial<SizingProps>
}

export function createTemplateHelper(store: DocumentStore) {
  return (type: ElementType, parentId: string, overrides: AddElementOverrides = {}): string => {
    const id = nanoid()
    const parent = store.elements.get(parentId)
    if (!parent) {
      console.error(`[createTemplateHelper] Parent element not found: ${parentId}`)
      return ""
    }
    store.elements.set(id, {
      id,
      type,
      name: overrides.name ?? `${type}-${id.slice(0, 4)}`,
      parentId,
      children: [],
      style: { ...DEFAULT_ELEMENT_STYLE[type], ...overrides.style },
      props: { ...getDefaultProps(type), ...overrides.props },
      locked: false,
      visible: true,
      layoutMode: overrides.layoutMode ?? "none",
      layoutProps: { ...DEFAULT_LAYOUT_PROPS, ...overrides.layoutProps },
      sizing: { ...DEFAULT_SIZING, ...overrides.sizing },
      canvasPosition: null,
    })
    parent.children.push(id)
    return id
  }
}
