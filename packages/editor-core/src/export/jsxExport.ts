import type { CSSProperties } from "react"
import type { EditorElement } from "../types"
import { getContainerStyles, getChildSizingStyles } from "../utils/layoutStyles"

const SHADCN_IMPORTS: Record<string, { from: string; names: string[] }> = {
  "sc:button": { from: "@/components/ui/button", names: ["Button"] },
  "sc:card": { from: "@/components/ui/card", names: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent"] },
  "sc:input": { from: "@/components/ui/input", names: ["Input"] },
  "sc:badge": { from: "@/components/ui/badge", names: ["Badge"] },
}

export function exportToJSX(elements: Record<string, EditorElement>, rootId: string): string {
  const root = elements[rootId]
  if (!root) return ""

  // Collect used shadcn types
  const usedTypes = new Set<string>()
  collectTypes(root, elements, usedTypes)

  const lines: string[] = []

  // Generate imports
  const imports = generateImports(usedTypes)
  if (imports.length > 0) {
    lines.push(...imports)
    lines.push("")
  }

  // Generate component
  lines.push("export default function Component() {")
  lines.push("  return (")
  renderElement(root, elements, lines, 4)
  lines.push("  )")
  lines.push("}")

  return lines.join("\n")
}

function collectTypes(el: EditorElement, elements: Record<string, EditorElement>, types: Set<string>) {
  if (el.type.startsWith("sc:")) types.add(el.type)
  for (const childId of el.children) {
    const child = elements[childId]
    if (child) collectTypes(child, elements, types)
  }
}

function generateImports(types: Set<string>): string[] {
  const lines: string[] = []
  const byModule = new Map<string, Set<string>>()

  for (const type of types) {
    const info = SHADCN_IMPORTS[type]
    if (!info) continue
    const existing = byModule.get(info.from) ?? new Set()
    for (const name of info.names) existing.add(name)
    byModule.set(info.from, existing)
  }

  for (const [from, names] of byModule) {
    const sorted = [...names].sort()
    lines.push(`import { ${sorted.join(", ")} } from "${from}"`)
  }

  return lines
}

function renderElement(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  if (el.type.startsWith("sc:")) {
    renderShadcnElement(el, elements, lines, indent)
  } else {
    renderHtmlElement(el, elements, lines, indent)
  }
}

// --- shadcn component rendering ---

function renderShadcnElement(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)

  switch (el.type) {
    case "sc:button": {
      const variant = el.props.variant as string
      const size = el.props.size as string
      const label = String(el.props.label ?? "Button")
      const styleStr = styleToJsx(el.style)
      const variantProp = variant && variant !== "default" ? ` variant="${variant}"` : ""
      const sizeProp = size && size !== "default" ? ` size="${size}"` : ""
      lines.push(`${pad}<Button${variantProp}${sizeProp}${styleStr}>`)
      lines.push(`${pad}  ${escapeJsx(label)}`)
      lines.push(`${pad}</Button>`)
      break
    }
    case "sc:card": {
      const title = String(el.props.title ?? "")
      const description = String(el.props.description ?? "")
      const content = String(el.props.content ?? "")
      const styleStr = styleToJsx(el.style)
      lines.push(`${pad}<Card${styleStr}>`)
      lines.push(`${pad}  <CardHeader>`)
      if (title) lines.push(`${pad}    <CardTitle>${escapeJsx(title)}</CardTitle>`)
      if (description) lines.push(`${pad}    <CardDescription>${escapeJsx(description)}</CardDescription>`)
      lines.push(`${pad}  </CardHeader>`)
      if (content) {
        lines.push(`${pad}  <CardContent>`)
        lines.push(`${pad}    <p>${escapeJsx(content)}</p>`)
        lines.push(`${pad}  </CardContent>`)
      }
      // Render nested children
      for (const childId of el.children) {
        const child = elements[childId]
        if (child) renderElement(child, elements, lines, indent + 2)
      }
      lines.push(`${pad}</Card>`)
      break
    }
    case "sc:input": {
      const placeholder = String(el.props.placeholder ?? "")
      const type = el.props.type as string
      const styleStr = styleToJsx(el.style)
      const typeProp = type && type !== "text" ? ` type="${type}"` : ""
      const placeholderProp = placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : ""
      lines.push(`${pad}<Input${typeProp}${placeholderProp}${styleStr} />`)
      break
    }
    case "sc:badge": {
      const variant = el.props.variant as string
      const label = String(el.props.label ?? "Badge")
      const styleStr = styleToJsx(el.style)
      const variantProp = variant && variant !== "default" ? ` variant="${variant}"` : ""
      lines.push(`${pad}<Badge${variantProp}${styleStr}>`)
      lines.push(`${pad}  ${escapeJsx(label)}`)
      lines.push(`${pad}</Badge>`)
      break
    }
  }
}

// --- HTML element rendering ---

function renderHtmlElement(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const tag = getHtmlTag(el)

  // Compute effective style including auto-layout CSS
  const effectiveStyle: CSSProperties = { ...el.style }

  // Add container flex styles
  if (el.layoutMode === 'flex') {
    Object.assign(effectiveStyle, getContainerStyles(el))
  }

  // Adjust for auto-layout children
  if (el.parentId) {
    const parentEl = elements[el.parentId]
    if (parentEl?.layoutMode === 'flex') {
      delete (effectiveStyle as any).position
      delete (effectiveStyle as any).left
      delete (effectiveStyle as any).top
      Object.assign(effectiveStyle, getChildSizingStyles(el, parentEl.layoutProps.direction))
    }
  }

  const styleStr = styleToJsx(effectiveStyle)
  const propsStr = getHtmlPropsString(el)
  const hasChildren = el.children.length > 0
  const content = getHtmlContent(el)

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

function getHtmlTag(el: EditorElement): string {
  switch (el.type) {
    case "button": return "button"
    case "input": return "input"
    case "image": return "img"
    default: return "div"
  }
}

function getHtmlContent(el: EditorElement): string {
  if (el.type === "text") return escapeJsx(String(el.props.content ?? ""))
  if (el.type === "button") return escapeJsx(String(el.props.label ?? ""))
  return ""
}

function getHtmlPropsString(el: EditorElement): string {
  if (el.type === "image" && el.props.src) return ` src="${escapeAttr(String(el.props.src))}" alt="${escapeAttr(String(el.props.alt ?? ""))}"`
  if (el.type === "input") return ` placeholder="${escapeAttr(String(el.props.placeholder ?? ""))}"`
  return ""
}

// --- Utilities ---

function escapeJsx(str: string): string {
  return str.replace(/[<>&]/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;" }
    return map[c] ?? c
  })
}

function escapeAttr(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" }
    return map[c] ?? c
  })
}

function styleToJsx(style: CSSProperties): string {
  const entries = Object.entries(style).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  const inner = entries.map(([k, v]) => {
    const val = typeof v === "number" ? String(v) : `"${v}"`
    return `${k}: ${val}`
  }).join(", ")
  return ` style={{ ${inner} }}`
}
