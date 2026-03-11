import { makeAutoObservable, observable } from "mobx"
import { nanoid } from "nanoid"
import type { CSSProperties } from "react"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_GRID_PROPS, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type CanvasMode, type PageViewportWidth, type EditorElement, type ElementType, type GridProps, type LayoutProps, type SectionProps, type SectionRole, type SizingProps } from "../types"
import { createSectionPreset } from "../presets/sectionPresets"

export class DocumentStore {
  elements = observable.map<string, EditorElement>()
  rootId = ""
  name = "Untitled"
  viewport = { width: 1280, height: 800 }
  canvasMode: CanvasMode = 'canvas'
  pageViewport: PageViewportWidth = 1280

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
      canvasPosition: null,
    })
  }

  private initDemo() {
    const root = this.elements.get(this.rootId)
    if (!root) return

    const rel = { position: 'relative' as const, left: undefined, top: undefined }
    const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
    const add = (
      type: ElementType,
      parentId: string,
      overrides: { name?: string; style?: Partial<EditorElement['style']>; props?: Record<string, unknown>; layoutMode?: 'none' | 'flex'; layoutProps?: Partial<EditorElement['layoutProps']>; sizing?: Partial<SizingProps> } = {},
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
    // Page Wrapper — single flex column, natural flow
    // ════════════════════════════════════════════
    const W = 760
    const page = add('div', this.rootId, {
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
      layoutProps: { direction: 'row', gap: 0, paddingTop: 20, paddingRight: 24, paddingBottom: 20, paddingLeft: 24, alignItems: 'center', justifyContent: 'space-between' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (header) {
      const hl = add('div', header, {
        name: 'Header Left',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'column', gap: 2, ...noPad, alignItems: 'start' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (hl) {
        add('text', hl, { name: 'Title', style: { ...rel, fontSize: 22, fontWeight: 700, color: t }, props: { content: 'Dashboard' } })
        add('text', hl, { name: 'Subtitle', style: { ...rel, fontSize: 13, color: s }, props: { content: 'Welcome back, here\'s what\'s happening today.' } })
      }
      const hr = add('div', header, {
        name: 'Header Right',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 10, ...noPad, alignItems: 'center' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (hr) {
        add('sc:input', hr, { name: 'Search', style: { ...rel, width: 180 }, props: { placeholder: 'Search...', type: 'text' } })
        add('sc:button', hr, { name: 'Download', style: { ...rel }, props: { label: 'Download', variant: 'outline', size: 'sm' } })
        add('sc:button', hr, { name: 'New Report', style: { ...rel }, props: { label: '+ New Report', variant: 'default', size: 'sm' } })
        add('sc:avatar', hr, { name: 'Avatar', style: { ...rel }, props: { fallback: 'JD' } })
      }
    }

    // ════════════════════════════════════════════
    // Tabs Navigation
    // ════════════════════════════════════════════
    add('sc:tabs', page, {
      name: 'Navigation',
      style: { ...rel, width: 'auto', paddingLeft: 24, paddingRight: 24 },
      props: { tabs: ['Overview', 'Analytics', 'Reports', 'Notifications'], activeTab: 'Overview' },
    })

    // ════════════════════════════════════════════
    // Content area (with padding)
    // ════════════════════════════════════════════
    const content = add('div', page, {
      name: 'Content',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 16, paddingTop: 16, paddingRight: 24, paddingBottom: 16, paddingLeft: 24, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!content) return

    // ── Stats Row — 4 metric cards ──
    const statsRow = add('div', content, {
      name: 'Stats Row',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (statsRow) {
      const stats = [
        { name: 'Total Revenue', value: '$45,231.89', badge: '+20.1%', badgeVariant: 'default' },
        { name: 'Subscriptions', value: '+2,350', badge: '+180.1%', badgeVariant: 'default' },
        { name: 'Sales', value: '+12,234', badge: '+19%', badgeVariant: 'secondary' },
        { name: 'Active Now', value: '573', badge: 'Live', badgeVariant: 'destructive' },
      ]
      for (const st of stats) {
        const sc = add('div', statsRow, {
          name: st.name,
          style: { ...rel, width: 'auto', height: 'auto', ...card },
          layoutMode: 'flex',
          layoutProps: { direction: 'column', gap: 6, paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, alignItems: 'start' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (sc) {
          const topRow = add('div', sc, {
            name: `${st.name} Top`,
            style: { ...rel, width: 'auto', height: 'auto', ...box },
            layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center', justifyContent: 'space-between' },
            sizing: { w: 'fill', h: 'hug' },
          })
          if (topRow) {
            add('text', topRow, { name: `${st.name} Label`, style: { ...rel, fontSize: 12, fontWeight: 500, color: s }, props: { content: st.name } })
            add('sc:badge', topRow, { name: `${st.name} Badge`, style: { ...rel }, props: { label: st.badge, variant: st.badgeVariant } })
          }
          add('text', sc, { name: `${st.name} Value`, style: { ...rel, fontSize: 24, fontWeight: 700, color: t }, props: { content: st.value } })
          add('sc:progress', sc, { name: `${st.name} Bar`, style: { ...rel, width: undefined }, props: { value: Math.floor(Math.random() * 40) + 60 } })
        }
      }
    }

    // ── Content Row — Table + Right Column ──
    const contentRow = add('div', content, {
      name: 'Content Row',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (contentRow) {
      // Recent Sales table
      const tblCard = add('div', contentRow, {
        name: 'Recent Sales',
        style: { ...rel, width: 'auto', height: 'auto', ...card },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 8, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20, alignItems: 'stretch' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (tblCard) {
        const tblHeader = add('div', tblCard, {
          name: 'Table Header',
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center', justifyContent: 'space-between' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (tblHeader) {
          const thleft = add('div', tblHeader, {
            name: 'Table Header Left',
            style: { ...rel, width: 'auto', height: 'auto', ...box },
            layoutMode: 'flex', layoutProps: { direction: 'column', gap: 2, ...noPad, alignItems: 'start' },
            sizing: { w: 'hug', h: 'hug' },
          })
          if (thleft) {
            add('text', thleft, { name: 'Table Title', style: { ...rel, fontSize: 16, fontWeight: 600, color: t }, props: { content: 'Recent Sales' } })
            add('text', thleft, { name: 'Table Desc', style: { ...rel, fontSize: 12, color: s }, props: { content: 'You made 265 sales this month.' } })
          }
          add('sc:button', tblHeader, { name: 'View All', style: { ...rel }, props: { label: 'View All', variant: 'outline', size: 'sm' } })
        }
        add('sc:table', tblCard, {
          name: 'Sales Table',
          style: { ...rel, width: undefined },
          props: {
            headers: ['Customer', 'Email', 'Status', 'Amount'],
            rows: [
              ['Olivia Martin', 'olivia@email.com', 'Completed', '+$1,999.00'],
              ['Jackson Lee', 'jackson@email.com', 'Completed', '+$39.00'],
              ['Isabella Nguyen', 'isabella@email.com', 'Processing', '+$299.00'],
              ['William Kim', 'will@email.com', 'Pending', '+$99.00'],
            ],
          },
        })
      }

      // Right column — Team + Settings
      const rightCol = add('div', contentRow, {
        name: 'Right Column',
        style: { ...rel, width: 260, height: 'auto', ...box },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 16, ...noPad, alignItems: 'stretch' },
      })
      if (rightCol) {
        // Team card
        const teamCard = add('div', rightCol, {
          name: 'Team',
          style: { ...rel, width: 'auto', height: 'auto', ...card },
          layoutMode: 'flex',
          layoutProps: { direction: 'column', gap: 12, paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, alignItems: 'stretch' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (teamCard) {
          add('text', teamCard, { name: 'Team Title', style: { ...rel, fontSize: 15, fontWeight: 600, color: t }, props: { content: 'Team Members' } })
          const members = [
            { name: 'Sofia Davis', initials: 'SD', role: 'Owner' },
            { name: 'Jackson Lee', initials: 'JL', role: 'Developer' },
            { name: 'Isabella Nguyen', initials: 'IN', role: 'Designer' },
          ]
          for (const member of members) {
            const row = add('div', teamCard, {
              name: `Member ${member.name}`,
              style: { ...rel, width: 'auto', height: 'auto', ...box },
              layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
              sizing: { w: 'fill', h: 'hug' },
            })
            if (row) {
              add('sc:avatar', row, { name: `${member.name} Avatar`, style: { ...rel }, props: { fallback: member.initials } })
              const info = add('div', row, {
                name: `${member.name} Info`,
                style: { ...rel, width: 'auto', height: 'auto', ...box },
                layoutMode: 'flex', layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'start' },
                sizing: { w: 'fill', h: 'hug' },
              })
              if (info) {
                add('text', info, { name: `${member.name} Name`, style: { ...rel, fontSize: 13, fontWeight: 500, color: t }, props: { content: member.name } })
                add('text', info, { name: `${member.name} Role`, style: { ...rel, fontSize: 11, color: s }, props: { content: member.role } })
              }
            }
          }
          add('sc:button', teamCard, { name: 'Invite', style: { ...rel }, props: { label: '+ Invite Member', variant: 'outline', size: 'sm' } })
        }

        // Notification Settings
        add('sc:switch', rightCol, { name: 'Notifications', style: { ...rel, ...card, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }, props: { label: 'Email notifications', checked: true } })
      }
    }

    // ── Alert Banner ──
    add('sc:alert', content, {
      name: 'Notice',
      style: { ...rel, width: 'auto' },
      sizing: { w: 'fill', h: 'hug' },
      props: { title: 'Scheduled Maintenance', description: 'System will be down on 3/15 02:00–04:00 UTC. Please save your work.', variant: 'default' },
    })

    // ── Footer ──
    const footer = add('div', page, {
      name: 'Footer',
      style: { ...rel, width: 'auto', height: 'auto', ...box, borderTop: `1px solid ${bd}` },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 0, paddingTop: 16, paddingRight: 24, paddingBottom: 16, paddingLeft: 24, alignItems: 'center', justifyContent: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (footer) {
      add('text', footer, { name: 'Copyright', style: { ...rel, fontSize: 12, color: m }, props: { content: '© 2026 Acme Inc. All rights reserved.' } })
    }
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

  addElement(type: ElementType, parentId?: string, initialProps?: Record<string, unknown>): string {
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
      props: { ...this.getDefaultProps(type), ...(initialProps ?? {}) },
      locked: false,
      visible: true,
      layoutMode: 'none' as const,
      layoutProps: { ...DEFAULT_LAYOUT_PROPS },
      sizing: { ...DEFAULT_SIZING },
      canvasPosition: null,
    }

    // Page Mode: root children default to flow layout
    if (this.canvasMode === 'page' && targetParentId === this.rootId) {
      const { position, left, top, ...rest } = element.style
      element.style = { ...rest, position: 'relative' as const }
      element.sizing = { w: 'fill', h: 'hug' }
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
      canvasPosition: element.canvasPosition ?? null,
    })
    if (element.parentId) {
      const parent = this.elements.get(element.parentId)
      if (parent && !parent.children.includes(element.id)) {
        parent.children.push(element.id)
      }
    }
  }

  addSection(role: SectionRole, index?: number) {
    const preset = createSectionPreset(role)
    const sectionId = nanoid()
    const root = this.elements.get(this.rootId)
    if (!root) return

    const section: EditorElement = {
      ...preset.section,
      id: sectionId,
      parentId: this.rootId,
    }
    this.elements.set(sectionId, section)

    for (const childTemplate of preset.children) {
      const childId = nanoid()
      const child: EditorElement = {
        ...childTemplate,
        id: childId,
        parentId: sectionId,
      }
      this.elements.set(childId, child)
      section.children = [...section.children, childId]
    }

    if (index != null && index < root.children.length) {
      const newChildren = [...root.children]
      newChildren.splice(index, 0, sectionId)
      root.children = newChildren
    } else {
      root.children = [...root.children, sectionId]
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

  /** Collect element + all descendants as deep clones */
  collectSubtree(id: string): EditorElement[] {
    const el = this.elements.get(id)
    if (!el) return []
    const result: EditorElement[] = [JSON.parse(JSON.stringify(el))]
    for (const childId of el.children) {
      result.push(...this.collectSubtree(childId))
    }
    return result
  }

  /**
   * Clone a flat list of elements (with parent-child relationships) into the store.
   * Top-level elements (whose parentId is not in the set) go under targetParentId.
   * Children are recursively cloned with new IDs, preserving the tree structure.
   */
  private _cloneTree(elements: EditorElement[], targetParentId: string, offset: number): string[] {
    const target = this.elements.get(targetParentId)
    if (!target || elements.length === 0) return []

    // Build old→new ID map
    const idMap = new Map<string, string>()
    for (const el of elements) {
      idMap.set(el.id, nanoid())
    }

    // Identify top-level elements (parent not in the copied set)
    const copiedIds = new Set(elements.map(e => e.id))
    const topLevelIds = new Set(
      elements.filter(el => !el.parentId || !copiedIds.has(el.parentId)).map(e => e.id)
    )

    const newTopIds: string[] = []
    for (const el of elements) {
      const newId = idMap.get(el.id)!
      const isTop = topLevelIds.has(el.id)
      const newParentId = isTop ? targetParentId : idMap.get(el.parentId!)
      if (!newParentId) continue

      // When pasting to root in canvas mode, ensure absolute positioning
      const needsAbsolute = isTop && targetParentId === this.rootId && this.canvasMode === 'canvas'
      const style = {
        ...JSON.parse(JSON.stringify(el.style)),
        ...(isTop && typeof el.style.left === 'number' ? { left: el.style.left + offset } : {}),
        ...(isTop && typeof el.style.top === 'number' ? { top: el.style.top + offset } : {}),
      }
      if (needsAbsolute) {
        style.position = 'absolute'
        if (typeof style.left !== 'number') style.left = 100
        if (typeof style.top !== 'number') style.top = 100
      }

      const cloned: EditorElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId,
        parentId: newParentId,
        name: `${el.type}-${newId.slice(0, 4)}`,
        children: el.children.map(cid => idMap.get(cid)).filter(Boolean) as string[],
        style,
        canvasPosition: null,
      }

      this.elements.set(newId, cloned)
      if (isTop) {
        target.children.push(newId)
        newTopIds.push(newId)
      }
    }

    return newTopIds
  }

  pasteElements(elements: EditorElement[], offset = 20): string[] {
    return this._cloneTree(elements, this.rootId, offset)
  }

  duplicateElements(ids: string[], offset = 20): string[] {
    // Filter out elements whose ancestor is already in the set
    const idSet = new Set(ids)
    const topIds = ids.filter(id => {
      const el = this.elements.get(id)
      if (!el) return false
      let cur = el.parentId
      while (cur) {
        if (idSet.has(cur)) return false
        const p = this.elements.get(cur)
        cur = p?.parentId ?? null
      }
      return true
    })

    const newIds: string[] = []
    for (const id of topIds) {
      const el = this.elements.get(id)
      if (!el || el.locked || id === this.rootId || !el.parentId) continue
      const subtree = this.collectSubtree(id)
      const cloned = this._cloneTree(subtree, el.parentId, offset)
      newIds.push(...cloned)
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

  setLayoutMode(id: string, mode: 'none' | 'flex' | 'grid') {
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
    } else if (mode === 'grid') {
      if (!element.gridProps) {
        element.gridProps = { ...DEFAULT_GRID_PROPS }
      }
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

  updateGridProps(id: string, props: Partial<GridProps>) {
    const el = this.elements.get(id)
    if (!el || !el.gridProps) return
    el.gridProps = { ...el.gridProps, ...props }
  }

  updateSectionProps(id: string, props: Partial<SectionProps>) {
    const el = this.elements.get(id)
    if (!el) return
    el.sectionProps = { ...el.sectionProps, ...props }
  }

  setCanvasMode(mode: CanvasMode) {
    if (mode === this.canvasMode) return
    const root = this.elements.get(this.rootId)
    if (!root) return

    if (mode === 'page') {
      // Save absolute positions, sizing, width and switch to flow
      // Also propagate fill sizing to children of flex-row containers
      for (const childId of root.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        child.canvasPosition = {
          left: typeof child.style.left === 'number' ? child.style.left : 0,
          top: typeof child.style.top === 'number' ? child.style.top : 0,
          width: child.style.width,
          sizing: { ...child.sizing },
        }
        const { left, top, position, ...rest } = child.style
        child.style = { ...rest, position: 'relative' as const, width: '100%' }
        child.sizing = { w: 'fill', h: 'hug' }

        // For flex-row containers, make direct children fill equally
        if (child.layoutMode === 'flex' && child.layoutProps.direction === 'row') {
          for (const grandchildId of child.children) {
            const gc = this.elements.get(grandchildId)
            if (!gc) continue
            if (!gc.canvasPosition) {
              gc.canvasPosition = { left: 0, top: 0, width: gc.style.width, sizing: { ...gc.sizing } }
            }
            gc.sizing = { w: gc.sizing.w === 'hug' ? 'hug' : 'fill', h: gc.sizing.h === 'fixed' ? 'hug' : gc.sizing.h }
          }
        }
      }
      root.layoutMode = 'flex'
      root.layoutProps = {
        ...DEFAULT_LAYOUT_PROPS,
        direction: 'column',
        gap: 24,
        paddingTop: 24,
        paddingRight: 32,
        paddingBottom: 32,
        paddingLeft: 32,
        alignItems: 'stretch',
      }
      root.style = {
        ...root.style,
        width: this.pageViewport,
        height: undefined,
        minHeight: undefined,
        overflow: 'visible',
        backgroundColor: '#ffffff',
      }
    } else {
      // Restore absolute positions, sizing, and width (including grandchildren)
      for (const childId of root.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        const pos = child.canvasPosition ?? { left: 0, top: 0 }
        child.style = {
          ...child.style,
          position: 'absolute' as const,
          left: pos.left,
          top: pos.top,
          width: pos.width ?? child.style.width,
        }
        if (pos.sizing) {
          child.sizing = { ...pos.sizing }
        }
        // Restore grandchildren sizing
        for (const grandchildId of child.children) {
          const gc = this.elements.get(grandchildId)
          if (!gc || !gc.canvasPosition?.sizing) continue
          gc.sizing = { ...gc.canvasPosition.sizing }
          gc.canvasPosition = null
        }
        child.canvasPosition = null
      }
      root.layoutMode = 'none'
      root.layoutProps = { ...DEFAULT_LAYOUT_PROPS }
      root.style = {
        ...root.style,
        width: this.viewport.width,
        height: this.viewport.height,
        minHeight: undefined,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }
    }

    this.canvasMode = mode
  }

  setPageViewport(width: PageViewportWidth) {
    this.pageViewport = width
    if (this.canvasMode === 'page') {
      const root = this.elements.get(this.rootId)
      if (root) {
        root.style = { ...root.style, width }
      }
    }
  }

  reorderChild(parentId: string, childId: string, newIndex: number) {
    const parent = this.elements.get(parentId)
    if (!parent) return
    const oldIndex = parent.children.indexOf(childId)
    if (oldIndex === -1) return
    parent.children.splice(oldIndex, 1)
    parent.children.splice(newIndex, 0, childId)
  }

  private findLCA(ids: string[]): string | null {
    if (ids.length === 0) return null

    // Build path from each id to root
    const paths: string[][] = []
    for (const id of ids) {
      const path: string[] = []
      let current: string | null = id
      while (current) {
        path.unshift(current)
        const el = this.elements.get(current)
        if (!el) break
        current = el.parentId
      }
      paths.push(path)
    }

    // Find deepest common ancestor
    let lca = this.rootId
    const minLen = Math.min(...paths.map(p => p.length))
    for (let i = 0; i < minLen; i++) {
      const val = paths[0]?.[i]
      if (!val) break
      if (paths.every(p => p[i] === val)) {
        lca = val
      } else {
        break
      }
    }

    return lca
  }

  private isAncestor(ancestorId: string, descendantId: string): boolean {
    let current: string | null = descendantId
    while (current) {
      const el = this.elements.get(current)
      if (!el || !el.parentId) return false
      if (el.parentId === ancestorId) return true
      current = el.parentId
    }
    return false
  }

  groupElements(ids: string[], elementBounds: Record<string, { left: number; top: number; width: number; height: number }>): string | null {
    // Filter out root, locked elements
    const validIds = ids.filter(id => {
      const el = this.elements.get(id)
      return el && !el.locked && id !== this.rootId
    })
    if (validIds.length < 2) return null

    // Check: no element should be ancestor of another
    for (const a of validIds) {
      for (const b of validIds) {
        if (a !== b && this.isAncestor(a, b)) return null
      }
    }

    // Find LCA
    const lcaId = this.findLCA(validIds)
    if (!lcaId) return null

    // Validate all elements have bounds data
    for (const id of validIds) {
      if (!elementBounds[id]) return null
    }

    // Calculate bounding box from Canvas-measured element bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of validIds) {
      const b = elementBounds[id]!
      minX = Math.min(minX, b.left)
      minY = Math.min(minY, b.top)
      maxX = Math.max(maxX, b.left + b.width)
      maxY = Math.max(maxY, b.top + b.height)
    }

    // Create group container as child of LCA
    const groupId = nanoid()
    const lca = this.elements.get(lcaId)!

    const group: EditorElement = {
      id: groupId,
      type: 'div',
      name: `Group-${groupId.slice(0, 4)}`,
      parentId: lcaId,
      children: [],
      style: {
        position: 'absolute' as const,
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      props: {},
      locked: false,
      visible: true,
      layoutMode: 'none' as const,
      layoutProps: { ...DEFAULT_LAYOUT_PROPS },
      sizing: { ...DEFAULT_SIZING },
      canvasPosition: null,
    }
    this.elements.set(groupId, group)

    // Find the earliest index among selected elements in LCA's children
    let insertIndex = lca.children.length
    for (const id of validIds) {
      const el = this.elements.get(id)
      if (el && el.parentId === lcaId) {
        const idx = lca.children.indexOf(id)
        if (idx !== -1 && idx < insertIndex) insertIndex = idx
      }
    }

    // Remove selected elements from their parents and add to group
    for (const id of validIds) {
      const el = this.elements.get(id)
      if (!el) continue

      // Remove from old parent
      const oldParent = el.parentId ? this.elements.get(el.parentId) : undefined
      if (oldParent) {
        oldParent.children = oldParent.children.filter(c => c !== id)
      }

      // Convert coordinates: use Canvas-measured bounds relative to group
      const b = elementBounds[id]
      const left = b ? b.left - minX : 0
      const top = b ? b.top - minY : 0
      el.style = {
        ...el.style,
        position: 'absolute' as const,
        left,
        top,
      }

      el.parentId = groupId
      group.children.push(id)
    }

    // Insert group into LCA's children at the computed position
    lca.children = [
      ...lca.children.slice(0, insertIndex),
      groupId,
      ...lca.children.slice(insertIndex),
    ]

    return groupId
  }

  /**
   * Ungroup selected elements.
   * - If a selected element is a child (has parent != root): detach from parent, move to grandparent
   * - If a selected element is a container with children: move all children to parent, then delete container
   * Returns the ids that should be selected after the operation.
   */
  ungroupElements(ids: string[]): string[] {
    const newSelection: string[] = []

    for (const id of ids) {
      const element = this.elements.get(id)
      if (!element || id === this.rootId) continue

      const hasChildren = element.children.length > 0

      if (hasChildren) {
        // Container selected: move only direct children to parent, then delete container
        const parent = element.parentId ? this.elements.get(element.parentId) : undefined
        if (!parent) continue

        const containerIndex = parent.children.indexOf(id)
        if (containerIndex === -1) continue

        const directChildIds = [...element.children]

        // Update each direct child's parentId and style
        for (const childId of directChildIds) {
          const child = this.elements.get(childId)
          if (!child) continue

          child.parentId = parent.id

          if (parent.layoutMode === 'flex' || parent.layoutMode === 'grid') {
            const { position, left, top, ...rest } = child.style
            child.style = { ...rest, position: 'relative' as const }
          } else {
            child.style = { ...child.style, position: 'absolute' as const }
          }

          newSelection.push(childId)
        }

        // Replace container with its direct children in parent (new array for MobX)
        const before = parent.children.slice(0, containerIndex)
        const after = parent.children.slice(containerIndex + 1)
        parent.children = [...before, ...directChildIds, ...after]

        // Delete the container only (children already reparented)
        element.children = []
        this.elements.delete(id)
      } else {
        // Child selected: detach from parent, move to grandparent
        const parent = element.parentId ? this.elements.get(element.parentId) : undefined
        if (!parent || parent.id === this.rootId) continue

        const grandparent = parent.parentId ? this.elements.get(parent.parentId) : undefined
        if (!grandparent) continue

        // Remove from parent (new array for MobX)
        parent.children = parent.children.filter(cid => cid !== id)

        // Insert into grandparent right after the parent (new array for MobX)
        const parentIndex = grandparent.children.indexOf(parent.id)
        const gpBefore = grandparent.children.slice(0, parentIndex + 1)
        const gpAfter = grandparent.children.slice(parentIndex + 1)
        grandparent.children = [...gpBefore, id, ...gpAfter]
        element.parentId = grandparent.id

        if (grandparent.layoutMode === 'flex' || grandparent.layoutMode === 'grid') {
          const { position, left, top, ...rest } = element.style
          element.style = { ...rest, position: 'relative' as const }
        } else {
          element.style = { ...element.style, position: 'absolute' as const }
        }

        newSelection.push(id)
      }
    }

    return newSelection
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
        canvasPosition: el.canvasPosition ?? null,
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
