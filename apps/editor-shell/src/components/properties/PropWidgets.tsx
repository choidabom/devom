import { useState, useRef, useEffect, useCallback } from "react"
import { HexColorPicker } from "react-colorful"
import { T } from "../../theme"

export function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8, padding: "0 14px" }}>{title}</div>
      {children}
    </div>
  )
}

export function PropGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px" }}>
      {children}
    </div>
  )
}

export function PropCompact({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, color: T.textMuted }}>{label}</span>
      <input
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "5px 8px",
          background: T.inputBg, border: `1px solid ${T.inputBorder}`,
          borderRadius: 6, color: T.text, fontSize: 12, boxSizing: "border-box",
          outline: "none",
        }}
      />
    </div>
  )
}

export function PropSelect({ label, value, options, onChange, mixed }: { label: string; value: string; options: string[]; onChange: (v: string) => void; mixed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <select
        value={mixed ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, padding: "5px 8px",
          background: T.inputBg, border: `1px solid ${T.inputBorder}`,
          borderRadius: 6, color: mixed ? T.textMuted : T.text, fontSize: 12, minWidth: 0,
          outline: "none", cursor: "pointer",
        }}
      >
        {mixed && <option value="" disabled>mixed</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export function PropToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: T.accent, cursor: "pointer" }}
      />
    </div>
  )
}

export function PropRow({ label, value, onChange, color, onLiveChange }: { label: string; value: string | number; onChange: (v: string) => void; color?: boolean; onLiveChange?: (v: string) => void }) {
  const isMixed = value === "mixed"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        {color && !isMixed && (
          <ColorPickerPopover value={String(value)} onChange={onChange} onLiveChange={onLiveChange} />
        )}
        <input
          value={isMixed ? "" : String(value)}
          placeholder={isMixed ? "mixed" : undefined}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, padding: "5px 8px",
            background: T.inputBg, border: `1px solid ${T.inputBorder}`,
            borderRadius: 6, color: isMixed ? T.textMuted : T.text, fontSize: 12, minWidth: 0,
            outline: "none",
          }}
        />
      </div>
    </div>
  )
}

export function ColorPickerPopover({ value, onChange, onLiveChange }: { value: string; onChange: (v: string) => void; onLiveChange?: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [localHex, setLocalHex] = useState(value || "#ffffff")
  const popRef = useRef<HTMLDivElement>(null)
  const committedRef = useRef(value)
  const wasOpenRef = useRef(false)

  useEffect(() => { setLocalHex(value || "#ffffff") }, [value])

  useEffect(() => {
    if (!open) return
    wasOpenRef.current = true
    committedRef.current = value
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open, value])

  useEffect(() => {
    if (open || !wasOpenRef.current) return
    if (localHex !== committedRef.current && /^#[0-9a-fA-F]{6}$/i.test(localHex)) {
      onChange(localHex)
    }
    wasOpenRef.current = false
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePickerChange = useCallback((hex: string) => {
    setLocalHex(hex)
    onLiveChange?.(hex)
  }, [onLiveChange])

  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocalHex(v)
    if (/^#[0-9a-fA-F]{6}$/i.test(v)) onLiveChange?.(v)
  }, [onLiveChange])

  return (
    <div ref={popRef} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: "pointer",
          background: value || "#fff", border: `1px solid ${T.inputBorder}`,
        }}
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 6, zIndex: 1000,
          padding: 8, borderRadius: 10, background: T.panel,
          border: `1px solid ${T.panelBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}>
          <HexColorPicker color={localHex} onChange={handlePickerChange} style={{ width: 180, height: 150 }} />
          <input
            value={localHex}
            onChange={handleHexInput}
            style={{
              width: "100%", marginTop: 6, padding: "4px 6px", fontSize: 11,
              background: T.inputBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 4, color: T.text, boxSizing: "border-box", outline: "none",
              fontFamily: "monospace",
            }}
          />
        </div>
      )}
    </div>
  )
}
