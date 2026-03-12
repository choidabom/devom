import { nanoid } from "nanoid"
import type { DocumentStore } from "../../stores/DocumentStore"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement, type ElementType, type SizingProps } from "../../types"

export function buildLoginForm(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = (
    type: ElementType,
    parentId: string,
    overrides: { name?: string; style?: Partial<EditorElement['style']>; props?: Record<string, unknown>; layoutMode?: 'none' | 'flex'; layoutProps?: Partial<EditorElement['layoutProps']>; sizing?: Partial<SizingProps> } = {},
  ): string => {
    const id = nanoid()
    const parent = store.elements.get(parentId)
    if (!parent) return ''
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
      layoutMode: overrides.layoutMode ?? 'none',
      layoutProps: { ...DEFAULT_LAYOUT_PROPS, ...overrides.layoutProps },
      sizing: { ...DEFAULT_SIZING, ...overrides.sizing },
      canvasPosition: null,
    })
    parent.children.push(id)
    return id
  }

  // Color palette — slate tones
  const t = '#0f172a'   // text
  const s = '#64748b'   // secondary
  const m = '#94a3b8'   // muted
  const bd = '#e2e8f0'  // border
  const card = { backgroundColor: '#ffffff', borderRadius: 12, border: `1px solid ${bd}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
  // Clear default div styling for layout containers
  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // ════════════════════════════════════════════
  // Page Wrapper — single flex column, centered
  // ════════════════════════════════════════════
  const W = 400
  const page = add('div', store.rootId, {
    name: 'Page',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, paddingTop: 40, paddingRight: 40, paddingBottom: 40, paddingLeft: 40, alignItems: 'center' },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // Form Container
  // ════════════════════════════════════════════
  const formContainer = add('div', page, {
    name: 'Form Container',
    style: { ...rel, width: 'auto', height: 'auto', ...card },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 20, paddingTop: 32, paddingRight: 32, paddingBottom: 32, paddingLeft: 32, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (!formContainer) return

  // ── Header ──
  const header = add('div', formContainer, {
    name: 'Header',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (header) {
    add('text', header, { name: 'Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: 'Sign in to your account' } })
    add('text', header, { name: 'Subtitle', style: { ...rel, fontSize: 14, color: s, textAlign: 'center' }, props: { content: 'Enter your email below to login' } })
  }

  // ── Email Field ──
  add('sc:label', formContainer, { name: 'Email Label', style: { ...rel }, props: { text: 'Email' }, sizing: { w: 'fill', h: 'hug' } })
  add('sc:input', formContainer, { name: 'Email Input', style: { ...rel, width: undefined }, props: { placeholder: 'name@example.com', type: 'text' }, sizing: { w: 'fill', h: 'hug' } })

  // ── Password Field ──
  add('sc:label', formContainer, { name: 'Password Label', style: { ...rel }, props: { text: 'Password' }, sizing: { w: 'fill', h: 'hug' } })
  add('sc:input', formContainer, { name: 'Password Input', style: { ...rel, width: undefined }, props: { placeholder: '••••••••', type: 'password' }, sizing: { w: 'fill', h: 'hug' } })

  // ── Remember Row ──
  const rememberRow = add('div', formContainer, {
    name: 'Remember Row',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center', justifyContent: 'space-between' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (rememberRow) {
    add('sc:checkbox', rememberRow, { name: 'Remember Me', style: { ...rel }, props: { label: 'Remember me', checked: false } })
    add('text', rememberRow, { name: 'Forgot Password', style: { ...rel, fontSize: 13, color: '#3b82f6', cursor: 'pointer' }, props: { content: 'Forgot password?' } })
  }

  // ── Sign In Button ──
  add('sc:button', formContainer, { name: 'Sign In', style: { ...rel, width: undefined }, props: { label: 'Sign in', variant: 'default', size: 'default' }, sizing: { w: 'fill', h: 'hug' } })

  // ── Separator ──
  add('sc:separator', formContainer, { name: 'Separator', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'hug' } })

  // ── Social Login Label ──
  add('text', formContainer, { name: 'Social Login Label', style: { ...rel, fontSize: 12, color: m, textAlign: 'center' }, props: { content: 'Or continue with' }, sizing: { w: 'fill', h: 'hug' } })

  // ── Social Row ──
  const socialRow = add('div', formContainer, {
    name: 'Social Row',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (socialRow) {
    add('sc:button', socialRow, { name: 'Google', style: { ...rel, width: undefined }, props: { label: 'Google', variant: 'outline', size: 'default' }, sizing: { w: 'fill', h: 'hug' } })
    add('sc:button', socialRow, { name: 'GitHub', style: { ...rel, width: undefined }, props: { label: 'GitHub', variant: 'outline', size: 'default' }, sizing: { w: 'fill', h: 'hug' } })
  }

  // ── Sign Up Link ──
  add('text', formContainer, { name: 'Sign Up Link', style: { ...rel, fontSize: 13, color: s, textAlign: 'center' }, props: { content: "Don't have an account? Sign up" }, sizing: { w: 'fill', h: 'hug' } })
}

function getDefaultProps(type: ElementType): Record<string, unknown> {
  switch (type) {
    case "text":
      return { content: "Text" }
    case "image":
      return { src: "", alt: "Image" }
    case "button":
      return { label: "Button" }
    case "input":
      return { placeholder: "Enter text..." }
    case "sc:button":
      return { label: "Button", variant: "default", size: "default" }
    case "sc:card":
      return { title: "Card Title", description: "Card description", content: "Card content here." }
    case "sc:input":
      return { placeholder: "Type something...", type: "text" }
    case "sc:badge":
      return { label: "Badge", variant: "default" }
    case "sc:checkbox":
      return { label: "Agree to terms", checked: false }
    case "sc:switch":
      return { label: "Enable notifications", checked: false }
    case "sc:label":
      return { text: "Label" }
    case "sc:textarea":
      return { placeholder: "Enter text...", rows: 3 }
    case "sc:avatar":
      return { src: "", fallback: "AB" }
    case "sc:separator":
      return { orientation: "horizontal" }
    case "sc:progress":
      return { value: 60 }
    case "sc:skeleton":
      return { variant: "line" }
    case "sc:slider":
      return { value: 50, min: 0, max: 100, step: 1 }
    case "sc:tabs":
      return { tabs: ["Account", "Password", "Settings"], activeTab: "Account" }
    case "sc:alert":
      return { title: "Heads up!", description: "You can add components to your app.", variant: "default" }
    case "sc:toggle":
      return { label: "Bold", pressed: false }
    case "sc:select":
      return { placeholder: "Select option", options: ["Option 1", "Option 2", "Option 3"] }
    case "sc:table":
      return { headers: ["Name", "Status", "Amount"], rows: [["Alice", "Active", "₩250,000"], ["Bob", "Pending", "₩150,000"], ["Charlie", "Active", "₩350,000"]] }
    case "sc:accordion":
      return { items: [{ title: "Is it accessible?", content: "Yes. It adheres to the WAI-ARIA design pattern." }, { title: "Is it styled?", content: "Yes. It comes with default styles." }] }
    case "sc:radio-group":
      return { label: "Plan", options: ["Free", "Pro", "Enterprise"], value: "Free" }
    default:
      return {}
  }
}
