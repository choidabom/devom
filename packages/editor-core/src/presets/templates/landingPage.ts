import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

export function buildLandingPage(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

  // Color palette
  const t = '#0f172a'   // text
  const s = '#64748b'   // secondary
  const m = '#94a3b8'   // muted
  const bd = '#e2e8f0'  // border
  const card = { backgroundColor: '#ffffff', borderRadius: 12, border: `1px solid ${bd}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // ════════════════════════════════════════════
  // Page Wrapper
  // ════════════════════════════════════════════
  const W = 800
  const page = add('div', store.rootId, {
    name: 'Page',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'stretch' },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════
  const nav = add('div', page, {
    name: 'Nav',
    style: { ...rel, width: 'auto', height: 'auto', ...box, borderBottom: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 24, paddingTop: 16, paddingRight: 32, paddingBottom: 16, paddingLeft: 32, alignItems: 'center', justifyContent: 'space-between' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (nav) {
    add('text', nav, { name: 'Logo', style: { ...rel, fontSize: 18, fontWeight: 700, color: t }, props: { content: 'Acme Store' } })
    const navLinks = add('div', nav, {
      name: 'Nav Links',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 20, ...noPad, alignItems: 'center' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (navLinks) {
      for (const link of ['Home', 'Products', 'About', 'Contact']) {
        add('text', navLinks, { name: link, style: { ...rel, fontSize: 13, fontWeight: 500, color: s }, props: { content: link } })
      }
    }
    add('sc:button', nav, { name: 'Cart Button', style: { ...rel }, props: { label: 'Cart (2)', variant: 'outline', size: 'sm' } })
  }

  // ════════════════════════════════════════════
  // Hero Section — Product Image + Info
  // ════════════════════════════════════════════
  const hero = add('div', page, {
    name: 'Hero Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 40, paddingTop: 48, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (hero) {
    // Product image placeholder
    add('div', hero, {
      name: 'Product Image',
      style: { ...rel, width: 360, height: 400, backgroundColor: '#f1f5f9', borderRadius: 12 },
      sizing: { w: 'fixed', h: 'fixed' },
    })

    // Product info
    const info = add('div', hero, {
      name: 'Product Info',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 16, ...noPad, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (info) {
      add('sc:badge', info, { name: 'Category Badge', style: { ...rel }, props: { label: 'New Arrival', variant: 'secondary' } })
      add('text', info, { name: 'Product Title', style: { ...rel, fontSize: 32, fontWeight: 700, color: t }, props: { content: 'Premium Wireless Headphones' } })
      add('text', info, { name: 'Product Subtitle', style: { ...rel, fontSize: 15, color: s, lineHeight: 1.6 }, props: { content: 'Experience crystal-clear audio with our premium noise-cancelling headphones. Designed for comfort and built to last.' } })

      // Price row
      const priceRow = add('div', info, {
        name: 'Price Row',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'end' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (priceRow) {
        add('text', priceRow, { name: 'Price', style: { ...rel, fontSize: 28, fontWeight: 700, color: t }, props: { content: '$299.00' } })
        add('text', priceRow, { name: 'Original Price', style: { ...rel, fontSize: 16, color: m, textDecoration: 'line-through' }, props: { content: '$399.00' } })
      }

      // Rating
      add('text', info, { name: 'Rating', style: { ...rel, fontSize: 13, color: s }, props: { content: '★★★★★  4.9 (2,847 reviews)' } })

      add('sc:separator', info, { name: 'Divider', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'fixed' } })

      // Color options
      add('text', info, { name: 'Color Label', style: { ...rel, fontSize: 13, fontWeight: 600, color: t }, props: { content: 'Color' } })
      const colors = add('div', info, {
        name: 'Color Options',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (colors) {
        for (const c of ['#0f172a', '#3b82f6', '#ef4444', '#f8fafc']) {
          add('div', colors, { name: `Color ${c}`, style: { ...rel, width: 28, height: 28, backgroundColor: c, borderRadius: 14, border: c === '#f8fafc' ? `1px solid ${bd}` : 'none' } })
        }
      }

      // CTA buttons
      const cta = add('div', info, {
        name: 'CTA Buttons',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (cta) {
        add('sc:button', cta, { name: 'Add to Cart', style: { ...rel }, props: { label: 'Add to Cart', variant: 'default', size: 'lg' } })
        add('sc:button', cta, { name: 'Buy Now', style: { ...rel }, props: { label: 'Buy Now', variant: 'outline', size: 'lg' } })
      }
    }
  }

  // ════════════════════════════════════════════
  // Features Section
  // ════════════════════════════════════════════
  const featSection = add('div', page, {
    name: 'Features Section',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: '#f8fafc', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 32, paddingTop: 48, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (featSection) {
    add('text', featSection, { name: 'Features Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: 'Why You\'ll Love It' } })

    const featGrid = add('div', featSection, {
      name: 'Features Grid',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 20, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (featGrid) {
      const features = [
        { title: 'Active Noise Cancel', desc: 'Block out the world and focus on what matters with advanced ANC technology.' },
        { title: '40hr Battery Life', desc: 'All-day listening with fast charging — 5 minutes gives you 3 hours.' },
        { title: 'Premium Comfort', desc: 'Memory foam ear cushions and lightweight design for hours of comfort.' },
      ]
      for (const f of features) {
        const fc = add('div', featGrid, {
          name: f.title,
          style: { ...rel, width: 'auto', height: 'auto', ...card },
          layoutMode: 'flex',
          layoutProps: { direction: 'column', gap: 8, paddingTop: 24, paddingRight: 20, paddingBottom: 24, paddingLeft: 20, alignItems: 'start' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (fc) {
          add('text', fc, { name: `${f.title} Title`, style: { ...rel, fontSize: 15, fontWeight: 600, color: t }, props: { content: f.title } })
          add('text', fc, { name: `${f.title} Desc`, style: { ...rel, fontSize: 13, color: s, lineHeight: 1.5 }, props: { content: f.desc } })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // Specs Section
  // ════════════════════════════════════════════
  const specsSection = add('div', page, {
    name: 'Specs Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 24, paddingTop: 48, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (specsSection) {
    add('text', specsSection, { name: 'Specs Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t }, props: { content: 'Technical Specifications' } })
    add('sc:table', specsSection, {
      name: 'Specs Table',
      style: { ...rel, width: undefined },
      props: {
        headers: ['Specification', 'Detail'],
        rows: [
          ['Driver Size', '40mm Beryllium'],
          ['Frequency', '4Hz — 40kHz'],
          ['Battery', '40 hours (ANC on)'],
          ['Bluetooth', '5.3 with multipoint'],
          ['Weight', '250g'],
          ['Charging', 'USB-C, 5min = 3hr'],
        ],
      },
      sizing: { w: 'fill', h: 'hug' },
    })
  }

  // ════════════════════════════════════════════
  // Reviews Section
  // ════════════════════════════════════════════
  const reviewSection = add('div', page, {
    name: 'Reviews Section',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: '#f8fafc', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 24, paddingTop: 48, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (reviewSection) {
    const reviewHeader = add('div', reviewSection, {
      name: 'Review Header',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'end', justifyContent: 'space-between' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (reviewHeader) {
      add('text', reviewHeader, { name: 'Reviews Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t }, props: { content: 'Customer Reviews' } })
      add('text', reviewHeader, { name: 'Reviews Count', style: { ...rel, fontSize: 13, color: s }, props: { content: '2,847 reviews • 4.9 average' } })
    }

    const reviews = [
      { name: 'Sarah K.', rating: '★★★★★', text: 'Best headphones I\'ve ever owned. The noise cancellation is incredible and the battery lasts forever. Highly recommend!' },
      { name: 'James M.', rating: '★★★★★', text: 'Crystal clear sound quality and super comfortable. I wear these for 8+ hours a day while working. No fatigue at all.' },
      { name: 'Emily R.', rating: '★★★★☆', text: 'Great sound and build quality. Only wish the carrying case was a bit more compact. Otherwise perfect for travel.' },
    ]
    for (const r of reviews) {
      const rc = add('div', reviewSection, {
        name: `Review by ${r.name}`,
        style: { ...rel, width: 'auto', height: 'auto', ...card },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 8, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20, alignItems: 'start' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (rc) {
        const rHeader = add('div', rc, {
          name: `${r.name} Header`,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'center' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (rHeader) {
          add('sc:avatar', rHeader, { name: `${r.name} Avatar`, style: { ...rel }, props: { fallback: r.name.split(' ').map(n => n[0]).join('') } })
          add('text', rHeader, { name: `${r.name} Name`, style: { ...rel, fontSize: 14, fontWeight: 600, color: t }, props: { content: r.name } })
          add('text', rHeader, { name: `${r.name} Rating`, style: { ...rel, fontSize: 13, color: '#eab308' }, props: { content: r.rating } })
        }
        add('text', rc, { name: `${r.name} Text`, style: { ...rel, fontSize: 13, color: s, lineHeight: 1.6 }, props: { content: r.text } })
      }
    }
  }

  // ════════════════════════════════════════════
  // FAQ Section
  // ════════════════════════════════════════════
  const faqSection = add('div', page, {
    name: 'FAQ Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 20, paddingTop: 48, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (faqSection) {
    add('text', faqSection, { name: 'FAQ Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: 'Frequently Asked Questions' } })
    add('sc:accordion', faqSection, {
      name: 'FAQ Accordion',
      style: { ...rel, width: undefined },
      props: {
        items: [
          { title: 'What\'s in the box?', content: 'Headphones, USB-C cable, 3.5mm audio cable, carrying case, and quick start guide.' },
          { title: 'Is there a warranty?', content: 'Yes, all products come with a 2-year manufacturer warranty and 30-day money-back guarantee.' },
          { title: 'Can I use them while charging?', content: 'Yes! You can use the headphones while charging via USB-C or switch to wired mode with the included 3.5mm cable.' },
          { title: 'Are replacement ear cushions available?', content: 'Yes, replacement ear cushions are available in our accessories store for $24.99.' },
        ],
      },
      sizing: { w: 'fill', h: 'hug' },
    })
  }

  // ════════════════════════════════════════════
  // CTA Banner
  // ════════════════════════════════════════════
  const ctaBanner = add('div', page, {
    name: 'CTA Banner',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: t, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, paddingTop: 48, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (ctaBanner) {
    add('text', ctaBanner, { name: 'CTA Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: '#ffffff', textAlign: 'center' }, props: { content: 'Ready to Upgrade Your Audio?' } })
    add('text', ctaBanner, { name: 'CTA Subtitle', style: { ...rel, fontSize: 14, color: '#94a3b8', textAlign: 'center' }, props: { content: 'Free shipping on all orders. 30-day money-back guarantee.' } })
    const ctaRow = add('div', ctaBanner, {
      name: 'CTA Row',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'center' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (ctaRow) {
      add('sc:button', ctaRow, { name: 'Order Now', style: { ...rel }, props: { label: 'Order Now — $299', variant: 'default', size: 'lg' } })
    }
  }

  // ════════════════════════════════════════════
  // Footer
  // ════════════════════════════════════════════
  const footer = add('div', page, {
    name: 'Footer',
    style: { ...rel, width: 'auto', height: 'auto', ...box, borderTop: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 16, paddingTop: 20, paddingRight: 32, paddingBottom: 20, paddingLeft: 32, alignItems: 'center', justifyContent: 'space-between' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (footer) {
    add('text', footer, { name: 'Copyright', style: { ...rel, fontSize: 12, color: m }, props: { content: '© 2026 Acme Store. All rights reserved.' } })
    add('text', footer, { name: 'Links', style: { ...rel, fontSize: 12, color: m }, props: { content: 'Privacy · Terms · Shipping' } })
  }
}
