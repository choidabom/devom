import { observer } from "mobx-react-lite"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"

export const PropertiesPanel = observer(function PropertiesPanel() {
  const element = selectionStore.selectedElement
  if (!element) return null

  const updateStyle = (key: string, value: string) => {
    historyStore.pushSnapshot()
    const parsed = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value
    documentStore.updateStyle(element.id, { [key]: parsed })
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateProp = (key: string, value: string) => {
    historyStore.pushSnapshot()
    documentStore.updateProps(element.id, { [key]: value })
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const isShadcn = element.type.startsWith("sc:")

  return (
    <div style={{ padding: "12px 0" }}>
      {/* Position */}
      <PropSection title="Position">
        <PropGrid>
          <PropCompact label="X" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
          <PropCompact label="Y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
        </PropGrid>
      </PropSection>

      {/* Size */}
      {(!isShadcn || element.type === "sc:card" || element.type === "sc:input") && (
        <PropSection title="Size">
          <PropGrid>
            <PropCompact label="W" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
            <PropCompact label="H" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
          </PropGrid>
        </PropSection>
      )}

      {/* shadcn Component Props */}
      {element.type === "sc:button" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Label" value={element.props.label as string ?? "Button"} onChange={(v) => updateProp("label", v)} />
            <PropSelect label="Variant" value={element.props.variant as string ?? "default"} options={["default", "destructive", "outline", "secondary", "ghost", "link"]} onChange={(v) => updateProp("variant", v)} />
            <PropSelect label="Size" value={element.props.size as string ?? "default"} options={["default", "sm", "lg", "icon"]} onChange={(v) => updateProp("size", v)} />
          </div>
        </PropSection>
      )}

      {element.type === "sc:card" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Title" value={element.props.title as string ?? ""} onChange={(v) => updateProp("title", v)} />
            <PropRow label="Desc" value={element.props.description as string ?? ""} onChange={(v) => updateProp("description", v)} />
            <PropRow label="Content" value={element.props.content as string ?? ""} onChange={(v) => updateProp("content", v)} />
          </div>
        </PropSection>
      )}

      {element.type === "sc:input" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Placeholder" value={element.props.placeholder as string ?? ""} onChange={(v) => updateProp("placeholder", v)} />
            <PropSelect label="Type" value={element.props.type as string ?? "text"} options={["text", "password", "email", "number", "tel", "url", "search"]} onChange={(v) => updateProp("type", v)} />
          </div>
        </PropSection>
      )}

      {element.type === "sc:badge" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Label" value={element.props.label as string ?? "Badge"} onChange={(v) => updateProp("label", v)} />
            <PropSelect label="Variant" value={element.props.variant as string ?? "default"} options={["default", "secondary", "destructive", "outline"]} onChange={(v) => updateProp("variant", v)} />
          </div>
        </PropSection>
      )}

      {/* Style — only for non-shadcn elements */}
      {!isShadcn && (
        <PropSection title="Style">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Visible" value="Yes" onChange={() => {}} />
            <PropRow label="Opacity" value={element.style.opacity ?? 1} onChange={(v) => updateStyle("opacity", v)} />
            <PropRow label="Radius" value={element.style.borderRadius ?? 0} onChange={(v) => updateStyle("borderRadius", v)} />
            <PropRow label="Fill" value={element.style.backgroundColor ?? ""} onChange={(v) => updateStyle("backgroundColor", v)} color />
            <PropRow label="Color" value={element.style.color ?? ""} onChange={(v) => updateStyle("color", v)} color />
            <PropRow label="Padding" value={element.style.padding ?? 0} onChange={(v) => updateStyle("padding", v)} />
            <PropRow label="Gap" value={element.style.gap ?? 0} onChange={(v) => updateStyle("gap", v)} />
          </div>
        </PropSection>
      )}

      {/* Container */}
      {(element.type === "flex" || element.type === "grid") && (
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

function PropSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, padding: "5px 8px",
          background: T.inputBg, border: `1px solid ${T.inputBorder}`,
          borderRadius: 6, color: T.text, fontSize: 12, minWidth: 0,
          outline: "none", cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function PropRow({ label, value, onChange, color }: { label: string; value: string | number; onChange: (v: string) => void; color?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        {color && (
          <div style={{
            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
            background: String(value) || "#fff", border: `1px solid ${T.inputBorder}`,
          }} />
        )}
        <input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, padding: "5px 8px",
            background: T.inputBg, border: `1px solid ${T.inputBorder}`,
            borderRadius: 6, color: T.text, fontSize: 12, minWidth: 0,
            outline: "none",
          }}
        />
      </div>
    </div>
  )
}
