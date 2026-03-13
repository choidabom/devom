import type { CSSProperties } from "react"
import type { EditorElement } from "../types"
import { escapeJsx, escapeHtml, computeElementStyle } from "./utils"

const SHADCN_IMPORTS: Record<string, { from: string; names: string[] }> = {
  "sc:button": { from: "@/components/ui/button", names: ["Button"] },
  "sc:card": { from: "@/components/ui/card", names: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent"] },
  "sc:input": { from: "@/components/ui/input", names: ["Input"] },
  "sc:badge": { from: "@/components/ui/badge", names: ["Badge"] },
  "sc:checkbox": { from: "@/components/ui/checkbox", names: ["Checkbox"] },
  "sc:switch": { from: "@/components/ui/switch", names: ["Switch"] },
  "sc:label": { from: "@/components/ui/label", names: ["Label"] },
  "sc:textarea": { from: "@/components/ui/textarea", names: ["Textarea"] },
  "sc:avatar": { from: "@/components/ui/avatar", names: ["Avatar", "AvatarFallback"] },
  "sc:separator": { from: "@/components/ui/separator", names: ["Separator"] },
  "sc:progress": { from: "@/components/ui/progress", names: ["Progress"] },
  "sc:skeleton": { from: "@/components/ui/skeleton", names: ["Skeleton"] },
  "sc:slider": { from: "@/components/ui/slider", names: ["Slider"] },
  "sc:tabs": { from: "@/components/ui/tabs", names: ["Tabs", "TabsList", "TabsTrigger"] },
  "sc:alert": { from: "@/components/ui/alert", names: ["Alert", "AlertTitle", "AlertDescription"] },
  "sc:toggle": { from: "@/components/ui/toggle", names: ["Toggle"] },
  "sc:select": { from: "@/components/ui/select", names: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"] },
  "sc:table": { from: "@/components/ui/table", names: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"] },
  "sc:accordion": { from: "@/components/ui/accordion", names: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"] },
  "sc:radio-group": { from: "@/components/ui/radio-group", names: ["RadioGroup", "RadioGroupItem"] },
}

export function exportToJSX(elements: Record<string, EditorElement>, rootId: string): string {
  const root = elements[rootId]
  if (!root) return ""

  const usedTypes = new Set<string>()
  collectTypes(root, elements, usedTypes)

  const lines: string[] = []

  const imports = generateImports(usedTypes)
  if (imports.length > 0) {
    lines.push(...imports)
    lines.push("")
  }

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

// --- Compute effective style (shared by both renderers) ---

function computeEffectiveStyle(el: EditorElement, elements: Record<string, EditorElement>): CSSProperties {
  const parent = el.parentId ? elements[el.parentId] ?? null : null
  return computeElementStyle(el, parent)
}

// --- shadcn component rendering ---

function renderShadcnElement(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const p = el.props
  const styleStr = styleToJsx(computeEffectiveStyle(el, elements))

  switch (el.type) {
    case "sc:button": {
      const variantProp = p.variant && p.variant !== "default" ? ` variant="${p.variant}"` : ""
      const sizeProp = p.size && p.size !== "default" ? ` size="${p.size}"` : ""
      lines.push(`${pad}<Button${variantProp}${sizeProp}${styleStr}>`)
      lines.push(`${pad}  ${escapeJsx(String(p.label ?? "Button"))}`)
      lines.push(`${pad}</Button>`)
      break
    }
    case "sc:card": {
      lines.push(`${pad}<Card${styleStr}>`)
      lines.push(`${pad}  <CardHeader>`)
      if (p.title) lines.push(`${pad}    <CardTitle>${escapeJsx(String(p.title))}</CardTitle>`)
      if (p.description) lines.push(`${pad}    <CardDescription>${escapeJsx(String(p.description))}</CardDescription>`)
      lines.push(`${pad}  </CardHeader>`)
      if (p.content) {
        lines.push(`${pad}  <CardContent>`)
        lines.push(`${pad}    <p>${escapeJsx(String(p.content))}</p>`)
        lines.push(`${pad}  </CardContent>`)
      }
      for (const childId of el.children) {
        const child = elements[childId]
        if (child) renderElement(child, elements, lines, indent + 2)
      }
      lines.push(`${pad}</Card>`)
      break
    }
    case "sc:input": {
      const typeProp = p.type && p.type !== "text" ? ` type="${p.type}"` : ""
      const phProp = p.placeholder ? ` placeholder="${escapeHtml(String(p.placeholder))}"` : ""
      lines.push(`${pad}<Input${typeProp}${phProp}${styleStr} />`)
      break
    }
    case "sc:badge": {
      const variantProp = p.variant && p.variant !== "default" ? ` variant="${p.variant}"` : ""
      lines.push(`${pad}<Badge${variantProp}${styleStr}>${escapeJsx(String(p.label ?? "Badge"))}</Badge>`)
      break
    }
    case "sc:checkbox": {
      lines.push(`${pad}<div className="flex items-center gap-2"${styleStr}>`)
      lines.push(`${pad}  <Checkbox id="${el.id}" ${p.checked ? "defaultChecked " : ""}/>`)
      lines.push(`${pad}  <Label htmlFor="${el.id}">${escapeJsx(String(p.label ?? ""))}</Label>`)
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:switch": {
      lines.push(`${pad}<div className="flex items-center justify-between"${styleStr}>`)
      if (p.label) lines.push(`${pad}  <Label>${escapeJsx(String(p.label))}</Label>`)
      lines.push(`${pad}  <Switch ${p.checked ? "defaultChecked " : ""}/>`)
      lines.push(`${pad}</div>`)
      break
    }
    case "sc:label": {
      lines.push(`${pad}<Label${styleStr}>${escapeJsx(String(p.text ?? "Label"))}</Label>`)
      break
    }
    case "sc:textarea": {
      const phProp = p.placeholder ? ` placeholder="${escapeHtml(String(p.placeholder))}"` : ""
      const rowsProp = p.rows ? ` rows={${p.rows}}` : ""
      lines.push(`${pad}<Textarea${phProp}${rowsProp}${styleStr} />`)
      break
    }
    case "sc:avatar": {
      lines.push(`${pad}<Avatar${styleStr}>`)
      lines.push(`${pad}  <AvatarFallback>${escapeJsx(String(p.fallback ?? ""))}</AvatarFallback>`)
      lines.push(`${pad}</Avatar>`)
      break
    }
    case "sc:separator": {
      const orientProp = p.orientation === "vertical" ? ` orientation="vertical"` : ""
      lines.push(`${pad}<Separator${orientProp}${styleStr} />`)
      break
    }
    case "sc:progress": {
      lines.push(`${pad}<Progress value={${Number(p.value ?? 60)}}${styleStr} />`)
      break
    }
    case "sc:skeleton": {
      lines.push(`${pad}<Skeleton className="h-5 w-full"${styleStr} />`)
      break
    }
    case "sc:slider": {
      lines.push(`${pad}<Slider defaultValue={[${Number(p.value ?? 50)}]} min={${p.min ?? 0}} max={${p.max ?? 100}} step={${p.step ?? 1}}${styleStr} />`)
      break
    }
    case "sc:tabs": {
      const tabs = (p.tabs as string[]) ?? []
      const active = String(p.activeTab ?? tabs[0] ?? "")
      lines.push(`${pad}<Tabs defaultValue="${escapeHtml(active)}"${styleStr}>`)
      lines.push(`${pad}  <TabsList>`)
      for (const tab of tabs) {
        lines.push(`${pad}    <TabsTrigger value="${escapeHtml(tab)}">${escapeJsx(tab)}</TabsTrigger>`)
      }
      lines.push(`${pad}  </TabsList>`)
      lines.push(`${pad}</Tabs>`)
      break
    }
    case "sc:alert": {
      const variantProp = p.variant && p.variant !== "default" ? ` variant="${p.variant}"` : ""
      lines.push(`${pad}<Alert${variantProp}${styleStr}>`)
      if (p.title) lines.push(`${pad}  <AlertTitle>${escapeJsx(String(p.title))}</AlertTitle>`)
      if (p.description) lines.push(`${pad}  <AlertDescription>${escapeJsx(String(p.description))}</AlertDescription>`)
      lines.push(`${pad}</Alert>`)
      break
    }
    case "sc:toggle": {
      const pressedProp = p.pressed ? " defaultPressed" : ""
      lines.push(`${pad}<Toggle${pressedProp}${styleStr}>${escapeJsx(String(p.label ?? ""))}</Toggle>`)
      break
    }
    case "sc:select": {
      const options = (p.options as string[]) ?? []
      lines.push(`${pad}<Select${styleStr}>`)
      lines.push(`${pad}  <SelectTrigger>`)
      lines.push(`${pad}    <SelectValue placeholder="${escapeHtml(String(p.placeholder ?? "Select"))}" />`)
      lines.push(`${pad}  </SelectTrigger>`)
      lines.push(`${pad}  <SelectContent>`)
      for (const opt of options) {
        lines.push(`${pad}    <SelectItem value="${escapeHtml(opt)}">${escapeJsx(opt)}</SelectItem>`)
      }
      lines.push(`${pad}  </SelectContent>`)
      lines.push(`${pad}</Select>`)
      break
    }
    case "sc:table": {
      const headers = (p.headers as string[]) ?? []
      const rows = (p.rows as string[][]) ?? []
      lines.push(`${pad}<Table${styleStr}>`)
      lines.push(`${pad}  <TableHeader>`)
      lines.push(`${pad}    <TableRow>`)
      for (const h of headers) lines.push(`${pad}      <TableHead>${escapeJsx(h)}</TableHead>`)
      lines.push(`${pad}    </TableRow>`)
      lines.push(`${pad}  </TableHeader>`)
      lines.push(`${pad}  <TableBody>`)
      for (const row of rows) {
        lines.push(`${pad}    <TableRow>`)
        for (const cell of row) lines.push(`${pad}      <TableCell>${escapeJsx(cell)}</TableCell>`)
        lines.push(`${pad}    </TableRow>`)
      }
      lines.push(`${pad}  </TableBody>`)
      lines.push(`${pad}</Table>`)
      break
    }
    case "sc:accordion": {
      const items = (p.items as Array<{ title: string; content: string }>) ?? []
      lines.push(`${pad}<Accordion type="single" collapsible${styleStr}>`)
      for (let i = 0; i < items.length; i++) {
        lines.push(`${pad}  <AccordionItem value="item-${i}">`)
        lines.push(`${pad}    <AccordionTrigger>${escapeJsx(items[i]!.title)}</AccordionTrigger>`)
        lines.push(`${pad}    <AccordionContent>${escapeJsx(items[i]!.content)}</AccordionContent>`)
        lines.push(`${pad}  </AccordionItem>`)
      }
      lines.push(`${pad}</Accordion>`)
      break
    }
    case "sc:radio-group": {
      const options = (p.options as string[]) ?? []
      const value = String(p.value ?? "")
      lines.push(`${pad}<div${styleStr}>`)
      if (p.label) lines.push(`${pad}  <Label>${escapeJsx(String(p.label))}</Label>`)
      lines.push(`${pad}  <RadioGroup defaultValue="${escapeHtml(value)}">`)
      for (const opt of options) {
        const optId = opt.toLowerCase().replace(/\s+/g, "-")
        lines.push(`${pad}    <div className="flex items-center gap-2">`)
        lines.push(`${pad}      <RadioGroupItem value="${escapeHtml(opt)}" id="${optId}" />`)
        lines.push(`${pad}      <Label htmlFor="${optId}">${escapeJsx(opt)}</Label>`)
        lines.push(`${pad}    </div>`)
      }
      lines.push(`${pad}  </RadioGroup>`)
      lines.push(`${pad}</div>`)
      break
    }
    default: {
      lines.push(`${pad}<div${styleStr}>`)
      for (const childId of el.children) {
        const child = elements[childId]
        if (child) renderElement(child, elements, lines, indent + 2)
      }
      lines.push(`${pad}</div>`)
    }
  }
}

// --- HTML element rendering ---

function renderHtmlElement(el: EditorElement, elements: Record<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const tag = getHtmlTag(el)
  const styleStr = styleToJsx(computeEffectiveStyle(el, elements))
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
    case "video": return "video"
    default: return "div"
  }
}

function getHtmlContent(el: EditorElement): string {
  if (el.type === "text") return escapeJsx(String(el.props.content ?? ""))
  if (el.type === "button") return escapeJsx(String(el.props.label ?? ""))
  return ""
}

function getHtmlPropsString(el: EditorElement): string {
  if (el.type === "image" && el.props.src) return ` src="${escapeHtml(String(el.props.src))}" alt="${escapeHtml(String(el.props.alt ?? ""))}"`
  if (el.type === "video" && el.props.src) return ` src="${escapeHtml(String(el.props.src))}"${el.props.autoplay !== false ? ' autoPlay' : ''}${el.props.muted !== false ? ' muted' : ''}${el.props.loop !== false ? ' loop' : ''}${el.props.controls ? ' controls' : ''} playsInline`
  if (el.type === "input") return ` placeholder="${escapeHtml(String(el.props.placeholder ?? ""))}"`
  return ""
}

// --- Utilities ---

function styleToJsx(style: CSSProperties): string {
  const entries = Object.entries(style).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  const inner = entries.map(([k, v]) => {
    const val = typeof v === "number" ? String(v) : `"${v}"`
    return `${k}: ${val}`
  }).join(", ")
  return ` style={{ ${inner} }}`
}
