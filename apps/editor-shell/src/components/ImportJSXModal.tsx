import { useState } from "react"
import { T } from "../theme"

interface ImportJSXModalProps {
  onImport: (code: string, mode: 'replace' | 'add') => void
  onClose: () => void
  warnings?: string[]
}

export function ImportJSXModal({ onImport, onClose, warnings }: ImportJSXModalProps) {
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'replace' | 'add'>('add')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: T.panel, borderRadius: 12, padding: 24, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.text }}>Import JSX</h3>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste shadcn/ui JSX code here..."
          style={{ width: '100%', height: 200, marginTop: 12, padding: 12, fontFamily: "'SF Mono', Menlo, monospace", fontSize: 13, border: `1px solid ${T.inputBorder}`, borderRadius: 8, resize: 'vertical', background: T.inputBg, color: T.text, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: T.text }}>
            <input type="radio" name="mode" checked={mode === 'add'} onChange={() => setMode('add')} /> Add to current
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: T.text }}>
            <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace document
          </label>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 12, padding: '8px 12px', background: T.inputBg, borderRadius: 6 }}>
          Only structure and styling are imported. Event handlers, hooks, conditional rendering, and .map() loops will be simplified.
        </div>
        {warnings && warnings.length > 0 && (
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
            {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '6px 16px', fontSize: 13, border: `1px solid ${T.inputBorder}`, borderRadius: 6, background: T.panel, cursor: 'pointer', color: T.text }}>Cancel</button>
          <button
            onClick={() => onImport(code, mode)}
            disabled={!code.trim()}
            style={{ padding: '6px 16px', fontSize: 13, border: 'none', borderRadius: 6, background: T.accent, color: '#fff', cursor: code.trim() ? 'pointer' : 'default', opacity: code.trim() ? 1 : 0.5 }}
          >Import</button>
        </div>
      </div>
    </div>
  )
}
