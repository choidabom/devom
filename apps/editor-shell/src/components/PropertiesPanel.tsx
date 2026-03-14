import { observer } from "mobx-react-lite"
import { Lock, Unlock } from "lucide-react"
import { isAutoLayoutChild } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"
import { SizingSection } from "./SizingSection"
import { PropSection, PropGrid, PropCompact, PropSelect, PropRow, PropToggleRow, ColorPickerPopover } from "./properties/PropWidgets"
import { COMPONENT_PROPS } from "./properties/componentPropsRegistry"
import type { FormFieldConfig } from "@devom/editor-core"

const FORM_FIELD_TYPES = new Set(["sc:input", "sc:textarea", "sc:checkbox", "sc:switch", "sc:select", "sc:radio-group", "sc:slider"])

const VALIDATION_FIELDS: Record<string, string[]> = {
  "sc:input": ["required", "min", "max", "pattern", "message"],
  "sc:textarea": ["required", "min", "max", "pattern", "message"],
  "sc:checkbox": ["required", "message"],
  "sc:switch": ["required", "message"],
  "sc:select": ["required", "message"],
  "sc:radio-group": ["required", "message"],
  "sc:slider": ["min", "max", "message"],
}

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

  const updateStyleLive = (key: string, value: string) => {
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

  const updatePropTyped = (key: string, value: unknown) => {
    historyStore.pushSnapshot()
    for (const el of elements) {
      documentStore.updateProps(el.id, { [key]: value })
    }
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateLayoutProps = (props: Record<string, unknown>) => {
    historyStore.pushSnapshot()
    for (const el of elements) {
      documentStore.updateLayoutProps(el.id, props as any)
    }
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateSizing = (sizing: Record<string, unknown>) => {
    historyStore.pushSnapshot()
    for (const el of elements) {
      documentStore.updateSizing(el.id, sizing as any)
    }
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const syncToCanvas = () => {
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateFormField = (id: string, formField: FormFieldConfig | undefined) => {
    historyStore.pushSnapshot()
    documentStore.updateFormField(id, formField)
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const updateFormRole = (value: string) => {
    historyStore.pushSnapshot()
    for (const el of elements) {
      documentStore.updateFormRole(el.id, value === "none" ? undefined : (value as "submit" | "reset"))
    }
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const inputStyle = {
    width: "100%",
    padding: "5px 8px",
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 6,
    color: T.text,
    fontSize: 12,
    boxSizing: "border-box" as const,
    outline: "none",
  }

  const isShadcn = element.type.startsWith("sc:")
  const allShadcn = elements.every((el) => el.type.startsWith("sc:"))
  const allSameType = elements.every((el) => el.type === element.type)
  const inAutoLayout = !isMulti && isAutoLayoutChild(element, (id) => documentStore.getElement(id))
  const parentEl = element.parentId ? documentStore.getElement(element.parentId) : undefined

  const MIXED = "mixed"
  const sharedStyle = (key: string, fallback: string | number = ""): string | number => {
    const vals = elements.map((el) => (el.style as Record<string, unknown>)[key] ?? fallback)
    const first = vals[0] as string | number
    return vals.every((v) => v === first) ? first : MIXED
  }
  const sharedProp = (key: string, fallback: string = "") => {
    const vals = elements.map((el) => (el.props as Record<string, unknown>)[key] ?? fallback)
    return vals.every((v) => v === vals[0]) ? String(vals[0]) : MIXED
  }

  // Render shadcn component props from registry
  const componentFields = allSameType ? COMPONENT_PROPS[element.type] : undefined
  const hasComponentProps = componentFields && componentFields.length > 0

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
            background: elements.some((el) => el.locked) ? T.accent : T.inputBg,
            color: elements.some((el) => el.locked) ? "#fff" : T.text,
            border: `1px solid ${elements.some((el) => el.locked) ? T.accent : T.inputBorder}`,
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {elements.some((el) => el.locked) ? (
            <>
              <Lock size={14} /> Locked
            </>
          ) : (
            <>
              <Unlock size={14} /> Unlocked
            </>
          )}
        </button>
      </div>

      {/* Layout Mode */}
      {!isMulti && <LayoutSection element={element} updateLayoutProps={updateLayoutProps} syncToCanvas={syncToCanvas} />}

      {/* Position */}
      {!isMulti && element.parentId !== null && <PositionSection element={element} inAutoLayout={inAutoLayout} updateStyle={updateStyle} syncToCanvas={syncToCanvas} />}

      {/* Sizing — auto-layout children */}
      {!isMulti && inAutoLayout && <SizingSection element={element} onUpdateSizing={updateSizing} onUpdateStyle={updateStyle} parentFlexWrap={parentEl?.layoutProps?.flexWrap} />}

      {/* Size — non auto-layout */}
      {!isMulti && !inAutoLayout && (!isShadcn || element.type === "sc:card" || element.type === "sc:input") && (
        <PropSection title="Size">
          <PropGrid>
            <PropCompact label="W" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
            <PropCompact label="H" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
          </PropGrid>
        </PropSection>
      )}

      {/* Component Props (from registry) */}
      {hasComponentProps && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {componentFields.map((field) => {
              if (field.singleOnly && isMulti) return null
              switch (field.type) {
                case "text":
                  return (
                    <PropRow
                      key={field.key}
                      label={field.label}
                      value={isMulti ? sharedProp(field.key, String(field.default ?? "")) : ((element.props[field.key] as string) ?? String(field.default ?? ""))}
                      onChange={(v) => updateProp(field.key, v)}
                    />
                  )
                case "select": {
                  // formRole is stored as a top-level EditorElement field, not in props
                  if (field.key === "formRole") {
                    const formRoleValue = element.formRole ?? "none"
                    return <PropSelect key={field.key} label={field.label} value={formRoleValue} options={field.options!} onChange={(v) => updateFormRole(v)} />
                  }
                  return (
                    <PropSelect
                      key={field.key}
                      label={field.label}
                      value={sharedProp(field.key, String(field.default ?? ""))}
                      options={field.options!}
                      onChange={(v) => updateProp(field.key, v)}
                      mixed={sharedProp(field.key, String(field.default ?? "")) === MIXED}
                    />
                  )
                }
                case "toggle":
                  return <PropToggleRow key={field.key} label={field.label} value={Boolean(element.props[field.key])} onChange={(v) => updatePropTyped(field.key, v)} />
                case "number": {
                  const val = Number(element.props[field.key] ?? field.default ?? 0)
                  return (
                    <PropRow
                      key={field.key}
                      label={field.label}
                      value={val}
                      onChange={(v) => {
                        let num = Number(v) || 0
                        if (field.min != null) num = Math.max(field.min, num)
                        if (field.max != null) num = Math.min(field.max, num)
                        updatePropTyped(field.key, num)
                      }}
                    />
                  )
                }
                case "csv":
                  return (
                    <PropRow
                      key={field.key}
                      label={field.label}
                      value={((element.props[field.key] as string[]) ?? []).join(", ")}
                      onChange={(v) =>
                        updatePropTyped(
                          field.key,
                          v
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                  )
                default:
                  return null
              }
            })}
          </div>
        </PropSection>
      )}

      {/* Accordion special case (info only) */}
      {allSameType && element.type === "sc:accordion" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <span style={{ fontSize: 11, color: T.textSub }}>{(element.props.items as unknown[])?.length ?? 0} items</span>
          </div>
        </PropSection>
      )}

      {/* Image Properties */}
      {!isMulti && element.type === "image" && <ImageSection element={element} updateProp={updateProp} updateStyle={updateStyle} />}

      {/* Video Properties */}
      {!isMulti && element.type === "video" && <VideoSection element={element} updateProp={updateProp} updateStyle={updateStyle} />}

      {/* Text Content */}
      {!isMulti && element.type === "text" && (
        <PropSection title="Text">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <textarea
              value={String(element.props.content ?? "")}
              onChange={(e) => updateProp("content", e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: 12,
                lineHeight: 1.5,
                background: T.inputBg,
                border: `1px solid ${T.inputBorder}`,
                borderRadius: 6,
                color: T.text,
                boxSizing: "border-box",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        </PropSection>
      )}

      {/* Typography */}
      {!allShadcn && (
        <PropSection title="Typography">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Size" value={sharedStyle("fontSize", "")} onChange={(v) => updateStyle("fontSize", v)} />
            <PropSelect
              label="Weight"
              value={String(sharedStyle("fontWeight", ""))}
              options={["400", "500", "600", "700", "800"]}
              onChange={(v) => updateStyle("fontWeight", v)}
              mixed={sharedStyle("fontWeight", "") === MIXED}
            />
            <PropSelect
              label="Align"
              value={String(sharedStyle("textAlign", ""))}
              options={["left", "center", "right"]}
              onChange={(v) => updateStyle("textAlign", v)}
              mixed={sharedStyle("textAlign", "") === MIXED}
            />
            <PropRow label="Height" value={sharedStyle("lineHeight", "")} onChange={(v) => updateStyle("lineHeight", v)} />
            <PropSelect
              label="Decor"
              value={String(sharedStyle("textDecoration", "none"))}
              options={["none", "underline", "line-through"]}
              onChange={(v) => updateStyle("textDecoration", v)}
              mixed={sharedStyle("textDecoration", "none") === MIXED}
            />
          </div>
        </PropSection>
      )}

      {/* Style */}
      {!allShadcn && (
        <PropSection title="Style">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Opacity" value={sharedStyle("opacity", 1)} onChange={(v) => updateStyle("opacity", v)} />
            <PropRow label="Radius" value={sharedStyle("borderRadius", 0)} onChange={(v) => updateStyle("borderRadius", v)} />
            <PropRow
              label="Fill"
              value={sharedStyle("backgroundColor", "")}
              onChange={(v) => updateStyle("backgroundColor", v)}
              onLiveChange={(v) => updateStyleLive("backgroundColor", v)}
              color
            />
            <PropRow label="Color" value={sharedStyle("color", "")} onChange={(v) => updateStyle("color", v)} onLiveChange={(v) => updateStyleLive("color", v)} color />
            <PropRow label="Border" value={sharedStyle("border", "")} onChange={(v) => updateStyle("border", v)} />
            <PropRow label="Padding" value={sharedStyle("padding", 0)} onChange={(v) => updateStyle("padding", v)} />
            <PropRow label="Gap" value={sharedStyle("gap", 0)} onChange={(v) => updateStyle("gap", v)} />
          </div>
        </PropSection>
      )}

      {/* Section Props */}
      {!isMulti && element.role && <SectionPropsSection element={element} inputStyle={inputStyle} syncToCanvas={syncToCanvas} />}

      {/* Form Field Section */}
      {!isMulti && FORM_FIELD_TYPES.has(element.type) && (
        <FormFieldSection element={element} updateFormField={(formField) => updateFormField(element.id, formField)} syncToCanvas={syncToCanvas} />
      )}

      {/* Form Container Section */}
      {!isMulti && element.type === "form" && <FormContainerSection element={element} updateProp={updateProp} />}
    </div>
  )
})

// --- Sub-sections extracted from the main panel ---

import type { EditorElement } from "@devom/editor-core"

function LayoutSection({
  element,
  updateLayoutProps,
  syncToCanvas,
}: {
  element: EditorElement
  updateLayoutProps: (p: Record<string, unknown>) => void
  syncToCanvas: () => void
}) {
  return (
    <PropSection title="Layout">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
        <PropSelect
          label="Mode"
          value={element.layoutMode ?? "none"}
          options={["none", "flex", "grid"]}
          onChange={(v) => {
            historyStore.pushSnapshot()
            documentStore.setLayoutMode(element.id, v as "none" | "flex" | "grid")
            syncToCanvas()
          }}
        />

        {element.layoutMode === "flex" && element.layoutProps && (
          <>
            <PropSelect
              label="Direction"
              value={element.layoutProps.direction}
              options={["row", "column"]}
              onChange={(v) => updateLayoutProps({ direction: v as "row" | "column" })}
            />
            <PropRow label="Gap" value={element.layoutProps.gap} onChange={(v) => updateLayoutProps({ gap: Number(v) || 0 })} />
            <SegmentedControl
              label="Align"
              options={["start", "center", "end", "stretch"] as const}
              value={element.layoutProps.alignItems}
              onSelect={(val) => updateLayoutProps({ alignItems: val })}
              format={(v) => v[0]!.toUpperCase()}
            />
            <SegmentedControl
              label="Justify"
              options={["start", "center", "end", "space-between"] as const}
              value={element.layoutProps.justifyContent}
              onSelect={(val) => updateLayoutProps({ justifyContent: val })}
              format={(v) => (v === "space-between" ? "SB" : v[0]!.toUpperCase())}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Padding</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, flex: 1 }}>
                {(["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] as const).map((key) => (
                  <input
                    key={key}
                    value={element.layoutProps![key]}
                    onChange={(e) => updateLayoutProps({ [key]: Number(e.target.value) || 0 })}
                    title={key.replace("padding", "").toLowerCase()}
                    style={{
                      padding: "4px 6px",
                      fontSize: 11,
                      width: "100%",
                      boxSizing: "border-box",
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: 4,
                      color: T.text,
                      outline: "none",
                      textAlign: "center",
                    }}
                  />
                ))}
              </div>
            </div>
            <SegmentedControl
              label="Wrap"
              options={["nowrap", "wrap"] as const}
              value={element.layoutProps.flexWrap ?? "nowrap"}
              onSelect={(val) => updateLayoutProps({ flexWrap: val })}
              format={(v) => (v === "nowrap" ? "No" : "Wrap")}
            />
          </>
        )}

        {element.layoutMode === "grid" && element.gridProps && (
          <>
            <PropRow
              label="Columns"
              value={element.gridProps.columns}
              onChange={(e) => {
                historyStore.pushSnapshot()
                documentStore.updateGridProps(element.id, { columns: Number(e) })
                syncToCanvas()
              }}
            />
            <PropRow
              label="Gap"
              value={element.gridProps.gap}
              onChange={(e) => {
                historyStore.pushSnapshot()
                documentStore.updateGridProps(element.id, { gap: Number(e) })
                syncToCanvas()
              }}
            />
          </>
        )}
      </div>
    </PropSection>
  )
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onSelect,
  format,
}: {
  label: string
  options: readonly T[]
  value: T
  onSelect: (v: T) => void
  format: (v: T) => string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 2 }}>
        {options.map((val) => (
          <button
            key={val}
            onClick={() => onSelect(val)}
            style={{
              padding: "4px 8px",
              fontSize: 10,
              background: value === val ? T.accent : T.inputBg,
              color: value === val ? "#fff" : T.text,
              border: `1px solid ${value === val ? T.accent : T.inputBorder}`,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {format(val)}
          </button>
        ))}
      </div>
    </div>
  )
}

const PositionSection = observer(function PositionSection({
  element,
  inAutoLayout,
  updateStyle,
  syncToCanvas,
}: {
  element: EditorElement
  inAutoLayout: boolean
  updateStyle: (k: string, v: string) => void
  syncToCanvas: () => void
}) {
  return (
    <PropSection title="Position">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
        <div style={{ display: "flex", gap: 2 }}>
          {(["absolute", "relative"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => {
                if (element.style.position === pos) return
                historyStore.pushSnapshot()
                if (pos === "relative") {
                  documentStore.updateStyle(element.id, { position: "relative", left: undefined, top: undefined })
                  documentStore.updateSizing(element.id, { w: "fill", h: "hug" })
                } else {
                  documentStore.updateStyle(element.id, { position: "absolute", left: 100, top: 100 })
                  documentStore.updateSizing(element.id, { w: "fixed", h: "fixed" })
                }
                syncToCanvas()
              }}
              style={{
                flex: 1,
                padding: "5px 0",
                fontSize: 11,
                fontWeight: 500,
                background: element.style.position === pos ? T.accent : T.inputBg,
                color: element.style.position === pos ? "#fff" : T.text,
                border: `1px solid ${element.style.position === pos ? T.accent : T.inputBorder}`,
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {pos === "absolute" ? "Absolute" : "Relative"}
            </button>
          ))}
        </div>
        {!inAutoLayout && (
          <PropGrid>
            <PropCompact label="X" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
            <PropCompact label="Y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
          </PropGrid>
        )}
      </div>
    </PropSection>
  )
})

function ImageSection({ element, updateProp, updateStyle }: { element: EditorElement; updateProp: (k: string, v: string) => void; updateStyle: (k: string, v: string) => void }) {
  const src = String(element.props.src ?? "")
  const alt = String(element.props.alt ?? "")
  const objectFit = String(element.style.objectFit ?? "cover")

  return (
    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Image</div>
      {src && (
        <div style={{ marginBottom: 8, borderRadius: 6, overflow: "hidden", border: `1px solid ${T.inputBorder}` }}>
          <img src={src} alt={alt} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
        </div>
      )}
      <button
        onClick={() => {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = "image/*"
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) {
              alert("Image file size must be under 5MB")
              return
            }
            const reader = new FileReader()
            reader.onload = () => {
              if (typeof reader.result === "string") updateProp("src", reader.result)
            }
            reader.readAsDataURL(file)
          }
          input.click()
        }}
        style={{
          width: "100%",
          padding: "4px 8px",
          fontSize: 11,
          border: `1px solid ${T.inputBorder}`,
          borderRadius: 4,
          background: T.inputBg,
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        Change Image
      </button>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>URL</div>
        <input
          value={src.startsWith("data:") ? "" : src}
          onChange={(e) => updateProp("src", e.target.value)}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: 11,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 4,
            background: T.inputBg,
            color: T.text,
            boxSizing: "border-box",
          }}
          placeholder="https://..."
        />
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>Alt Text</div>
        <input
          value={alt}
          onChange={(e) => updateProp("alt", e.target.value)}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: 11,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 4,
            background: T.inputBg,
            color: T.text,
            boxSizing: "border-box",
          }}
          placeholder="Describe the image"
        />
      </div>
      <div>
        <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>Object Fit</div>
        <select
          value={objectFit}
          onChange={(e) => updateStyle("objectFit", e.target.value)}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: 11,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 4,
            background: T.inputBg,
            color: T.text,
          }}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
  )
}

