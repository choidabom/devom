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

  // Color palette
  const t = '#0f172a'   // text
  const s = '#64748b'   // secondary
  const m = '#94a3b8'   // muted
  const bd = '#e2e8f0'  // border
  const card = { backgroundColor: '#ffffff', borderRadius: 12, border: `1px solid ${bd}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // ════════════════════════════════════════════
  // Page Wrapper — wider for better proportion
  // ════════════════════════════════════════════
  const W = 1080
  const page = add('div', store.rootId, {
    name: 'Page',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#f8fafc', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'stretch' },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // Header
  // ════════════════════════════════════════════
  const header = add('div', page, {
    name: 'Header',
    style: { ...rel, width: 'auto', height: 'auto', ...box, backgroundColor: '#ffffff', borderBottom: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 0, paddingTop: 16, paddingRight: 32, paddingBottom: 16, paddingLeft: 32, alignItems: 'center', justifyContent: 'space-between' },
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
      add('text', hl, { name: 'Title', style: { ...rel, fontSize: 20, fontWeight: 700, color: t }, props: { content: 'Dashboard' } })
      add('text', hl, { name: 'Subtitle', style: { ...rel, fontSize: 13, color: s }, props: { content: 'Track your metrics, manage your team.' } })
    }
    const hr = add('div', header, {
      name: 'Header Right',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (hr) {
      add('sc:input', hr, { name: 'Search', style: { ...rel, width: 200 }, props: { placeholder: 'Search...', type: 'text' } })
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
    style: { ...rel, width: 'auto', paddingLeft: 32, paddingRight: 32, backgroundColor: '#ffffff' },
    props: { tabs: ['Overview', 'Analytics', 'Reports', 'Notifications'], activeTab: 'Overview' },
  })

  // ════════════════════════════════════════════
  // Content area
  // ════════════════════════════════════════════
  const content = add('div', page, {
    name: 'Content',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 20, paddingTop: 24, paddingRight: 32, paddingBottom: 24, paddingLeft: 32, alignItems: 'stretch' },
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
      { name: 'Total Revenue', value: '$45,231.89', change: '+20.1%', sub: 'from last month', progress: 78 },
      { name: 'Subscriptions', value: '+2,350', change: '+180.1%', sub: 'from last month', progress: 92 },
      { name: 'Sales', value: '+12,234', change: '+19%', sub: 'from last month', progress: 65 },
      { name: 'Active Now', value: '573', change: '', sub: 'online right now', progress: 45 },
    ]
    for (const st of stats) {
      const sc = add('div', statsRow, {
        name: st.name,
        style: { ...rel, width: 'auto', height: 'auto', ...card },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 8, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20, alignItems: 'start' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (sc) {
        add('text', sc, { name: `${st.name} Label`, style: { ...rel, fontSize: 13, fontWeight: 500, color: s }, props: { content: st.name } })
        const valRow = add('div', sc, {
          name: `${st.name} Value Row`,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'end' as const },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (valRow) {
          add('text', valRow, { name: `${st.name} Value`, style: { ...rel, fontSize: 28, fontWeight: 700, color: t }, props: { content: st.value } })
          if (st.change) {
            add('text', valRow, { name: `${st.name} Change`, style: { ...rel, fontSize: 12, fontWeight: 500, color: '#16a34a' }, props: { content: st.change } })
          }
        }
        add('text', sc, { name: `${st.name} Sub`, style: { ...rel, fontSize: 11, color: m }, props: { content: st.sub } })
        add('sc:progress', sc, { name: `${st.name} Bar`, style: { ...rel, width: undefined }, props: { value: st.progress }, sizing: { w: 'fill', h: 'fixed' } })
      }
    }
  }

  // ── Content Row — Table + Right Column ──
  const contentRow = add('div', content, {
    name: 'Content Row',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 20, ...noPad, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (contentRow) {
    // Recent Sales table
    const tblCard = add('div', contentRow, {
      name: 'Recent Sales',
      style: { ...rel, width: 'auto', height: 'auto', ...card },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 12, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, alignItems: 'stretch' },
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
            ['Sofia Davis', 'sofia@email.com', 'Completed', '+$450.00'],
          ],
        },
      })
    }

    // Right column — Team + Quick Actions
    const rightCol = add('div', contentRow, {
      name: 'Right Column',
      style: { ...rel, width: 300, height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 20, ...noPad, alignItems: 'stretch' },
    })
    if (rightCol) {
      // Team card
      const teamCard = add('div', rightCol, {
        name: 'Team',
        style: { ...rel, width: 'auto', height: 'auto', ...card },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 14, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20, alignItems: 'stretch' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (teamCard) {
        add('text', teamCard, { name: 'Team Title', style: { ...rel, fontSize: 16, fontWeight: 600, color: t }, props: { content: 'Team Members' } })
        const members = [
          { name: 'Sofia Davis', initials: 'SD', role: 'Owner' },
          { name: 'Jackson Lee', initials: 'JL', role: 'Developer' },
          { name: 'Isabella Nguyen', initials: 'IN', role: 'Designer' },
        ]
        for (const member of members) {
          const row = add('div', teamCard, {
            name: `Member ${member.name}`,
            style: { ...rel, width: 'auto', height: 'auto', ...box },
            layoutMode: 'flex', layoutProps: { direction: 'row', gap: 10, ...noPad, alignItems: 'center' },
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

      // Quick settings
      const settingsCard = add('div', rightCol, {
        name: 'Quick Settings',
        style: { ...rel, width: 'auto', height: 'auto', ...card },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, alignItems: 'stretch' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (settingsCard) {
        add('sc:switch', settingsCard, { name: 'Email Notifications', style: { ...rel, paddingLeft: 20, paddingRight: 20, paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${bd}` }, props: { label: 'Email notifications', checked: true } })
        add('sc:switch', settingsCard, { name: 'Push Notifications', style: { ...rel, paddingLeft: 20, paddingRight: 20, paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${bd}` }, props: { label: 'Push notifications', checked: false } })
        add('sc:switch', settingsCard, { name: 'Marketing Emails', style: { ...rel, paddingLeft: 20, paddingRight: 20, paddingTop: 14, paddingBottom: 14 }, props: { label: 'Marketing emails', checked: false } })
      }
    }
  }

  // ── Alert Banner ──
  add('sc:alert', content, {
    name: 'Notice',
    style: { ...rel, width: 'auto' },
    sizing: { w: 'fill', h: 'hug' },
    props: { title: 'Heads up!', description: 'Your trial ends in 7 days. Upgrade to Pro for unlimited access.', variant: 'default' },
  })

  // ── Footer ──
  const footer = add('div', page, {
    name: 'Footer',
    style: { ...rel, width: 'auto', height: 'auto', ...box, backgroundColor: '#ffffff', borderTop: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 0, paddingTop: 16, paddingRight: 32, paddingBottom: 16, paddingLeft: 32, alignItems: 'center', justifyContent: 'space-between' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (footer) {
    add('text', footer, { name: 'Copyright', style: { ...rel, fontSize: 12, color: m }, props: { content: '© 2026 Acme Inc. All rights reserved.' } })
    add('text', footer, { name: 'Version', style: { ...rel, fontSize: 12, color: m }, props: { content: 'v2.4.1' } })
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
