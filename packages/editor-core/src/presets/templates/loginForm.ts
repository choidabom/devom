import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

export function buildLoginForm(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

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
