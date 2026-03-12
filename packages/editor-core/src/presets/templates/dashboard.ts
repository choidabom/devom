import { nanoid } from "nanoid"
import type { DocumentStore } from "../../stores/DocumentStore"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement, type ElementType, type SizingProps } from "../../types"

export function buildDashboard(store: DocumentStore): void {
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
  // Page Wrapper — single flex column, natural flow
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
