import { nanoid } from "nanoid"
import type { DocumentStore } from "../../stores/DocumentStore"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement, type ElementType, type SizingProps } from "../../types"

export function buildSettingsPage(store: DocumentStore): void {
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
  const bd = '#e2e8f0'  // border
  // Clear default div styling for layout containers
  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // ════════════════════════════════════════════
  // Page Wrapper — single flex column
  // ════════════════════════════════════════════
  const W = 760
  const page = add('div', store.rootId, {
    name: 'Page',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'stretch' },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // Header
  // ════════════════════════════════════════════
  const header = add('div', page, {
    name: 'Header',
    style: { ...rel, width: 'auto', height: 'auto', ...box, borderBottom: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 4, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (header) {
    add('text', header, { name: 'Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t }, props: { content: 'Settings' } })
    add('text', header, { name: 'Subtitle', style: { ...rel, fontSize: 14, color: s }, props: { content: 'Manage your account settings and preferences.' } })
  }

  // ════════════════════════════════════════════
  // Tabs
  // ════════════════════════════════════════════
  add('sc:tabs', page, {
    name: 'Navigation',
    style: { ...rel, width: 'auto', paddingLeft: 24, paddingRight: 24 },
    props: { tabs: ['Profile', 'Notifications', 'Appearance'], activeTab: 'Profile' },
    sizing: { w: 'fill', h: 'hug' },
  })

  // ════════════════════════════════════════════
  // Content Area
  // ════════════════════════════════════════════
  const content = add('div', page, {
    name: 'Content',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 24, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (!content) return

  // ── Avatar Row ──
  const avatarRow = add('div', content, {
    name: 'Avatar Row',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (avatarRow) {
    add('sc:avatar', avatarRow, { name: 'Avatar', style: { ...rel }, props: { fallback: 'JD' } })
    const userInfo = add('div', avatarRow, {
      name: 'User Info',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'start' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (userInfo) {
      add('text', userInfo, { name: 'User Name', style: { ...rel, fontSize: 16, fontWeight: 600, color: t }, props: { content: 'John Doe' } })
      add('text', userInfo, { name: 'User Email', style: { ...rel, fontSize: 13, color: s }, props: { content: 'john@example.com' } })
    }
    add('sc:button', avatarRow, { name: 'Change Avatar', style: { ...rel }, props: { label: 'Change avatar', variant: 'outline', size: 'sm' } })
  }

  // ── Separator ──
  add('sc:separator', content, { name: 'Separator 1', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'hug' } })

  // ── Profile Form ──
  const form = add('div', content, {
    name: 'Form',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, ...noPad, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (form) {
    // Name Row
    const nameRow = add('div', form, {
      name: 'Name Row',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (nameRow) {
      add('sc:label', nameRow, { name: 'Name Label', style: { ...rel }, props: { text: 'Name' } })
      add('sc:input', nameRow, { name: 'Name Input', style: { ...rel, width: undefined }, props: { placeholder: 'John Doe', type: 'text' }, sizing: { w: 'fill', h: 'hug' } })
    }

    // Email Row
    const emailRow = add('div', form, {
      name: 'Email Row',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (emailRow) {
      add('sc:label', emailRow, { name: 'Email Label', style: { ...rel }, props: { text: 'Email' } })
      add('sc:input', emailRow, { name: 'Email Input', style: { ...rel, width: undefined }, props: { placeholder: 'john@example.com', type: 'email' }, sizing: { w: 'fill', h: 'hug' } })
    }

    // Bio Row
    const bioRow = add('div', form, {
      name: 'Bio Row',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (bioRow) {
      add('sc:label', bioRow, { name: 'Bio Label', style: { ...rel }, props: { text: 'Bio' } })
      add('sc:textarea', bioRow, { name: 'Bio Textarea', style: { ...rel, width: undefined }, props: { placeholder: 'Tell us about yourself...', rows: 3 }, sizing: { w: 'fill', h: 'hug' } })
    }
  }

  // ── Separator ──
  add('sc:separator', content, { name: 'Separator 2', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'hug' } })

  // ── Button Row ──
  const buttonRow = add('div', content, {
    name: 'Button Row',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center', justifyContent: 'end' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (buttonRow) {
    add('sc:button', buttonRow, { name: 'Cancel', style: { ...rel }, props: { label: 'Cancel', variant: 'outline', size: 'default' } })
    add('sc:button', buttonRow, { name: 'Save', style: { ...rel }, props: { label: 'Save changes', variant: 'default', size: 'default' } })
  }

  // ── Notifications Section ──
  const notifSection = add('div', content, {
    name: 'Notifications Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 8, ...noPad, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (notifSection) {
    add('text', notifSection, { name: 'Notif Title', style: { ...rel, fontSize: 16, fontWeight: 600, color: t }, props: { content: 'Email Notifications' } })
    add('text', notifSection, { name: 'Notif Desc', style: { ...rel, fontSize: 13, color: s }, props: { content: 'Configure how you receive notifications.' } })
  }

  // ── Notification Toggles ──
  const toggles = add('div', content, {
    name: 'Toggles',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 12, ...noPad, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (toggles) {
    const switches = [
      { label: 'Marketing emails', checked: false },
      { label: 'Security alerts', checked: true },
      { label: 'Product updates', checked: true },
      { label: 'Weekly digest', checked: false },
    ]
    for (const sw of switches) {
      const row = add('div', toggles, {
        name: `${sw.label} Row`,
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex',
        layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center', justifyContent: 'space-between' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (row) {
        add('sc:switch', row, { name: sw.label, style: { ...rel }, props: { label: sw.label, checked: sw.checked } })
      }
    }
  }
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
