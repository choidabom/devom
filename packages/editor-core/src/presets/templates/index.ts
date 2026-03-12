import type { DocumentStore } from "../../stores/DocumentStore"
import { buildDashboard } from "./dashboard"

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: 'dashboard' | 'form' | 'marketing' | 'content'
}

export type TemplateBuilder = (store: DocumentStore) => void

export const TEMPLATES: TemplateMetadata[] = [
  { id: 'dashboard', name: 'SaaS Dashboard', description: 'Analytics dashboard with stats, table, and team', category: 'dashboard' },
]

export const TEMPLATE_BUILDERS: Record<string, TemplateBuilder> = {
  dashboard: buildDashboard,
}
