import { observer } from "mobx-react-lite"
import type { EditorElement, LayoutProps } from "@devom/editor-core"
import { T } from "../theme"

interface AutoLayoutSectionProps {
  element: EditorElement
  onToggle: () => void
  onUpdate: (props: Partial<LayoutProps>) => void
}

export const AutoLayoutSection = observer(function AutoLayoutSection({ element, onToggle, onUpdate }: AutoLayoutSectionProps) {
  const isActive = element.layoutMode === 'flex'
  const lp = element.layoutProps

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Auto Layout</span>
        <button
          onClick={onToggle}
          style={{
            padding: '3px 10px',
            fontSize: 11,
            background: isActive ? T.accent : T.inputBg,
            color: isActive ? '#fff' : T.text,
            border: `1px solid ${isActive ? T.accent : T.inputBorder}`,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {isActive ? '- Remove' : '+ Add'}
        </button>
      </div>

      {isActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px' }}>
          {/* Direction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Direction</span>
            <select
              value={lp.direction}
              onChange={(e) => onUpdate({ direction: e.target.value as 'row' | 'column' })}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </div>

          {/* Gap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Gap</span>
            <input
              value={lp.gap}
              onChange={(e) => onUpdate({ gap: Number(e.target.value) || 0 })}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none',
              }}
            />
          </div>

          {/* Align Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Align</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['start', 'center', 'end', 'stretch'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => onUpdate({ alignItems: val })}
                  style={{
                    padding: '4px 8px', fontSize: 10,
                    background: lp.alignItems === val ? T.accent : T.inputBg,
                    color: lp.alignItems === val ? '#fff' : T.text,
                    border: `1px solid ${lp.alignItems === val ? T.accent : T.inputBorder}`,
                    borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {val[0]!.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Justify Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Justify</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['start', 'center', 'end', 'space-between'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => onUpdate({ justifyContent: val })}
                  style={{
                    padding: '4px 8px', fontSize: 10,
                    background: lp.justifyContent === val ? T.accent : T.inputBg,
                    color: lp.justifyContent === val ? '#fff' : T.text,
                    border: `1px solid ${lp.justifyContent === val ? T.accent : T.inputBorder}`,
                    borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {val === 'space-between' ? 'SB' : val[0]!.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Padding</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, flex: 1 }}>
              {(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const).map(key => (
                <input
                  key={key}
                  value={lp[key]}
                  onChange={(e) => onUpdate({ [key]: Number(e.target.value) || 0 })}
                  title={key.replace('padding', '').toLowerCase()}
                  style={{
                    padding: '4px 6px', fontSize: 11, width: '100%', boxSizing: 'border-box',
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    borderRadius: 4, color: T.text, outline: 'none', textAlign: 'center',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
