import type { CSSProperties } from "react"

export type ElementType =
  | "div"
  | "text"
  | "image"
  | "video"
  | "button"
  | "input"
  | "form"
  | "flex"
  | "grid"
  | "sc:button"
  | "sc:card"
  | "sc:input"
  | "sc:badge"
  | "sc:checkbox"
  | "sc:switch"
  | "sc:label"
  | "sc:textarea"
  | "sc:avatar"
  | "sc:separator"
  | "sc:progress"
  | "sc:skeleton"
  | "sc:slider"
  | "sc:tabs"
  | "sc:alert"
  | "sc:toggle"
  | "sc:select"
  | "sc:table"
  | "sc:accordion"
  | "sc:radio-group"

export interface ValidationRule {
  required?: boolean | string
  min?: number
  max?: number
  pattern?: string | "email" | "url"
  message?: string
}

export interface FormFieldConfig {
  name: string
  defaultValue?: string | number | boolean
  validation?: ValidationRule
}

export interface EditorElement {
  id: string
  type: ElementType
  name: string
  parentId: string | null
  children: string[]
  style: CSSProperties
  props: Record<string, unknown>
  locked: boolean
  visible: boolean
  layoutMode: "none" | "flex" | "grid"
  layoutProps: LayoutProps
  sizing: SizingProps
  canvasPosition: { left: number; top: number; width?: CSSProperties["width"]; sizing?: SizingProps } | null
  role?: SectionRole
  sectionProps?: SectionProps
  gridProps?: GridProps
  formField?: FormFieldConfig
}

export interface EditorDocument {
  id: string
  name: string
  rootId: string
  elements: Record<string, EditorElement>
  viewport: { width: number; height: number }
}

export interface ElementBounds {
  x: number
  y: number
  width: number
  height: number
}

export type SizingMode = "fixed" | "hug" | "fill"

export interface LayoutProps {
  direction: "row" | "column"
  gap: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  alignItems: "start" | "center" | "end" | "stretch"
  justifyContent: "start" | "center" | "end" | "space-between"
  flexWrap: "nowrap" | "wrap"
}

export interface SizingProps {
  w: SizingMode
  h: SizingMode
}

export interface SectionProps {
  backgroundColor?: string
  backgroundImage?: string
  maxWidth?: number
  verticalPadding?: number
}

export interface GridProps {
  columns: number
  gap: number
  minColumnWidth?: number
}

export const DEFAULT_GRID_PROPS: GridProps = {
  columns: 3,
  gap: 24,
}

export type SectionRole = "section" | "hero" | "features" | "cta" | "footer" | "header"

export const DEFAULT_LAYOUT_PROPS: LayoutProps = {
  direction: "column",
  gap: 8,
  paddingTop: 8,
  paddingRight: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  alignItems: "start",
  justifyContent: "start",
  flexWrap: "nowrap",
}

export const DEFAULT_SIZING: SizingProps = {
  w: "fixed",
  h: "fixed",
}

export type CanvasMode = "canvas" | "page"

export type PageViewportWidth = 1280 | 768 | 375

export const PAGE_VIEWPORT_PRESETS = [
  { label: "Desktop", width: 1280 as PageViewportWidth },
  { label: "Tablet", width: 768 as PageViewportWidth },
  { label: "Mobile", width: 375 as PageViewportWidth },
] as const

export const DEFAULT_ELEMENT_STYLE: Record<ElementType, CSSProperties> = {
  div: {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
    height: 100,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
  },
  text: {
    position: "absolute",
    left: 100,
    top: 100,
    fontSize: 16,
    color: "#1a202c",
    whiteSpace: "pre-line",
  },
  image: {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
    height: 200,
    objectFit: "cover",
    backgroundColor: "#cbd5e0",
  },
  video: {
    position: "absolute",
    left: 100,
    top: 100,
    width: 400,
    height: 300,
    objectFit: "cover",
    backgroundColor: "#1a1a2e",
  },
  button: {
    position: "absolute",
    left: 100,
    top: 100,
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  input: {
    position: "absolute",
    left: 100,
    top: 100,
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    width: 200,
  },
  form: {
    position: "absolute",
    left: 100,
    top: 100,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 32,
    width: 420,
    minHeight: 100,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  flex: {
    position: "relative",
    display: "flex",
    gap: 8,
    padding: 8,
    minWidth: 100,
    minHeight: 50,
    backgroundColor: "rgba(59,130,246,0.05)",
    border: "1px dashed #93c5fd",
  },
  grid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 8,
    minWidth: 100,
    minHeight: 50,
    backgroundColor: "rgba(168,85,247,0.05)",
    border: "1px dashed #c4b5fd",
  },
  "sc:button": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:card": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 350,
  },
  "sc:input": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 250,
  },
  "sc:badge": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:checkbox": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:switch": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:label": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:textarea": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 250,
  },
  "sc:avatar": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:separator": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
  },
  "sc:progress": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
  },
  "sc:skeleton": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
    height: 20,
  },
  "sc:slider": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
  },
  "sc:tabs": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 300,
  },
  "sc:alert": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 300,
  },
  "sc:toggle": {
    position: "absolute",
    left: 100,
    top: 100,
  },
  "sc:select": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 200,
  },
  "sc:table": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 400,
  },
  "sc:accordion": {
    position: "absolute",
    left: 100,
    top: 100,
    width: 300,
  },
  "sc:radio-group": {
    position: "absolute",
    left: 100,
    top: 100,
  },
}

export type ElementTemplate = Omit<EditorElement, "id" | "parentId" | "children"> & {
  children: ElementTemplate[]
}
