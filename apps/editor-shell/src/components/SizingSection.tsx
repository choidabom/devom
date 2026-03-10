import { observer } from "mobx-react-lite"
import type { EditorElement, SizingMode } from "@devom/editor-core"
import { T } from "../theme"

interface SizingSectionProps {
  element: EditorElement
  onUpdateSizing: (sizing: { w?: SizingMode; h?: SizingMode }) => void
  onUpdateStyle: (key: string, value: string) => void
}

export const SizingSection = observer(function SizingSection({ element, onUpdateSizing, onUpdateStyle }: SizingSectionProps) {
  const { w, h } = element.sizing

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8, padding: '0 14px' }}>Sizing</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px' }}>
        {/* Width sizing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 20, flexShrink: 0 }}>W</span>
          <select
            value={w}
            onChange={(e) => onUpdateSizing({ w: e.target.value as SizingMode })}
            style={{
              width: 70, padding: '5px 8px',
              background: T.inputBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 6, color: T.text, fontSize: 12, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="fixed">Fixed</option>
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
          </select>
          {w === 'fixed' && (
            <input
              value={element.style.width ?? 'auto'}
              onChange={(e) => onUpdateStyle('width', e.target.value)}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none',
              }}
            />
          )}
        </div>

        {/* Height sizing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 20, flexShrink: 0 }}>H</span>
          <select
            value={h}
            onChange={(e) => onUpdateSizing({ h: e.target.value as SizingMode })}
            style={{
              width: 70, padding: '5px 8px',
              background: T.inputBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 6, color: T.text, fontSize: 12, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="fixed">Fixed</option>
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
          </select>
          {h === 'fixed' && (
            <input
              value={element.style.height ?? 'auto'}
              onChange={(e) => onUpdateStyle('height', e.target.value)}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
})
