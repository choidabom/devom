import type { CSSProperties } from "react"
import type { EditorElement } from "../types"
import { getContainerStyles, getChildSizingStyles } from "../utils/layoutStyles"

export function exportToHTML(elements: Record<string, EditorElement>, rootId: string): string {
  const root = elements[rootId]
  if (!root) return ""

  const lines: string[] = [
    "<!DOCTYPE html>",
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<style>",
    "  * { margin: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
    "  body { background: #f1f5f9; min-height: 100vh; display: flex; justify-content: center; padding: 0; }",
    "  table { width: 100%; border-collapse: collapse; }",
    "  th { text-align: left; padding: 8px 12px; font-size: 12px; font-weight: 500; color: #64748b; border-bottom: 1px solid #e2e8f0; }",
    "  td { padding: 8px 12px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; }",
    "  input, textarea { font-family: inherit; font-size: 14px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; width: 100%; }",
    "  input:focus, textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }",
    "  button { font-family: inherit; cursor: pointer; border: none; }",
    "</style>",
    "</head>",
    "<body>",
  ]
  const getEl = (id: string) => elements[id]
  renderHTML(root, elements, getEl, lines, 2, null)
  lines.push("</body></html>")
  return lines.join("\n")
}

function esc(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" }
    return map[c] ?? c
  })
}

function renderHTML(
  el: EditorElement,
  elements: Record<string, EditorElement>,
  getEl: (id: string) => EditorElement | undefined,
  lines: string[],
  indent: number,
  parent: EditorElement | null,
) {
  const pad = " ".repeat(indent)
  const style = computeFullStyle(el, parent)

  // Handle shadcn/ui components
  if (el.type.startsWith("sc:")) {
    renderShadcnHTML(el, elements, getEl, lines, indent, parent)
    return
  }

  if (el.type === "text") {
    const content = String(el.props.content ?? "")
    const fontSize = el.style.fontSize as number | undefined
    const tag = fontSize && fontSize >= 20 ? "h2" : fontSize && fontSize >= 16 ? "h3" : "p"
    lines.push(`${pad}<${tag} style="${esc(cssToInline(style))}">${esc(content)}</${tag}>`)
    return
  }

  if (el.type === "image") {
    lines.push(`${pad}<img style="${esc(cssToInline(style))}" src="${esc(String(el.props.src ?? ""))}" alt="${esc(String(el.props.alt ?? ""))}" />`)
    return
  }

  if (el.type === "button") {
    lines.push(`${pad}<button style="${esc(cssToInline(style))}">${esc(String(el.props.label ?? "Button"))}</button>`)
    return
  }

  if (el.type === "input") {
    lines.push(`${pad}<input style="${esc(cssToInline(style))}" placeholder="${esc(String(el.props.placeholder ?? ""))}" />`)
    return
  }

  // div container
  lines.push(`${pad}<div style="${esc(cssToInline(style))}">`)
  for (const childId of el.children) {
    const child = elements[childId]
    if (child) renderHTML(child, elements, getEl, lines, indent + 2, el)
  }
  lines.push(`${pad}</div>`)
}

