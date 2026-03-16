import { T } from "../theme"
import {
  Mouse,
  ZoomIn,
  Copy,
  Undo2,
  Lock,
  LayoutGrid,
  PanelTop,
  Hand,
  Keyboard,
  Layers,
  FileDown,
  ImageIcon,
  Trash2,
  Scissors,
  MousePointerClick,
  BoxSelect,
  GripVertical,
  MonitorSmartphone,
  LayoutTemplate,
  FileUp,
} from "lucide-react"
import type { ReactNode } from "react"

const S = 13

const SECTIONS: { title: string; items: { icon: ReactNode; label: string; shortcut?: string; desc?: string }[] }[] = [
  {
    title: "Add Elements",
    items: [
      { icon: <LayoutGrid size={S} />, label: "Frame / Text", shortcut: "Toolbar" },
      { icon: <ImageIcon size={S} />, label: "Image upload", shortcut: "Toolbar", desc: "5MB max, base64" },
      { icon: <MousePointerClick size={S} />, label: "UI components", shortcut: "Toolbar \u2192 UI", desc: "20 shadcn/ui" },
      { icon: <GripVertical size={S} />, label: "Drag to canvas", desc: "Toolbar DnD" },
    ],
  },
  {
    title: "Select",
    items: [
      { icon: <Mouse size={S} />, label: "Select", shortcut: "Click" },
      { icon: <Mouse size={S} />, label: "Multi-select", shortcut: "Shift+Click" },
      { icon: <BoxSelect size={S} />, label: "Marquee select", shortcut: "Drag on canvas" },
      { icon: <Mouse size={S} />, label: "Deselect", shortcut: "Click empty area" },
    ],
  },
  {
    title: "Edit",
    items: [
      { icon: <Copy size={S} />, label: "Copy / Paste", shortcut: "\u2318C / \u2318V" },
      { icon: <Scissors size={S} />, label: "Cut", shortcut: "\u2318X" },
      { icon: <Copy size={S} />, label: "Duplicate", shortcut: "\u2318D" },
      { icon: <Trash2 size={S} />, label: "Delete", shortcut: "Del / Backspace" },
      { icon: <Undo2 size={S} />, label: "Undo / Redo", shortcut: "\u2318Z / \u21e7\u2318Z" },
      { icon: <Lock size={S} />, label: "Lock / Unlock", shortcut: "Layers \ud83d\udd12" },
      { icon: <Mouse size={S} />, label: "Context menu", shortcut: "Right-click" },
    ],
  },
  {
    title: "Group & Layout",
    items: [
      { icon: <Layers size={S} />, label: "Group", shortcut: "\u2318G" },
      { icon: <Layers size={S} />, label: "Ungroup", shortcut: "\u21e7\u2318G" },
      { icon: <LayoutGrid size={S} />, label: "Auto Layout", shortcut: "Properties \u2192 Layout" },
      { icon: <GripVertical size={S} />, label: "Reorder layers", shortcut: "Layers DnD" },
    ],
  },
  {
    title: "View",
    items: [
      { icon: <ZoomIn size={S} />, label: "Zoom in / out", shortcut: "\u2318+ / \u2318\u2212" },
      { icon: <ZoomIn size={S} />, label: "Reset zoom", shortcut: "\u23180" },
      { icon: <Hand size={S} />, label: "Pan canvas", shortcut: "Space+Drag" },
      { icon: <PanelTop size={S} />, label: "Toggle panels", shortcut: "\u2318\\" },
      { icon: <MonitorSmartphone size={S} />, label: "Canvas / Page mode", shortcut: "Toolbar" },
    ],
  },
  {
    title: "Mode",
    items: [
      { icon: <Keyboard size={S} />, label: "Edit mode", shortcut: "V" },
      { icon: <Hand size={S} />, label: "Interact mode", shortcut: "P" },
    ],
  },
  {
    title: "Export & Import",
    items: [
      { icon: <FileDown size={S} />, label: "Export", shortcut: "Toolbar \u2192 Export", desc: "HTML / JSX / JSON / PDF" },
      { icon: <FileUp size={S} />, label: "Import JSX", shortcut: "Toolbar \u2192 Import" },
      { icon: <LayoutTemplate size={S} />, label: "Templates", shortcut: "Toolbar \u2192 Templates" },
    ],
  },
]

export function GuidePanel() {
  return (
    <div style={{ padding: "12px 14px", overflowY: "auto", flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Quick Guide</div>
      {SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: T.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {section.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {section.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 6px",
                  borderRadius: 6,
                  fontSize: 12,
                  color: T.text,
                }}
              >
                <span style={{ color: T.textMuted, flexShrink: 0, display: "flex" }}>{item.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span>{item.label}</span>
                  {item.desc && <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 4 }}>{item.desc}</span>}
                </span>
                {item.shortcut && (
                  <span
                    style={{
                      fontSize: 10,
                      color: T.textMuted,
                      background: T.inputBg,
                      padding: "2px 6px",
                      borderRadius: 4,
                      border: `1px solid ${T.inputBorder}`,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
