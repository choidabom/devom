import type { CSSProperties } from "react"
import type { EditorElement } from "../types"

export function exportToHTML(elements: Record<string, EditorElement>, rootId: string): string {
  const root = elements[rootId]
  if (!root) return ""

  const lines: string[] = [
    "<!DOCTYPE html>",
    '<html><head><meta charset="UTF-8"><style>* { margin: 0; box-sizing: border-box; }</style></head>',
    "<body>",
  ]
  renderHTML(root, elements, lines, 2)
  lines.push("</body></html>")
  return lines.join("\n")
}

function renderHTML(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const tag = el.type === "image" ? "img" : el.type === "button" ? "button" : el.type === "input" ? "input" : "div"
  const styleStr = cssToInline(el.style)
  const content = el.type === "text" ? String(el.props.content ?? "") : el.type === "button" ? String(el.props.label ?? "") : ""

  let attrs = styleStr ? ` style="${styleStr}"` : ""
  if (el.type === "image") attrs += ` src="${el.props.src ?? ""}" alt="${el.props.alt ?? ""}"`
  if (el.type === "input") attrs += ` placeholder="${el.props.placeholder ?? ""}"`

  if (tag === "img" || tag === "input") {
    lines.push(`${pad}<${tag}${attrs} />`)
  } else {
    lines.push(`${pad}<${tag}${attrs}>`)
    if (content) lines.push(`${pad}  ${content}`)
    for (const childId of el.children) {
      const child = elements[childId]
      if (child) renderHTML(child, elements, lines, indent + 2)
    }
    lines.push(`${pad}</${tag}>`)
  }
}

function cssToInline(style: CSSProperties): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const prop = k.replace(/([A-Z])/g, "-$1").toLowerCase()
      const val = typeof v === "number" && !["opacity", "zIndex", "flex", "order"].includes(k) ? `${v}px` : v
      return `${prop}: ${val}`
    })
    .join("; ")
}