function renderShadcnHTML(
  el: EditorElement,
  elements: Record<string, EditorElement>,
  getEl: (id: string) => EditorElement | undefined,
  lines: string[],
  indent: number,
  parent: EditorElement | null,
) {
  const pad = " ".repeat(indent)
  const p = el.props
  const baseStyle = computeFullStyle(el, parent)

  switch (el.type) {
    case "sc:button": {
      const variant = String(p.variant ?? "default")
      const size = String(p.size ?? "default")
      const btnStyle: CSSProperties = {
        ...baseStyle,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, fontWeight: 500, fontSize: size === 'sm' ? 13 : 14,
        padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
        ...(variant === 'default' ? { backgroundColor: '#0f172a', color: '#ffffff' } :
          variant === 'destructive' ? { backgroundColor: '#ef4444', color: '#ffffff' } :
          variant === 'outline' ? { backgroundColor: 'transparent', color: '#0f172a', border: '1px solid #e2e8f0' } :
          variant === 'ghost' ? { backgroundColor: 'transparent', color: '#0f172a' } :
          { backgroundColor: '#0f172a', color: '#ffffff' }),
      }
      lines.push(`${pad}<button style="${esc(cssToInline(btnStyle))}">${esc(String(p.label ?? "Button"))}</button>`)
      break
    }
    case "sc:input": {
      const inputStyle: CSSProperties = { ...baseStyle }
      lines.push(`${pad}<input style="${esc(cssToInline(inputStyle))}" placeholder="${esc(String(p.placeholder ?? ""))}" />`)
      break
    }
    case "sc:badge": {
      const variant = String(p.variant ?? "default")
      const badgeStyle: CSSProperties = {
        ...baseStyle,
        display: 'inline-flex', alignItems: 'center',
        borderRadius: 9999, fontSize: 11, fontWeight: 600, padding: '2px 8px',
        ...(variant === 'default' ? { backgroundColor: '#0f172a', color: '#ffffff' } :
          variant === 'secondary' ? { backgroundColor: '#f1f5f9', color: '#0f172a' } :
          variant === 'destructive' ? { backgroundColor: '#ef4444', color: '#ffffff' } :
          { backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }),
      }
      lines.push(`${pad}<span style="${esc(cssToInline(badgeStyle))}">${esc(String(p.label ?? "Badge"))}</span>`)
      break
    }
    case "sc:avatar": {
      const avatarStyle: CSSProperties = {
        ...baseStyle,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: '50%',
        backgroundColor: '#f1f5f9', color: '#64748b', fontSize: 13, fontWeight: 600,
        flexShrink: 0,
      }
      lines.push(`${pad}<div style="${esc(cssToInline(avatarStyle))}">${esc(String(p.fallback ?? ""))}</div>`)
      break
    }
    case "sc:progress": {
      const value = Number(p.value ?? 60)
      const outerStyle: CSSProperties = { ...baseStyle, height: 6, backgroundColor: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }
      const innerStyle: CSSProperties = { width: `${value}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 9999 }
      lines.push(`${pad}<div style="${esc(cssToInline(outerStyle))}">`)
      lines.push(`${pad}  <div style="${esc(cssToInline(innerStyle))}"></div>`)
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:switch": {
      const checked = Boolean(p.checked)
      const label = String(p.label ?? "")
      const wrapStyle: CSSProperties = { ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
      const trackStyle: CSSProperties = {
        width: 40, height: 22, borderRadius: 9999, padding: 2, flexShrink: 0,
        backgroundColor: checked ? '#0f172a' : '#e2e8f0',
        display: 'flex', alignItems: checked ? 'center' : 'center', justifyContent: checked ? 'flex-end' : 'flex-start',
      }
      const thumbStyle: CSSProperties = { width: 18, height: 18, borderRadius: '50%', backgroundColor: '#ffffff' }
      lines.push(`${pad}<div style="${esc(cssToInline(wrapStyle))}">`)
      if (label) lines.push(`${pad}  <span style="font-size: 13px; color: #0f172a">${esc(label)}</span>`)
      lines.push(`${pad}  <div style="${esc(cssToInline(trackStyle))}">`)
      lines.push(`${pad}    <div style="${esc(cssToInline(thumbStyle))}"></div>`)
      lines.push(`${pad}  </div>`)
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:tabs": {
      const tabs = (p.tabs as string[]) ?? []
      const active = String(p.activeTab ?? tabs[0] ?? "")
      const wrapStyle: CSSProperties = { ...baseStyle, display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0' }
      lines.push(`${pad}<div style="${esc(cssToInline(wrapStyle))}">`)
      for (const tab of tabs) {
        const isActive = tab === active
        const tabStyle: CSSProperties = {
          padding: '10px 16px', fontSize: 13, fontWeight: 500, color: isActive ? '#0f172a' : '#64748b',
          borderBottom: isActive ? '2px solid #0f172a' : '2px solid transparent', cursor: 'pointer',
          backgroundColor: 'transparent',
        }
        lines.push(`${pad}  <button style="${esc(cssToInline(tabStyle))}">${esc(tab)}</button>`)
      }
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:table": {
      const headers = (p.headers as string[]) ?? []
      const rows = (p.rows as string[][]) ?? []
      lines.push(`${pad}<table style="${esc(cssToInline(baseStyle))}">`)
      lines.push(`${pad}  <thead><tr>`)
      for (const h of headers) lines.push(`${pad}    <th>${esc(h)}</th>`)
      lines.push(`${pad}  </tr></thead>`)
      lines.push(`${pad}  <tbody>`)
      for (const row of rows) {
        lines.push(`${pad}    <tr>`)
        for (const cell of row) lines.push(`${pad}      <td>${esc(cell)}</td>`)
        lines.push(`${pad}    </tr>`)
      }
      lines.push(`${pad}  </tbody>`)
      lines.push(`${pad}</table>`)
      break
    }
    case "sc:alert": {
      const alertStyle: CSSProperties = {
        ...baseStyle, padding: '12px 16px', borderRadius: 8,
        border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
      }
      lines.push(`${pad}<div style="${esc(cssToInline(alertStyle))}">`)
      if (p.title) lines.push(`${pad}  <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px">${esc(String(p.title))}</div>`)
      if (p.description) lines.push(`${pad}  <div style="font-size: 13px; color: #64748b">${esc(String(p.description))}</div>`)
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:checkbox": {
      const wrapStyle: CSSProperties = { ...baseStyle, display: 'flex', alignItems: 'center', gap: 8 }
      lines.push(`${pad}<label style="${esc(cssToInline(wrapStyle))}">`)
      lines.push(`${pad}  <input type="checkbox" ${p.checked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #0f172a" />`)
      lines.push(`${pad}  <span style="font-size: 13px; color: #0f172a">${esc(String(p.label ?? ""))}</span>`)
      lines.push(`${pad}</label>`)
      break
    }
    case "sc:select": {
      const options = (p.options as string[]) ?? []
      const selectStyle: CSSProperties = {
        ...baseStyle, padding: '8px 12px', fontSize: 14, border: '1px solid #e2e8f0',
        borderRadius: 6, backgroundColor: '#ffffff', color: '#0f172a', width: '100%',
      }
      lines.push(`${pad}<select style="${esc(cssToInline(selectStyle))}">`)
      if (p.placeholder) lines.push(`${pad}  <option value="" disabled selected>${esc(String(p.placeholder))}</option>`)
      for (const opt of options) lines.push(`${pad}  <option>${esc(opt)}</option>`)
      lines.push(`${pad}</select>`)
      break
    }
    case "sc:accordion": {
      const items = (p.items as Array<{ title: string; content: string }>) ?? []
      lines.push(`${pad}<div style="${esc(cssToInline(baseStyle))}">`)
      for (const item of items) {
        lines.push(`${pad}  <details style="border-bottom: 1px solid #e2e8f0; padding: 12px 0">`)
        lines.push(`${pad}    <summary style="font-size: 14px; font-weight: 500; color: #0f172a; cursor: pointer">${esc(item.title)}</summary>`)
        lines.push(`${pad}    <p style="font-size: 13px; color: #64748b; margin-top: 8px">${esc(item.content)}</p>`)
        lines.push(`${pad}  </details>`)
      }
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:radio-group": {
      const options = (p.options as string[]) ?? []
      const value = String(p.value ?? "")
      const groupName = `radio-${Math.random().toString(36).slice(2, 6)}`
      lines.push(`${pad}<fieldset style="${esc(cssToInline({ ...baseStyle, border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }))}">`)
      if (p.label) lines.push(`${pad}  <legend style="font-size: 13px; font-weight: 500; color: #0f172a; margin-bottom: 4px">${esc(String(p.label))}</legend>`)
      for (const opt of options) {
        lines.push(`${pad}  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #0f172a">`)
        lines.push(`${pad}    <input type="radio" name="${groupName}" value="${esc(opt)}" ${opt === value ? 'checked' : ''} style="accent-color: #0f172a" />`)
        lines.push(`${pad}    ${esc(opt)}`)
        lines.push(`${pad}  </label>`)
      }
      lines.push(`${pad}</fieldset>`)
      break
    }
    case "sc:separator": {
      const horizontal = p.orientation !== "vertical"
      const sepStyle: CSSProperties = {
        ...baseStyle,
        ...(horizontal ? { height: 1, width: '100%', backgroundColor: '#e2e8f0' } : { width: 1, height: '100%', backgroundColor: '#e2e8f0' }),
      }
      lines.push(`${pad}<div style="${esc(cssToInline(sepStyle))}"></div>`)
      break
    }
    case "sc:label": {
      lines.push(`${pad}<label style="${esc(cssToInline({ ...baseStyle, fontSize: 13, fontWeight: 500, color: '#0f172a' }))}">${esc(String(p.text ?? "Label"))}</label>`)
      break
    }
    case "sc:textarea": {
      lines.push(`${pad}<textarea style="${esc(cssToInline(baseStyle))}" rows="${Number(p.rows ?? 3)}" placeholder="${esc(String(p.placeholder ?? ""))}">${esc(String(p.value ?? ""))}</textarea>`)
      break
    }
    case "sc:skeleton": {
      const skelStyle: CSSProperties = { ...baseStyle, backgroundColor: '#f1f5f9', borderRadius: 6, height: 20, animation: 'pulse 2s ease-in-out infinite' }
      lines.push(`${pad}<div style="${esc(cssToInline(skelStyle))}"></div>`)
      break
    }
    case "sc:slider": {
      const sliderStyle: CSSProperties = { ...baseStyle, width: '100%' }
      lines.push(`${pad}<input type="range" min="${p.min ?? 0}" max="${p.max ?? 100}" value="${p.value ?? 50}" step="${p.step ?? 1}" style="${esc(cssToInline(sliderStyle))}" />`)
      break
    }
    case "sc:toggle": {
      const pressed = Boolean(p.pressed)
      const toggleStyle: CSSProperties = {
        ...baseStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
        backgroundColor: pressed ? '#f1f5f9' : 'transparent', color: '#0f172a',
        border: '1px solid #e2e8f0',
      }
      lines.push(`${pad}<button style="${esc(cssToInline(toggleStyle))}">${esc(String(p.label ?? ""))}</button>`)
      break
    }
    default: {
      // Fallback: render as div with children
      lines.push(`${pad}<div style="${esc(cssToInline(baseStyle))}">`)
      for (const childId of el.children) {
        const child = elements[childId]
        if (child) renderHTML(child, elements, getEl, lines, indent + 2, el)
      }
      lines.push(`${pad}</div>`)
    }
  }
}

function computeFullStyle(el: EditorElement, parent: EditorElement | null): CSSProperties {
  // Start with element's own style
  const style: CSSProperties = { ...el.style }

  // Remove absolute positioning for auto-layout children
  if (parent && (parent.layoutMode === 'flex' || parent.layoutMode === 'grid')) {
    delete style.position
    delete (style as Record<string, unknown>).left
    delete (style as Record<string, unknown>).top
  }

  // Add container layout styles
  const containerStyles = getContainerStyles(el)
  Object.assign(style, containerStyles)

  // Add child sizing styles
  if (parent && parent.layoutMode === 'flex') {
    const sizingStyles = getChildSizingStyles(el, parent.layoutProps.direction)
    Object.assign(style, sizingStyles)
  }

  return style
}

function cssToInline(style: CSSProperties): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const prop = k.replace(/([A-Z])/g, "-$1").toLowerCase()
      const val = typeof v === "number" && !["opacity", "zIndex", "flex", "order", "flexGrow", "flexShrink"].includes(k) ? `${v}px` : v
      return `${prop}: ${val}`
    })
    .join("; ")
}
