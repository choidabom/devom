import type { CSSProperties } from "react"
import type { EditorElement } from "../types"
import { getContainerStyles, getChildSizingStyles } from "../utils/layoutStyles"

/** Escape HTML content characters: < > & " ' */
export function escapeHtml(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" }
    return map[c] ?? c
  })
}

/** Escape JSX content characters: < > & { } */
export function escapeJsx(str: string): string {
  return str.replace(/[<>&{}]/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "{": "&#123;", "}": "&#125;" }
    return map[c] ?? c
  })
}

/** Compute effective style combining element style + layout container + child sizing */
export function computeElementStyle(el: EditorElement, parent: EditorElement | null): CSSProperties {
  const style: CSSProperties = { ...el.style }

  // Remove absolute positioning for auto-layout children
  if (parent && (parent.layoutMode === 'flex' || parent.layoutMode === 'grid')) {
    delete style.position
    delete (style as Record<string, unknown>).left
    delete (style as Record<string, unknown>).top
  }

  // Add container layout styles
  Object.assign(style, getContainerStyles(el))

  // Add child sizing styles
  if (parent && parent.layoutMode === 'flex') {
    Object.assign(style, getChildSizingStyles(el, parent.layoutProps.direction))
  }

  return style
}
