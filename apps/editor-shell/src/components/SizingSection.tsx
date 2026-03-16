import { observer } from "mobx-react-lite"
import type { EditorElement, SizingMode } from "@devom/editor-core"
import { T } from "../theme"

interface SizingSectionProps {
  element: EditorElement
  onUpdateSizing: (sizing: { w?: SizingMode; h?: SizingMode }) => void
  onUpdateStyle: (key: string, value: string) => void
  parentFlexWrap?: "nowrap" | "wrap"
}

const selectStyle = {
  width: 56,
  padding: "4px 4px",
  background: T.inputBg,
  border: `1px solid ${T.inputBorder}`,
  borderRadius: 4,
  color: T.text,
  fontSize: 11,
  outline: "none",
  cursor: "pointer",
} as const

const inputStyle = {
  flex: 1,
  padding: "4px 6px",
  background: T.inputBg,
  border: `1px solid ${T.inputBorder}`,
  borderRadius: 4,
  color: T.text,
  fontSize: 11,
  outline: "none",
  minWidth: 0,
} as const

export const SizingSection = observer(function SizingSection({ element, onUpdateSizing, onUpdateStyle, parentFlexWrap }: SizingSectionProps) {
  const { w, h } = element.sizing

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8, padding: "0 14px" }}>Sizing</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 14px" }}>
        {/* Width sizing */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: T.textSub, width: 16, flexShrink: 0 }}>W</span>
          <select value={w} onChange={(e) => onUpdateSizing({ w: e.target.value as SizingMode })} style={selectStyle}>
            <option value="fixed">Fixed</option>
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
          </select>
          {w === "fixed" && <input value={element.style.width ?? "auto"} onChange={(e) => onUpdateStyle("width", e.target.value)} style={inputStyle} />}
        </div>

        {/* Min width — only for wrap containers with fill children */}
        {parentFlexWrap === "wrap" && w === "fill" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textSub, width: 16, flexShrink: 0 }}>↳</span>
            <span style={{ fontSize: 10, color: T.textMuted, width: 40, flexShrink: 0 }}>Min W</span>
            <input value={element.style.minWidth ?? ""} placeholder="200" onChange={(e) => onUpdateStyle("minWidth", e.target.value)} style={inputStyle} />
          </div>
        )}

        {/* Height sizing */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: T.textSub, width: 16, flexShrink: 0 }}>H</span>
          <select value={h} onChange={(e) => onUpdateSizing({ h: e.target.value as SizingMode })} style={selectStyle}>
            <option value="fixed">Fixed</option>
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
          </select>
          {h === "fixed" && <input value={element.style.height ?? "auto"} onChange={(e) => onUpdateStyle("height", e.target.value)} style={inputStyle} />}
        </div>
      </div>
    </div>
  )
})
