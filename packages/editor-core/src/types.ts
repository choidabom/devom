import type { CSSProperties } from "react"

export type ElementType =
  | "div"
  | "text"
  | "image"
  | "button"
  | "input"
  | "flex"
  | "grid"
  | "sc:button"
  | "sc:card"
  | "sc:input"
  | "sc:badge"

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
  layoutMode: 'none' | 'flex'
  layoutProps: LayoutProps
  sizing: SizingProps
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

export type SizingMode = 'fixed' | 'hug' | 'fill'

export interface LayoutProps {
  direction: 'row' | 'column'
  gap: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  alignItems: 'start' | 'center' | 'end' | 'stretch'
  justifyContent: 'start' | 'center' | 'end' | 'space-between'
}

export interface SizingProps {
  w: SizingMode
  h: SizingMode
}

export const DEFAULT_LAYOUT_PROPS: LayoutProps = {
  direction: 'column',
  gap: 8,
  paddingTop: 8,
  paddingRight: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  alignItems: 'start',
  justifyContent: 'start',
}

export const DEFAULT_SIZING: SizingProps = {
  w: 'fixed',
  h: 'fixed',
}

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
}
