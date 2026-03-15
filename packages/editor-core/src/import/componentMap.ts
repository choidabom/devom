import type { CSSProperties } from "react"
import type { ElementType } from "../types"

export interface ComponentMapping {
  type: ElementType
  defaultStyle?: Partial<CSSProperties>
  defaultProps?: Record<string, unknown>
}

export const JSX_TO_EDITOR: Record<string, ComponentMapping> = {
  // shadcn/ui atomic components
  Button: { type: "sc:button" },
  Input: { type: "sc:input" },
  Badge: { type: "sc:badge" },
  Checkbox: { type: "sc:checkbox" },
  Switch: { type: "sc:switch" },
  Label: { type: "sc:label" },
  Textarea: { type: "sc:textarea" },
  Avatar: { type: "sc:avatar" },
  Separator: { type: "sc:separator" },
  Progress: { type: "sc:progress" },
  Skeleton: { type: "sc:skeleton" },
  Slider: { type: "sc:slider" },
  Tabs: { type: "sc:tabs" },
  Alert: { type: "sc:alert" },
  Toggle: { type: "sc:toggle" },
  Select: { type: "sc:select" },
  Table: { type: "sc:table" },
  Accordion: { type: "sc:accordion" },
  RadioGroup: { type: "sc:radio-group" },

  // shadcn composite wrappers → div/text
  Card: { type: "div", defaultStyle: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12 } },
  CardHeader: { type: "div" },
  CardContent: { type: "div" },
  CardFooter: { type: "div" },
  CardTitle: { type: "text", defaultStyle: { fontSize: 18, fontWeight: 600 } },
  CardDescription: { type: "text", defaultStyle: { fontSize: 14, color: "#64748b" } },
  AlertTitle: { type: "text", defaultStyle: { fontSize: 16, fontWeight: 600 } },
  AlertDescription: { type: "text", defaultStyle: { fontSize: 14, color: "#64748b" } },

  // HTML elements
  div: { type: "div" },
  section: { type: "div" },
  main: { type: "div" },
  header: { type: "div" },
  footer: { type: "div" },
  nav: { type: "div" },
  aside: { type: "div" },
  article: { type: "div" },
  form: { type: "div" },
  span: { type: "text" },
  p: { type: "text" },
  h1: { type: "text", defaultStyle: { fontSize: 36, fontWeight: 700 } },
  h2: { type: "text", defaultStyle: { fontSize: 30, fontWeight: 600 } },
  h3: { type: "text", defaultStyle: { fontSize: 24, fontWeight: 600 } },
  h4: { type: "text", defaultStyle: { fontSize: 20, fontWeight: 600 } },
  h5: { type: "text", defaultStyle: { fontSize: 18, fontWeight: 600 } },
  h6: { type: "text", defaultStyle: { fontSize: 16, fontWeight: 600 } },
  img: { type: "image" },
  video: { type: "video" },
}

export function getComponentMapping(tagName: string): ComponentMapping {
  return JSX_TO_EDITOR[tagName] ?? { type: "div" }
}

export function isUnknownComponent(tagName: string): boolean {
  return !(tagName in JSX_TO_EDITOR)
}
