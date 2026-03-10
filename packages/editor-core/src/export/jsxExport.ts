import type { CSSProperties } from "react"
import type { EditorElement } from "../types"

export function exportToJSX(elements: Record<string, EditorElement>, rootId: string): string {
  const root = elements[rootId]
  if (!root) return ""

  const lines: string[] = []
  lines.push("export default function Component() {")
  lines.push("  return (")
  renderElement(root, elements, lines, 4)
  lines.push("  )")
  lines.push("}")
  return lines.join("\n")
}

function renderElement(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const tag = getTag(el)
  const styleStr = styleToString(el.style)
  const propsStr = getPropsString(el)
  const hasChildren = el.children.length > 0
  const content = getContent(el)

  if (!hasChildren && !content) {
    lines.push(`${pad}<${tag}${styleStr}${propsStr} />`)
  } else {
    lines.push(`${pad}<${tag}${styleStr}${propsStr}>`)
    if (content) lines.push(`${pad}  ${content}`)
    for (const childId of el.children) {
      const child = elements[childId]
      if (child) renderElement(child, elements, lines, indent + 2)
    }
    lines.push(`${pad}</${tag}>`)
  }
}

function getTag(el: EditorElement): string {
  switch (el.type) {
    case "button": return "button"
    case "input": return "input"
    case "image": return "img"
    default: return "div"
  }
}

function getContent(el: EditorElement): string {
  if (el.type === "text") return escapeAttr(String(el.props.content ?? ""))
  if (el.type === "button") return escapeAttr(String(el.props.label ?? ""))
  return ""
}

function getPropsString(el: EditorElement): string {
  if (el.type === "image" && el.props.src) return ` src="${escapeAttr(String(el.props.src))}" alt="${escapeAttr(String(el.props.alt ?? ""))}"`
  if (el.type === "input") return ` placeholder="${escapeAttr(String(el.props.placeholder ?? ""))}"`
  return ""
}

function escapeAttr(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" }
    return map[c] ?? c
  })
}

function styleToString(style: CSSProperties): string {
  const entries = Object.entries(style).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  const inner = entries.map(([k, v]) => {
    const val = typeof v === "number" ? String(v) : `"${v}"`
    return `${k}: ${val}`
  }).join(", ")
  return ` style={{ ${inner} }}`
}
