import type { DocumentStore } from "../../stores/DocumentStore"
import { buildDashboard } from "./dashboard"
import { buildLoginForm } from "./loginForm"
import { buildPricingPage } from "./pricingPage"
import { buildSettingsPage } from "./settingsPage"
import { buildLandingPage } from "./landingPage"

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: 'dashboard' | 'form' | 'marketing' | 'content'
}

export type TemplateBuilder = (store: DocumentStore) => void

export const TEMPLATES: TemplateMetadata[] = [
  { id: 'blank', name: 'Blank Canvas', description: 'Empty canvas to start from scratch', category: 'content' },
  { id: 'dashboard', name: 'SaaS Dashboard', description: 'Analytics dashboard with stats, table, and team', category: 'dashboard' },
  { id: 'login-form', name: 'Login Form', description: 'Authentication form with social login', category: 'form' },
  { id: 'pricing', name: 'Pricing Page', description: 'Three-tier pricing with feature comparison', category: 'marketing' },
  { id: 'settings', name: 'Settings Page', description: 'Account settings with tabs, forms and switches', category: 'form' },
  { id: 'landing', name: 'Product Landing', description: 'Long-scroll product detail page with reviews and FAQ', category: 'marketing' },
]

export const TEMPLATE_BUILDERS: Record<string, TemplateBuilder> = {
  blank: (store) => store.resetDocument(),
  dashboard: buildDashboard,
  'login-form': buildLoginForm,
  'pricing': buildPricingPage,
  'settings': buildSettingsPage,
  'landing': buildLandingPage,
}
