import { T } from "../theme"
import { Mouse, ZoomIn, Copy, Undo2, Lock, LayoutGrid, PanelTop, Hand, Keyboard, Layers, FileDown, ImageIcon } from "lucide-react"
import type { ReactNode } from "react"

const S = 14

const SECTIONS: { title: string; items: { icon: ReactNode; label: string; shortcut?: string }[] }[] = [
  {
    title: "Add Elements",
    items: [
      { icon: <LayoutGrid size={S} />, label: "Frame / Text / Image", shortcut: "Toolbar" },
      { icon: <ImageIcon size={S} />, label: "Upload image", shortcut: "Toolbar \u2192 Image" },
      { icon: <Layers size={S} />, label: "UI components", shortcut: "Toolbar \u2192 UI" },
    ],
  },
  {
    title: "Selection",
    items: [
      { icon: <Mouse size={S} />, label: "Select element", shortcut: "Click" },
      { icon: <Mouse size={S} />, label: "Click empty area to deselect" },
    ],
  },
  {
    title: "Edit",
    items: [
      { icon: <Copy size={S} />, label: "Copy / Paste", shortcut: "\u2318C / \u2318V" },
      { icon: <Copy size={S} />, label: "Duplicate", shortcut: "\u2318D" },
      { icon: <Undo2 size={S} />, label: "Undo / Redo", shortcut: "\u2318Z / \u21e7\u2318Z" },
      { icon: <Lock size={S} />, label: "Lock element", shortcut: "\u2318L" },
    ],
  },
  {
    title: "Group & Layout",
    items: [
      { icon: <Layers size={S} />, label: "Group", shortcut: "\u2318G" },
      { icon: <Layers size={S} />, label: "Ungroup", shortcut: "\u21e7\u2318G" },
      { icon: <LayoutGrid size={S} />, label: "Auto Layout", shortcut: "Properties \u2192 Layout" },
    ],
  },
  {
    title: "View",
    items: [
      { icon: <ZoomIn size={S} />, label: "Zoom in / out", shortcut: "\u2318+/\u2318\u2212" },
      { icon: <ZoomIn size={S} />, label: "Reset zoom", shortcut: "\u23180" },
      { icon: <Hand size={S} />, label: "Pan canvas", shortcut: "Space+Drag" },
      { icon: <PanelTop size={S} />, label: "Toggle panels", shortcut: "\u2318\\" },
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
    title: "Export",
    items: [{ icon: <FileDown size={S} />, label: "Export HTML / JSX / PDF", shortcut: "Toolbar \u2192 Export" }],
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
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                <span style={{ flex: 1 }}>{item.label}</span>
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