function VideoSection({ element, updateProp, updateStyle }: { element: EditorElement; updateProp: (k: string, v: string) => void; updateStyle: (k: string, v: string) => void }) {
  const src = String(element.props.src ?? "")
  const objectFit = String(element.style.objectFit ?? "cover")

  return (
    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Video</div>
      {src && (
        <div style={{ marginBottom: 8, borderRadius: 6, overflow: "hidden", border: `1px solid ${T.inputBorder}` }}>
          <video src={src} muted style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>URL</div>
        <input
          value={src}
          onChange={(e) => updateProp("src", e.target.value)}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: 11,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 4,
            background: T.inputBg,
            color: T.text,
            boxSizing: "border-box",
          }}
          placeholder="https://..."
        />
      </div>
      <div>
        <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>Object Fit</div>
        <select
          value={objectFit}
          onChange={(e) => updateStyle("objectFit", e.target.value)}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: 11,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 4,
            background: T.inputBg,
            color: T.text,
          }}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
  )
}

function SectionPropsSection({ element, inputStyle, syncToCanvas }: { element: EditorElement; inputStyle: React.CSSProperties; syncToCanvas: () => void }) {
  return (
    <PropSection title="Section">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 80, flexShrink: 0 }}>Background</span>
          <ColorPickerPopover
            value={element.sectionProps?.backgroundColor ?? "#ffffff"}
            onLiveChange={(v) => {
              documentStore.updateSectionProps(element.id, { backgroundColor: v })
              syncToCanvas()
            }}
            onChange={(v) => {
              historyStore.pushSnapshot()
              documentStore.updateSectionProps(element.id, { backgroundColor: v })
              syncToCanvas()
            }}
          />
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>{element.sectionProps?.backgroundColor ?? "#ffffff"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 80, flexShrink: 0 }}>Max Width</span>
          <input
            type="number"
            value={element.sectionProps?.maxWidth ?? ""}
            placeholder="auto"
            onChange={(e) => {
              historyStore.pushSnapshot()
              const val = e.target.value ? Number(e.target.value) : undefined
              documentStore.updateSectionProps(element.id, { maxWidth: val })
              syncToCanvas()
            }}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 80, flexShrink: 0 }}>V. Padding</span>
          <input
            type="number"
            value={element.sectionProps?.verticalPadding ?? 0}
            min={0}
            onChange={(e) => {
              historyStore.pushSnapshot()
              documentStore.updateSectionProps(element.id, { verticalPadding: Number(e.target.value) })
              syncToCanvas()
            }}
            style={inputStyle}
          />
        </div>
      </div>
    </PropSection>
  )
}

