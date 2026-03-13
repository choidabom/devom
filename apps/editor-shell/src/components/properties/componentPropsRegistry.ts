type FieldType = "text" | "select" | "toggle" | "number" | "csv"

interface PropField {
  key: string
  label: string
  type: FieldType
  options?: string[]
  default?: unknown
  singleOnly?: boolean // only show when single element selected
  min?: number
  max?: number
}

export const COMPONENT_PROPS: Record<string, PropField[]> = {
  "sc:button": [
    { key: "label", label: "Label", type: "text", default: "Button", singleOnly: true },
    { key: "variant", label: "Variant", type: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"], default: "default" },
    { key: "size", label: "Size", type: "select", options: ["default", "sm", "lg", "icon"], default: "default" },
  ],
  "sc:card": [
    { key: "title", label: "Title", type: "text", default: "", singleOnly: true },
    { key: "description", label: "Desc", type: "text", default: "", singleOnly: true },
    { key: "content", label: "Content", type: "text", default: "", singleOnly: true },
  ],
  "sc:input": [
    { key: "placeholder", label: "Placeholder", type: "text", default: "", singleOnly: true },
    { key: "type", label: "Type", type: "select", options: ["text", "password", "email", "number", "tel", "url", "search"], default: "text" },
  ],
  "sc:badge": [
    { key: "label", label: "Label", type: "text", default: "Badge", singleOnly: true },
    { key: "variant", label: "Variant", type: "select", options: ["default", "secondary", "destructive", "outline"], default: "default" },
  ],
  "sc:checkbox": [
    { key: "label", label: "Label", type: "text", default: "", singleOnly: true },
    { key: "checked", label: "Checked", type: "toggle", default: false },
  ],
  "sc:switch": [
    { key: "label", label: "Label", type: "text", default: "", singleOnly: true },
    { key: "checked", label: "Checked", type: "toggle", default: false },
  ],
  "sc:label": [{ key: "text", label: "Text", type: "text", default: "Label", singleOnly: true }],
  "sc:textarea": [
    { key: "placeholder", label: "Placeholder", type: "text", default: "", singleOnly: true },
    { key: "rows", label: "Rows", type: "number", default: 3 },
  ],
  "sc:avatar": [{ key: "fallback", label: "Fallback", type: "text", default: "", singleOnly: true }],
  "sc:separator": [{ key: "orientation", label: "Orient", type: "select", options: ["horizontal", "vertical"], default: "horizontal" }],
  "sc:progress": [{ key: "value", label: "Value", type: "number", default: 60, min: 0, max: 100 }],
  "sc:slider": [
    { key: "value", label: "Value", type: "number", default: 50 },
    { key: "min", label: "Min", type: "number", default: 0 },
    { key: "max", label: "Max", type: "number", default: 100 },
    { key: "step", label: "Step", type: "number", default: 1 },
  ],
  "sc:tabs": [
    { key: "tabs", label: "Tabs", type: "csv", default: [], singleOnly: true },
    { key: "activeTab", label: "Active", type: "text", default: "", singleOnly: true },
  ],
  "sc:alert": [
    { key: "title", label: "Title", type: "text", default: "", singleOnly: true },
    { key: "description", label: "Desc", type: "text", default: "", singleOnly: true },
    { key: "variant", label: "Variant", type: "select", options: ["default", "destructive"], default: "default" },
  ],
  "sc:toggle": [
    { key: "label", label: "Label", type: "text", default: "", singleOnly: true },
    { key: "pressed", label: "Pressed", type: "toggle", default: false },
  ],
  "sc:select": [
    { key: "placeholder", label: "Placeholder", type: "text", default: "", singleOnly: true },
    { key: "options", label: "Options", type: "csv", default: [], singleOnly: true },
  ],
  "sc:table": [{ key: "headers", label: "Headers", type: "csv", default: [], singleOnly: true }],
  "sc:accordion": [],
  "sc:radio-group": [
    { key: "label", label: "Label", type: "text", default: "", singleOnly: true },
    { key: "options", label: "Options", type: "csv", default: [], singleOnly: true },
    { key: "value", label: "Value", type: "text", default: "", singleOnly: true },
  ],
}
