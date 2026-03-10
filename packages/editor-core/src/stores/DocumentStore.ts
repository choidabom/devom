import { makeAutoObservable, observable } from "mobx"
import { nanoid } from "nanoid"
import type { CSSProperties } from "react"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement, type ElementType, type LayoutProps, type SizingProps } from "../types"

export class DocumentStore {
  elements = observable.map<string, EditorElement>()
  rootId = ""
  name = "Untitled"
  viewport = { width: 1280, height: 720 }

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    this.initRoot()
    this.initDemo()
  }

  private initRoot() {
    const rootId = nanoid()
    this.rootId = rootId
    this.elements.set(rootId, {
      id: rootId,
      type: "div",
      name: "Root",
      parentId: null,
      children: [],
      style: {
        position: "relative",
        width: this.viewport.width,
        height: this.viewport.height,
        backgroundColor: "#ffffff",
        overflow: "hidden",
      },
      props: {},
      locked: true,
      visible: true,
      layoutMode: 'none' as const,
      layoutProps: { ...DEFAULT_LAYOUT_PROPS },
      sizing: { ...DEFAULT_SIZING },
    })
  }

  private initDemo() {
    const root = this.elements.get(this.rootId)
    if (!root) return

    const add = (
      type: ElementType,
      parentId: string,
      overrides: { name?: string; style?: Partial<EditorElement['style']>; props?: Record<string, unknown>; layoutMode?: 'none' | 'flex'; layoutProps?: Partial<EditorElement['layoutProps']> } = {},
    ): string => {
      const id = nanoid()
      const parent = this.elements.get(parentId)
      if (!parent) return ''
      this.elements.set(id, {
        id,
        type,
        name: overrides.name ?? `${type}-${id.slice(0, 4)}`,
        parentId,
        children: [],
        style: { ...DEFAULT_ELEMENT_STYLE[type], ...overrides.style },
        props: { ...this.getDefaultProps(type), ...overrides.props },
        locked: false,
        visible: true,
        layoutMode: overrides.layoutMode ?? 'none',
        layoutProps: { ...DEFAULT_LAYOUT_PROPS, ...overrides.layoutProps },
        sizing: { ...DEFAULT_SIZING },
      })
      parent.children.push(id)
      return id
    }

    // Color palette
    const c = { card: '#ffffff', text: '#0f172a', sub: '#64748b', border: '#e2e8f0' }

    // --- Header Section ---
    add('text', this.rootId, { name: 'Title', style: { left: 20, top: 16, fontSize: 18, fontWeight: 700, color: c.text }, props: { content: 'Dashboard' } })
    add('text', this.rootId, { name: 'Description', style: { left: 20, top: 42, fontSize: 12, color: c.sub }, props: { content: 'Welcome back! Here is your workspace overview.' } })

    // --- Login Card (Auto Layout Column) ---
    const loginCard = add('div', this.rootId, {
      name: 'Login Card',
      style: { left: 20, top: 70, width: 230, height: 'auto', backgroundColor: c.card, borderRadius: 16, border: `1px solid ${c.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 10, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20, alignItems: 'stretch', justifyContent: 'start' },
    })
    if (loginCard) {
      add('sc:label', loginCard, { name: 'Email Label', style: { position: 'relative' }, props: { text: 'Email' } })
      add('sc:input', loginCard, { name: 'Email Input', style: { position: 'relative', width: undefined }, props: { placeholder: 'you@example.com', type: 'email' } })
      add('sc:label', loginCard, { name: 'PW Label', style: { position: 'relative' }, props: { text: 'Password' } })
      add('sc:input', loginCard, { name: 'PW Input', style: { position: 'relative', width: undefined }, props: { placeholder: '••••••••', type: 'password' } })
      add('sc:button', loginCard, { name: 'Login Btn', style: { position: 'relative' }, props: { label: 'Sign In', variant: 'default' } })
      add('sc:separator', loginCard, { name: 'Divider', style: { position: 'relative', width: undefined } })
      add('sc:checkbox', loginCard, { name: 'Remember', style: { position: 'relative' }, props: { label: 'Remember me', checked: false } })
    }

    // --- Settings Card (Form Controls) ---
    const settingsCard = add('div', this.rootId, {
      name: 'Settings Card',
      style: { left: 270, top: 70, width: 230, height: 'auto', backgroundColor: c.card, borderRadius: 16, border: `1px solid ${c.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 12, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20, alignItems: 'stretch', justifyContent: 'start' },
    })
    if (settingsCard) {
      add('text', settingsCard, { name: 'Settings Title', style: { position: 'relative', fontSize: 15, fontWeight: 700, color: c.text }, props: { content: 'Preferences' } })
      add('sc:switch', settingsCard, { name: 'Push Toggle', style: { position: 'relative' }, props: { label: 'Push notifications', checked: true } })
      add('sc:switch', settingsCard, { name: 'Email Toggle', style: { position: 'relative' }, props: { label: 'Email digest', checked: false } })
      add('sc:separator', settingsCard, { name: 'Settings Sep', style: { position: 'relative', width: undefined } })
      add('sc:select', settingsCard, { name: 'Language Select', style: { position: 'relative', width: undefined }, props: { placeholder: 'Language', options: ['English', 'Korean', 'Japanese'] } })
      add('sc:slider', settingsCard, { name: 'Volume', style: { position: 'relative', width: undefined }, props: { value: 70, min: 0, max: 100 } })
      add('sc:radio-group', settingsCard, { name: 'Theme Radio', style: { position: 'relative' }, props: { label: 'Theme', options: ['Light', 'Dark', 'System'], value: 'Light' } })
    }

    // --- Status Badges ---
    add('sc:badge', this.rootId, { name: 'Badge Active', style: { left: 20, top: 420 }, props: { label: 'Active', variant: 'default' } })
    add('sc:badge', this.rootId, { name: 'Badge Pending', style: { left: 80, top: 420 }, props: { label: 'Pending', variant: 'secondary' } })
    add('sc:badge', this.rootId, { name: 'Badge Error', style: { left: 150, top: 420 }, props: { label: 'Error', variant: 'destructive' } })
    add('sc:badge', this.rootId, { name: 'Badge Info', style: { left: 210, top: 420 }, props: { label: 'Info', variant: 'outline' } })

    // --- Alert ---
    add('sc:alert', this.rootId, { name: 'Notice', style: { left: 20, top: 452, width: 230 }, props: { title: 'Scheduled Maintenance', description: 'System will be down on 3/15 02:00–04:00 UTC for upgrades.', variant: 'default' } })

    // --- Progress ---
    add('sc:progress', this.rootId, { name: 'Storage Progress', style: { left: 270, top: 452, width: 230 }, props: { value: 75 } })

    // --- Table ---
    add('sc:table', this.rootId, {
      name: 'Members Table',
      style: { left: 20, top: 540, width: 480 },
      props: {
        headers: ['Name', 'Role', 'Status'],
        rows: [['Alice Kim', 'Admin', 'Active'], ['Bob Park', 'Editor', 'Pending'], ['Carol Lee', 'Viewer', 'Active']],
      },
    })

    // --- Bottom Row (Misc) ---
    add('sc:avatar', this.rootId, { name: 'User Avatar', style: { left: 270, top: 486 }, props: { fallback: 'AK' } })
    add('sc:skeleton', this.rootId, { name: 'Loading', style: { left: 310, top: 486, width: 190, height: 20 } })
    add('sc:toggle', this.rootId, { name: 'Bookmark', style: { left: 310, top: 512 }, props: { label: '★ Bookmark' } })
  }

  get root(): EditorElement | undefined {
    return this.elements.get(this.rootId)
  }

  getElement(id: string): EditorElement | undefined {
    return this.elements.get(id)
  }

  getAllElements(): EditorElement[] {
    return Array.from(this.elements.values())
  }

  addElement(type: ElementType, parentId?: string): string {
    const id = nanoid()
    const targetParentId = parentId ?? this.rootId
    const parent = this.elements.get(targetParentId)
    if (!parent) return ""

    const element: EditorElement = {
      id,
      type,
      name: `${type}-${id.slice(0, 4)}`,
      parentId: targetParentId,
      children: [],
      style: { ...DEFAULT_ELEMENT_STYLE[type] },
      props: this.getDefaultProps(type),
      locked: false,
      visible: true,
      layoutMode: 'none' as const,
      layoutProps: { ...DEFAULT_LAYOUT_PROPS },
      sizing: { ...DEFAULT_SIZING },
    }

    this.elements.set(id, element)
    parent.children.push(id)
    return id
  }

  addElementFromRemote(element: EditorElement) {
    this.elements.set(element.id, {
      ...element,
      layoutMode: element.layoutMode ?? 'none',
      layoutProps: element.layoutProps ?? { ...DEFAULT_LAYOUT_PROPS },
      sizing: element.sizing ?? { ...DEFAULT_SIZING },
    })
    if (element.parentId) {
      const parent = this.elements.get(element.parentId)
      if (parent && !parent.children.includes(element.id)) {
        parent.children.push(element.id)
      }
    }
  }

  removeElement(id: string) {
    const element = this.elements.get(id)
    if (!element || id === this.rootId) return

    // Remove children recursively
    for (const childId of [...element.children]) {
      this.removeElement(childId)
    }

    // Remove from parent's children
    const parent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (parent) {
      const idx = parent.children.indexOf(id)
      if (idx !== -1) parent.children.splice(idx, 1)
    }

    this.elements.delete(id)
  }

  toggleLock(id: string) {
    const element = this.elements.get(id)
    if (!element || id === this.rootId) return
    element.locked = !element.locked
  }

  pasteElements(elements: EditorElement[], offset = 20): string[] {
    const newIds: string[] = []
    for (const el of elements) {
      const parentId = el.parentId ?? this.rootId
      const parent = this.elements.get(parentId) ?? this.elements.get(this.rootId)
      if (!parent) continue

      const newId = nanoid()
      const cloned: EditorElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId,
        parentId: parent.id,
        name: `${el.type}-${newId.slice(0, 4)}`,
        children: [],
        style: {
          ...JSON.parse(JSON.stringify(el.style)),
          ...(typeof el.style.left === "number" ? { left: el.style.left + offset } : {}),
          ...(typeof el.style.top === "number" ? { top: el.style.top + offset } : {}),
        },
        layoutMode: el.layoutMode ?? 'none',
        layoutProps: el.layoutProps ?? { ...DEFAULT_LAYOUT_PROPS },
        sizing: el.sizing ?? { ...DEFAULT_SIZING },
      }

      this.elements.set(newId, cloned)
      parent.children.push(newId)
      newIds.push(newId)
    }
    return newIds
  }

  duplicateElements(ids: string[], offset = 20): string[] {
    const newIds: string[] = []
    for (const id of ids) {
      const el = this.elements.get(id)
      if (!el || el.locked || id === this.rootId || !el.parentId) continue
      const parent = this.elements.get(el.parentId)
      if (!parent) continue

      const newId = nanoid()
      const cloned: EditorElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId,
        name: `${el.type}-${newId.slice(0, 4)}`,
        children: [],
        style: {
          ...JSON.parse(JSON.stringify(el.style)),
          ...(typeof el.style.left === "number" ? { left: el.style.left + offset } : {}),
          ...(typeof el.style.top === "number" ? { top: el.style.top + offset } : {}),
        },
        layoutMode: el.layoutMode ?? 'none',
        layoutProps: el.layoutProps ?? { ...DEFAULT_LAYOUT_PROPS },
        sizing: el.sizing ?? { ...DEFAULT_SIZING },
      }

      this.elements.set(newId, cloned)
      parent.children.push(newId)
      newIds.push(newId)
    }
    return newIds
  }

  updateStyle(id: string, style: Partial<CSSProperties>) {
    const element = this.elements.get(id)
    if (!element || element.locked) return
    Object.assign(element.style, style)
  }

  updateProps(id: string, props: Record<string, unknown>) {
    const element = this.elements.get(id)
    if (!element) return
    Object.assign(element.props, props)
  }

  moveElement(id: string, newParentId: string, index: number) {
    const element = this.elements.get(id)
    const newParent = this.elements.get(newParentId)
    if (!element || !newParent || id === this.rootId) return

    // Remove from old parent
    const oldParent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (oldParent) {
      const idx = oldParent.children.indexOf(id)
      if (idx !== -1) oldParent.children.splice(idx, 1)
    }

    // Add to new parent
    element.parentId = newParentId
    newParent.children.splice(index, 0, id)
  }

  setLayoutMode(id: string, mode: 'none' | 'flex') {
    const element = this.elements.get(id)
    if (!element || element.locked || id === this.rootId) return
    element.layoutMode = mode
    if (mode === 'flex') {
      element.layoutProps = { ...DEFAULT_LAYOUT_PROPS }
      for (const childId of element.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        const { position, left, top, ...rest } = child.style
        child.style = { ...rest, position: 'relative' as const }
      }
    } else {
      for (const childId of element.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        child.style = { ...child.style, position: 'absolute' as const, left: 0, top: 0 }
      }
    }
  }

  updateLayoutProps(id: string, props: Partial<LayoutProps>) {
    const element = this.elements.get(id)
    if (!element || element.layoutMode !== 'flex') return
    Object.assign(element.layoutProps, props)
  }

  updateSizing(id: string, sizing: Partial<SizingProps>) {
    const element = this.elements.get(id)
    if (!element) return
    Object.assign(element.sizing, sizing)
  }

  reorderChild(parentId: string, childId: string, newIndex: number) {
    const parent = this.elements.get(parentId)
    if (!parent) return
    const oldIndex = parent.children.indexOf(childId)
    if (oldIndex === -1) return
    parent.children.splice(oldIndex, 1)
    parent.children.splice(newIndex, 0, childId)
  }

  reparentElement(id: string, newParentId: string, index: number, dropPosition?: { x: number; y: number }) {
    const element = this.elements.get(id)
    const newParent = this.elements.get(newParentId)
    if (!element || !newParent || id === this.rootId) return

    const oldParent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (oldParent) {
      const idx = oldParent.children.indexOf(id)
      if (idx !== -1) oldParent.children.splice(idx, 1)
    }

    element.parentId = newParentId
    newParent.children.splice(index, 0, id)

    if (newParent.layoutMode === 'flex') {
      const { position, left, top, ...rest } = element.style
      element.style = { ...rest, position: 'relative' as const }
      element.sizing = { ...DEFAULT_SIZING }
    } else {
      element.style = {
        ...element.style,
        position: 'absolute' as const,
        left: dropPosition?.x ?? 0,
        top: dropPosition?.y ?? 0,
      }
    }
  }

  toSerializable(): { elements: Record<string, EditorElement>; rootId: string } {
    const elements: Record<string, EditorElement> = {}
    this.elements.forEach((el, key) => {
      elements[key] = JSON.parse(JSON.stringify(el))
    })
    return { elements, rootId: this.rootId }
  }

  loadFromSerializable(data: { elements: Record<string, EditorElement>; rootId: string }) {
    this.elements.clear()
    for (const [key, el] of Object.entries(data.elements)) {
      this.elements.set(key, {
        ...el,
        layoutMode: el.layoutMode ?? 'none',
        layoutProps: el.layoutProps ?? { ...DEFAULT_LAYOUT_PROPS },
        sizing: el.sizing ?? { ...DEFAULT_SIZING },
      })
    }
    this.rootId = data.rootId
  }

  private getDefaultProps(type: ElementType): Record<string, unknown> {
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
}