function FormFieldSection({
  element,
  updateFormField,
  syncToCanvas,
}: {
  element: EditorElement
  updateFormField: (formField: FormFieldConfig | undefined) => void
  syncToCanvas: () => void
}) {
  const isEnabled = element.formField !== undefined
  const formField = element.formField ?? { name: "", validation: {} }
  const allowedFields = VALIDATION_FIELDS[element.type] ?? []

  // Check for duplicate names
  let duplicateWarning = ""
  if (isEnabled && formField.name) {
    const formId = findParentForm(element.id)
    if (formId) {
      const fields = documentStore.getFormFields(formId)
      const duplicates = fields.filter((f) => f.formField.name === formField.name && f.element.id !== element.id)
      if (duplicates.length > 0) {
        duplicateWarning = "Duplicate field name in form"
      }
    }
  }

  const toggleEnable = () => {
    if (isEnabled) {
      updateFormField(undefined)
    } else {
      const defaultName = element.type.replace("sc:", "") + "_" + (Date.now() % 1000)
      updateFormField({ name: defaultName })
    }
  }

  const updateField = (key: keyof FormFieldConfig, value: unknown) => {
    const updated = { ...formField, [key]: value }
    updateFormField(updated)
  }

  const updateValidation = (key: string, value: unknown) => {
    const updated = { ...formField, validation: { ...formField.validation, [key]: value } }
    updateFormField(updated)
  }

  return (
    <PropSection title="Form Field">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: T.textSub }}>Enable</span>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={isEnabled} onChange={toggleEnable} style={{ marginRight: 6 }} />
          </label>
        </div>

        {isEnabled && (
          <>
            <div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Name</div>
              <input
                type="text"
                value={formField.name}
                onChange={(e) => updateField("name", e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  background: T.inputBg,
                  border: `1px solid ${duplicateWarning ? "#ef4444" : T.inputBorder}`,
                  borderRadius: 6,
                  color: T.text,
                  fontSize: 12,
                  boxSizing: "border-box",
                  outline: "none",
                }}
                placeholder="field_name"
              />
              {duplicateWarning && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 2 }}>{duplicateWarning}</div>}
            </div>

            <div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Default Value</div>
              <input
                type="text"
                value={String(formField.defaultValue ?? "")}
                onChange={(e) => updateField("defaultValue", e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  background: T.inputBg,
                  border: `1px solid ${T.inputBorder}`,
                  borderRadius: 6,
                  color: T.text,
                  fontSize: 12,
                  boxSizing: "border-box",
                  outline: "none",
                }}
                placeholder=""
              />
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 6, marginTop: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSub, marginBottom: 6 }}>Validation</div>

              {allowedFields.includes("required") && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSub }}>Required</span>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(formField.validation?.required)}
                      onChange={(e) => updateValidation("required", e.target.checked)}
                      style={{ marginRight: 6 }}
                    />
                  </label>
                </div>
              )}

              {allowedFields.includes("min") && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Min</div>
                  <input
                    type="number"
                    value={formField.validation?.min ?? ""}
                    onChange={(e) => updateValidation("min", e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: 6,
                      color: T.text,
                      fontSize: 12,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    placeholder=""
                  />
                </div>
              )}

              {allowedFields.includes("max") && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Max</div>
                  <input
                    type="number"
                    value={formField.validation?.max ?? ""}
                    onChange={(e) => updateValidation("max", e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: 6,
                      color: T.text,
                      fontSize: 12,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    placeholder=""
                  />
                </div>
              )}

              {allowedFields.includes("pattern") && (
                <>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Pattern</div>
                    <select
                      value={
                        !formField.validation?.pattern
                          ? "none"
                          : formField.validation.pattern === "email" || formField.validation.pattern === "url"
                            ? formField.validation.pattern
                            : "custom"
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "none") updateValidation("pattern", undefined)
                        else if (val === "email" || val === "url") updateValidation("pattern", val)
                        else updateValidation("pattern", "")
                      }}
                      style={{
                        width: "100%",
                        padding: "5px 8px",
                        background: T.inputBg,
                        border: `1px solid ${T.inputBorder}`,
                        borderRadius: 6,
                        color: T.text,
                        fontSize: 12,
                      }}
                    >
                      <option value="none">None</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {formField.validation?.pattern && formField.validation.pattern !== "email" && formField.validation.pattern !== "url" && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Custom Pattern</div>
                      <input
                        type="text"
                        value={formField.validation.pattern}
                        onChange={(e) => updateValidation("pattern", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "5px 8px",
                          background: T.inputBg,
                          border: `1px solid ${T.inputBorder}`,
                          borderRadius: 6,
                          color: T.text,
                          fontSize: 12,
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                        placeholder="regex pattern"
                      />
                    </div>
                  )}
                </>
              )}

              {allowedFields.includes("message") && (
                <div>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Error Message</div>
                  <input
                    type="text"
                    value={formField.validation?.message ?? ""}
                    onChange={(e) => updateValidation("message", e.target.value || undefined)}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: 6,
                      color: T.text,
                      fontSize: 12,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    placeholder="Custom error message"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PropSection>
  )
}

function FormContainerSection({ element, updateProp }: { element: EditorElement; updateProp: (k: string, v: string) => void }) {
  const formName = String(element.props.name ?? "")
  const fieldCount = documentStore.getFormFields(element.id).length

  return (
    <PropSection title="Form Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
        <div>
          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>Name</div>
          <input
            type="text"
            value={formName}
            onChange={(e) => updateProp("name", e.target.value)}
            style={{
              width: "100%",
              padding: "5px 8px",
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: 6,
              color: T.text,
              fontSize: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
            placeholder="form_name"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSub }}>
          <span>Fields</span>
          <span style={{ fontWeight: 600, color: T.text }}>{fieldCount}</span>
        </div>
      </div>
    </PropSection>
  )
}

// Helper to find parent form container
function findParentForm(elementId: string): string | null {
  let current = documentStore.getElement(elementId)
  while (current && current.parentId) {
    const parent = documentStore.getElement(current.parentId)
    if (parent?.type === "form") return parent.id
    current = parent
  }
  return null
}
