import { observer } from "mobx-react-lite"
import { Lock, Unlock } from "lucide-react"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"

export const PropertiesPanel = observer(function PropertiesPanel() {
  const elements = selectionStore.selectedElements
  if (elements.length === 0) return null

  const isMulti = elements.length > 1
  const element = elements[0]!

  const updateStyle = (key: string, value: string) => {
    historyStore.pushSnapshot()
    const parsed = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value
    for (const el of elements) {
      documentStore.updateStyle(el.id, { [key]: parsed })
    }
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateProp = (key: string, value: string) => {
    historyStore.pushSnapshot()
    for (const el of elements) {
      documentStore.updateProps(el.id, { [key]: value })
    }
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const isShadcn = element.type.startsWith("sc:")
  const allSameType = elements.every(el => el.type === element.type)

  const MIXED = "mixed"
  const sharedStyle = (key: string, fallback: string | number = ""): string | number => {
    const vals = elements.map(el => (el.style as Record<string, unknown>)[key] ?? fallback)
    const first = vals[0] as string | number
    return vals.every(v => v === first) ? first : MIXED
  }
  const sharedProp = (key: string, fallback: string = "") => {
    const vals = elements.map(el => (el.props as Record<string, unknown>)[key] ?? fallback)
    return vals.every(v => v === vals[0]) ? String(vals[0]) : MIXED
  }

  return (
    <div style={{ padding: "12px 0" }}>
      {isMulti && (
        <div style={{ padding: "0 14px 10px", fontSize: 12, color: T.accent, fontWeight: 600, borderBottom: `1px solid ${T.border}`, marginBottom: 10 }}>
          {elements.length} elements selected
        </div>
      )}

      {/* Lock toggle */}
      <div style={{ padding: "0 14px 10px", borderBottom: `1px solid ${T.border}`, marginBottom: 10 }}>
        <button
          onClick={() => {
            historyStore.pushSnapshot()
            for (const el of elements) {
              documentStore.toggleLock(el.id)
            }
            bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: elements.some(el => el.locked) ? T.accent : T.inputBg,
            color: elements.some(el => el.locked) ? "#fff" : T.text,
            border: `1px solid ${elements.some(el => el.locked) ? T.accent : T.inputBorder}`,
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {elements.some(el => el.locked) ? <><Lock size={14} /> Locked</> : <><Unlock size={14} /> Unlocked</>}
        </button>
      </div>

      {/* Position — single select only */}
      {!isMulti && (
        <PropSection title="Position">
          <PropGrid>
            <PropCompact label="X" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
            <PropCompact label="Y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
          </PropGrid>
        </PropSection>
      )}

      {/* Size — single select only */}
      {!isMulti && (!isShadcn || element.type === "sc:card" || element.type === "sc:input") && (
        <PropSection title="Size">
          <PropGrid>
            <PropCompact label="W" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
            <PropCompact label="H" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
          </PropGrid>
        </PropSection>
      )}

      {/* shadcn Component Props — only when all same type */}
      {allSameType && element.type === "sc:button" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Label" value={element.props.label as string ?? "Button"} onChange={(v) => updateProp("label", v)} />}
            <PropSelect label="Variant" value={sharedProp("variant", "default")} options={["default", "destructive", "outline", "secondary", "ghost", "link"]} onChange={(v) => updateProp("variant", v)} mixed={sharedProp("variant", "default") === MIXED} />
            <PropSelect label="Size" value={sharedProp("size", "default")} options={["default", "sm", "lg", "icon"]} onChange={(v) => updateProp("size", v)} mixed={sharedProp("size", "default") === MIXED} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:card" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Title" value={element.props.title as string ?? ""} onChange={(v) => updateProp("title", v)} />
            <PropRow label="Desc" value={element.props.description as string ?? ""} onChange={(v) => updateProp("description", v)} />
            <PropRow label="Content" value={element.props.content as string ?? ""} onChange={(v) => updateProp("content", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:input" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Placeholder" value={element.props.placeholder as string ?? ""} onChange={(v) => updateProp("placeholder", v)} />}
            <PropSelect label="Type" value={sharedProp("type", "text")} options={["text", "password", "email", "number", "tel", "url", "search"]} onChange={(v) => updateProp("type", v)} mixed={sharedProp("type", "text") === MIXED} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:badge" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Label" value={element.props.label as string ?? "Badge"} onChange={(v) => updateProp("label", v)} />}
            <PropSelect label="Variant" value={sharedProp("variant", "default")} options={["default", "secondary", "destructive", "outline"]} onChange={(v) => updateProp("variant", v)} mixed={sharedProp("variant", "default") === MIXED} />
          </div>
        </PropSection>
      )}

      {/* Style — shared properties (works for multi-select) */}
      <PropSection title="Style">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
          <PropRow label="Opacity" value={sharedStyle("opacity", 1)} onChange={(v) => updateStyle("opacity", v)} />
          <PropRow label="Radius" value={sharedStyle("borderRadius", 0)} onChange={(v) => updateStyle("borderRadius", v)} />
          <PropRow label="Fill" value={sharedStyle("backgroundColor", "")} onChange={(v) => updateStyle("backgroundColor", v)} color />
          <PropRow label="Color" value={sharedStyle("color", "")} onChange={(v) => updateStyle("color", v)} color />
          <PropRow label="Padding" value={sharedStyle("padding", 0)} onChange={(v) => updateStyle("padding", v)} />
          <PropRow label="Gap" value={sharedStyle("gap", 0)} onChange={(v) => updateStyle("gap", v)} />
        </div>
      </PropSection>

      {/* Container — single select only */}
      {!isMulti && (element.type === "flex" || element.type === "grid") && (
        <PropSection title="Container">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {element.type === "flex" && (
              <PropSelect label="Direction" value={String(element.style.flexDirection ?? "row")} options={["row", "column", "row-reverse", "column-reverse"]} onChange={(v) => updateStyle("flexDirection", v)} />
            )}
            {element.type === "grid" && (
              <PropRow label="Columns" value={element.style.gridTemplateColumns ?? "1fr 1fr"} onChange={(v) => updateStyle("gridTemplateColumns", v)} />
            )}
          </div>
        </PropSection>
      )}
    </div>
  )
})

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8, padding: "0 14px" }}>{title}</div>
      {children}
    </div>
  )
}

function PropGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px" }}>
      {children}
    </div>
  )
}

function PropCompact({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
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

function PropSelect({ label, value, options, onChange, mixed }: { label: string; value: string; options: string[]; onChange: (v: string) => void; mixed?: boolean }) {
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

function PropRow({ label, value, onChange, color }: { label: string; value: string | number; onChange: (v: string) => void; color?: boolean }) {
  const isMixed = value === "mixed"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        {color && !isMixed && (
          <div style={{
            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
            background: String(value) || "#fff", border: `1px solid ${T.inputBorder}`,
          }} />
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
