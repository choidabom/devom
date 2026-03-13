import type { CSSProperties } from "react"
import type { EditorElement } from "../types"
import { getContainerStyles, getChildSizingStyles } from "../utils/layoutStyles"

const HTML_ESCAPE_MAP: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" }
const JSX_ESCAPE_MAP: Record<string, string> = { ...HTML_ESCAPE_MAP, "{": "&#123;", "}": "&#125;" }

/** Escape HTML content characters: < > & " ' */
export function escapeHtml(str: string): string {
  return str.replace(/[<>&"']/g, (c) => HTML_ESCAPE_MAP[c] ?? c)
}

/** Escape JSX content characters: < > & { } */
export function escapeJsx(str: string): string {
  return str.replace(/[<>&"'{}]/g, (c) => JSX_ESCAPE_MAP[c] ?? c)
}

/** Compute effective style combining element style + layout container + child sizing */
export function computeElementStyle(el: EditorElement, parent: EditorElement | null): CSSProperties {
  const style: CSSProperties = { ...el.style }

  // Remove absolute positioning for auto-layout children
  if (parent?.layoutMode === 'flex' || parent?.layoutMode === 'grid') {
    delete style.position
    delete (style as Record<string, unknown>).left
    delete (style as Record<string, unknown>).top
  }

  // Add container layout styles
  Object.assign(style, getContainerStyles(el))

  // Add child sizing styles
  if (parent?.layoutMode === 'flex' && parent.layoutProps) {
    Object.assign(style, getChildSizingStyles(el, parent.layoutProps.direction, parent.layoutProps.flexWrap))
  }

  return style
}
