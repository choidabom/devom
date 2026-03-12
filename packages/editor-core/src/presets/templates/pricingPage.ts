import { nanoid } from "nanoid"
import type { DocumentStore } from "../../stores/DocumentStore"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type EditorElement, type ElementType, type SizingProps } from "../../types"

export function buildPricingPage(store: DocumentStore): void {
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
    layoutProps: { direction: 'row', gap: 0, paddingTop: 20, paddingRight: 24, paddingBottom: 20, paddingLeft: 24, alignItems: 'center', justifyContent: 'space-between' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (header) {
    add('text', header, { name: 'Logo', style: { ...rel, fontSize: 20, fontWeight: 700, color: t }, props: { content: 'Acme' } })
    const nav = add('div', header, {
      name: 'Nav',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 20, ...noPad, alignItems: 'center' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (nav) {
      add('text', nav, { name: 'Features', style: { ...rel, fontSize: 14, color: s, cursor: 'pointer' }, props: { content: 'Features' } })
      add('text', nav, { name: 'Pricing', style: { ...rel, fontSize: 14, color: t, fontWeight: 500, cursor: 'pointer' }, props: { content: 'Pricing' } })
      add('text', nav, { name: 'About', style: { ...rel, fontSize: 14, color: s, cursor: 'pointer' }, props: { content: 'About' } })
    }
  }

  // ════════════════════════════════════════════
  // Hero Section
  // ════════════════════════════════════════════
  const hero = add('div', page, {
    name: 'Hero',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 12, paddingTop: 60, paddingRight: 40, paddingBottom: 60, paddingLeft: 40, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (hero) {
    add('sc:badge', hero, { name: 'Badge', style: { ...rel }, props: { label: 'Pricing', variant: 'secondary' } })
    add('text', hero, { name: 'Headline', style: { ...rel, fontSize: 36, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: 'Simple, transparent pricing' } })
    add('text', hero, { name: 'Subheadline', style: { ...rel, fontSize: 16, color: s, textAlign: 'center' }, props: { content: "Choose the plan that's right for you" } })
  }

  // ════════════════════════════════════════════
  // Pricing Cards Row
  // ════════════════════════════════════════════
  const cardsRow = add('div', page, {
    name: 'Cards Row',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 16, paddingTop: 0, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (!cardsRow) return

  // Pricing card data
  const plans = [
    {
      name: 'Starter',
      badge: { label: 'Starter', variant: 'secondary' },
      price: '$9',
      features: ['5 projects', '10GB storage', 'Basic analytics', 'Email support'],
      button: { label: 'Get Started', variant: 'outline' },
      extraBorder: false,
    },
    {
      name: 'Pro',
      badge: { label: 'Popular', variant: 'default' },
      price: '$29',
      features: ['Unlimited projects', '100GB storage', 'Advanced analytics', 'Priority support', 'Custom integrations', 'API access'],
      button: { label: 'Get Started', variant: 'default' },
      extraBorder: true,
    },
    {
      name: 'Enterprise',
      badge: { label: 'Enterprise', variant: 'secondary' },
      price: '$99',
      features: ['Unlimited everything', '1TB storage', 'Enterprise analytics', '24/7 phone support', 'Custom contracts', 'SLA guarantee', 'Dedicated account manager', 'On-premise option'],
      button: { label: 'Contact Sales', variant: 'outline' },
      extraBorder: false,
    },
  ]

  for (const plan of plans) {
    const cardStyle = plan.extraBorder
      ? { ...rel, width: 'auto', height: 'auto', backgroundColor: '#ffffff', borderRadius: 12, border: '2px solid #6366f1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
      : { ...rel, width: 'auto', height: 'auto', ...card }

    const planCard = add('div', cardsRow, {
      name: plan.name,
      style: cardStyle,
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 16, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (planCard) {
      add('sc:badge', planCard, { name: `${plan.name} Badge`, style: { ...rel }, props: { label: plan.badge.label, variant: plan.badge.variant } })
      add('text', planCard, { name: `${plan.name} Price`, style: { ...rel, fontSize: 36, fontWeight: 700, color: t }, props: { content: plan.price } })
      add('text', planCard, { name: `${plan.name} Period`, style: { ...rel, fontSize: 14, color: s }, props: { content: 'per month' } })
      add('sc:separator', planCard, { name: `${plan.name} Sep`, style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'hug' } })

      // Features
      const features = add('div', planCard, {
        name: `${plan.name} Features`,
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 8, ...noPad, alignItems: 'start' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (features) {
        for (const feature of plan.features) {
          add('text', features, { name: `${plan.name} ${feature}`, style: { ...rel, fontSize: 14, color: '#475569' }, props: { content: `✓ ${feature}` } })
        }
      }

      add('sc:button', planCard, { name: `${plan.name} Button`, style: { ...rel, width: undefined }, props: { label: plan.button.label, variant: plan.button.variant, size: 'default' }, sizing: { w: 'fill', h: 'hug' } })
    }
  }

  // ════════════════════════════════════════════
  // Footer
  // ════════════════════════════════════════════
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
