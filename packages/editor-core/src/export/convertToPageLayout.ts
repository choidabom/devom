import type { EditorElement } from "../types"

/**
 * Convert canvas-mode serialized data to page-like layout for export.
 * Transforms absolute-positioned top-level children into flex-column flow.
 * Returns a new copy — does not mutate the input.
 */
export function convertToPageLayout(elements: Record<string, EditorElement>, rootId: string): Record<string, EditorElement> {
  const out: Record<string, EditorElement> = {}
  for (const [key, el] of Object.entries(elements)) {
    out[key] = JSON.parse(JSON.stringify(el))
  }

  const root = out[rootId]
  if (!root) return out

  // Already page-like (flex column root)
  if (root.layoutMode === "flex") return out

  // Sort children by vertical then horizontal position (top-to-bottom, left-to-right)
  const sortedChildren = [...root.children].sort((a, b) => {
    const elA = out[a]
    const elB = out[b]
    if (!elA || !elB) return 0
    const topA = typeof elA.style.top === "number" ? elA.style.top : 0
    const topB = typeof elB.style.top === "number" ? elB.style.top : 0
    if (Math.abs(topA - topB) > 20) return topA - topB
    const leftA = typeof elA.style.left === "number" ? elA.style.left : 0
    const leftB = typeof elB.style.left === "number" ? elB.style.left : 0
    return leftA - leftB
  })
  root.children = sortedChildren

  // Find max width among children to determine page width
  let maxChildWidth = 0
  for (const childId of root.children) {
    const child = out[childId]
    if (!child) continue
    const w = typeof child.style.width === "number" ? child.style.width : 0
    if (w > maxChildWidth) maxChildWidth = w
  }
  const pageWidth = maxChildWidth > 0 ? maxChildWidth : 800

  // Convert root to flex column with the computed page width
  root.layoutMode = "flex"
  root.layoutProps = {
    ...root.layoutProps,
    direction: "column",
    gap: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    alignItems: "stretch",
  }
  root.style = {
    ...root.style,
    width: pageWidth,
    maxWidth: "100%",
    height: undefined,
    overflow: "visible",
    backgroundColor: "#ffffff",
  }

  // Convert each top-level child from absolute to flow
  for (const childId of root.children) {
    const child = out[childId]
    if (!child) continue
    const { left, top, position, ...rest } = child.style
    child.style = { ...rest, position: "relative" as const, width: "100%" }
    child.sizing = { w: "fill", h: "hug" }
  }

  return out
}
