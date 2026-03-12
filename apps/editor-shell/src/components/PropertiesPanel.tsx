import { useState, useRef, useEffect, useCallback } from "react"
import { observer } from "mobx-react-lite"
import { Lock, Unlock } from "lucide-react"
import { HexColorPicker } from "react-colorful"
import { isAutoLayoutChild } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
import { T } from "../theme"
import { SizingSection } from "./SizingSection"

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

  // Live preview without history snapshot (for color picker drag)
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

  const inputStyle = {
    width: "100%", padding: "5px 8px",
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 6, color: T.text, fontSize: 12, boxSizing: "border-box" as const,
    outline: "none",
  }

  const isShadcn = element.type.startsWith("sc:")
  const allSameType = elements.every(el => el.type === element.type)
  const inAutoLayout = !isMulti && isAutoLayoutChild(element, (id) => documentStore.getElement(id))
  const parentEl = element.parentId ? documentStore.getElement(element.parentId) : undefined

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

      {/* Layout Mode — single select only */}
      {!isMulti && (
        <PropSection title="Layout">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropSelect
              label="Mode"
              value={element.layoutMode ?? 'none'}
              options={[
                { value: 'none', label: 'None' },
                { value: 'flex', label: 'Flex' },
                { value: 'grid', label: 'Grid' },
              ].map(opt => opt.value)}
              onChange={v => {
                historyStore.pushSnapshot()
                documentStore.setLayoutMode(element.id, v as 'none' | 'flex' | 'grid')
                syncToCanvas()
              }}
            />

            {/* Flex controls */}
            {element.layoutMode === 'flex' && element.layoutProps && (
              <>
                <PropSelect
                  label="Direction"
                  value={element.layoutProps.direction}
                  options={['row', 'column']}
                  onChange={v => updateLayoutProps({ direction: v as 'row' | 'column' })}
                />
                <PropRow
                  label="Gap"
                  value={element.layoutProps.gap}
                  onChange={v => updateLayoutProps({ gap: Number(v) || 0 })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Align</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {(['start', 'center', 'end', 'stretch'] as const).map(val => (
                      <button
                        key={val}
                        onClick={() => updateLayoutProps({ alignItems: val })}
                        style={{
                          padding: '4px 8px', fontSize: 10,
                          background: element.layoutProps!.alignItems === val ? T.accent : T.inputBg,
                          color: element.layoutProps!.alignItems === val ? '#fff' : T.text,
                          border: `1px solid ${element.layoutProps!.alignItems === val ? T.accent : T.inputBorder}`,
                          borderRadius: 4, cursor: 'pointer',
                        }}
                      >
                        {val[0]!.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Justify</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {(['start', 'center', 'end', 'space-between'] as const).map(val => (
                      <button
                        key={val}
                        onClick={() => updateLayoutProps({ justifyContent: val })}
                        style={{
                          padding: '4px 8px', fontSize: 10,
                          background: element.layoutProps!.justifyContent === val ? T.accent : T.inputBg,
                          color: element.layoutProps!.justifyContent === val ? '#fff' : T.text,
                          border: `1px solid ${element.layoutProps!.justifyContent === val ? T.accent : T.inputBorder}`,
                          borderRadius: 4, cursor: 'pointer',
                        }}
                      >
                        {val === 'space-between' ? 'SB' : val[0]!.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Padding</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, flex: 1 }}>
                    {(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const).map(key => (
                      <input
                        key={key}
                        value={element.layoutProps![key]}
                        onChange={(e) => updateLayoutProps({ [key]: Number(e.target.value) || 0 })}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Flex wrap — 모바일 반응형 대응은 추가 구현 예정">
                  <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Wrap</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {(['nowrap', 'wrap'] as const).map(val => (
                      <button
                        key={val}
                        onClick={() => updateLayoutProps({ flexWrap: val })}
                        title={val === 'wrap' ? '자식 요소가 넘칠 때 줄바꿈 (반응형 WIP)' : '줄바꿈 없음'}
                        style={{
                          padding: '4px 10px', fontSize: 10,
                          background: (element.layoutProps!.flexWrap ?? 'nowrap') === val ? T.accent : T.inputBg,
                          color: (element.layoutProps!.flexWrap ?? 'nowrap') === val ? '#fff' : T.text,
                          border: `1px solid ${(element.layoutProps!.flexWrap ?? 'nowrap') === val ? T.accent : T.inputBorder}`,
                          borderRadius: 4, cursor: 'pointer',
                        }}
                      >
                        {val === 'nowrap' ? 'No' : 'Wrap'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Grid controls */}
            {element.layoutMode === 'grid' && element.gridProps && (
              <>
                <PropRow
                  label="Columns"
                  value={element.gridProps.columns}
                  onChange={e => {
                    historyStore.pushSnapshot()
                    documentStore.updateGridProps(element.id, { columns: Number(e) })
                    syncToCanvas()
                  }}
                />
                <PropRow
                  label="Gap"
                  value={element.gridProps.gap}
                  onChange={e => {
                    historyStore.pushSnapshot()
                    documentStore.updateGridProps(element.id, { gap: Number(e) })
                    syncToCanvas()
                  }}
                />
              </>
            )}
          </div>
        </PropSection>
      )}

      {/* Position — single select, non-root elements */}
      {!isMulti && element.parentId !== null && (
        <PropSection title="Position">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {/* Absolute / Relative toggle */}
            <div style={{ display: "flex", gap: 2 }}>
              {(["absolute", "relative"] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => {
                    if (element.style.position === pos) return
                    historyStore.pushSnapshot()
                    if (pos === "relative") {
                      // Switch to relative: remove absolute coords, set auto-layout sizing
                      documentStore.updateStyle(element.id, {
                        position: "relative",
                        left: undefined,
                        top: undefined,
                      })
                      documentStore.updateSizing(element.id, { w: "fill", h: "hug" })
                    } else {
                      // Switch to absolute: set position and default coords
                      documentStore.updateStyle(element.id, {
                        position: "absolute",
                        left: 100,
                        top: 100,
                      })
                      documentStore.updateSizing(element.id, { w: "fixed", h: "fixed" })
                    }
                    syncToCanvas()
                  }}
                  style={{
                    flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 500,
                    background: element.style.position === pos ? T.accent : T.inputBg,
                    color: element.style.position === pos ? "#fff" : T.text,
                    border: `1px solid ${element.style.position === pos ? T.accent : T.inputBorder}`,
                    borderRadius: 4, cursor: "pointer",
                  }}
                >
                  {pos === "absolute" ? "Absolute" : "Relative"}
                </button>
              ))}
            </div>
            {/* X/Y inputs for absolute positioning */}
            {!inAutoLayout && (
              <PropGrid>
                <PropCompact label="X" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
                <PropCompact label="Y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
              </PropGrid>
            )}
          </div>
        </PropSection>
      )}

      {/* Sizing — single select, only for auto-layout children */}
      {!isMulti && inAutoLayout && (
        <SizingSection
          element={element}
          onUpdateSizing={updateSizing}
          onUpdateStyle={updateStyle}
          parentFlexWrap={parentEl?.layoutProps?.flexWrap}
        />
      )}

      {/* Size — single select only, not in auto-layout */}
      {!isMulti && !inAutoLayout && (!isShadcn || element.type === "sc:card" || element.type === "sc:input") && (
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

      {allSameType && element.type === "sc:checkbox" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Label" value={element.props.label as string ?? ""} onChange={(v) => updateProp("label", v)} />}
            <PropToggleRow label="Checked" value={Boolean(element.props.checked)} onChange={(v) => updatePropTyped("checked", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:switch" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Label" value={element.props.label as string ?? ""} onChange={(v) => updateProp("label", v)} />}
            <PropToggleRow label="Checked" value={Boolean(element.props.checked)} onChange={(v) => updatePropTyped("checked", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:label" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Text" value={element.props.text as string ?? "Label"} onChange={(v) => updateProp("text", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:textarea" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Placeholder" value={element.props.placeholder as string ?? ""} onChange={(v) => updateProp("placeholder", v)} />}
            <PropRow label="Rows" value={Number(element.props.rows ?? 3)} onChange={(v) => updatePropTyped("rows", Number(v) || 3)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:avatar" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Fallback" value={element.props.fallback as string ?? ""} onChange={(v) => updateProp("fallback", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:separator" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropSelect label="Orient" value={sharedProp("orientation", "horizontal")} options={["horizontal", "vertical"]} onChange={(v) => updateProp("orientation", v)} mixed={sharedProp("orientation", "horizontal") === MIXED} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:progress" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Value" value={Number(element.props.value ?? 60)} onChange={(v) => updatePropTyped("value", Math.min(100, Math.max(0, Number(v) || 0)))} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:slider" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Value" value={Number(element.props.value ?? 50)} onChange={(v) => updatePropTyped("value", Number(v) || 0)} />
            <PropRow label="Min" value={Number(element.props.min ?? 0)} onChange={(v) => updatePropTyped("min", Number(v) || 0)} />
            <PropRow label="Max" value={Number(element.props.max ?? 100)} onChange={(v) => updatePropTyped("max", Number(v) || 100)} />
            <PropRow label="Step" value={Number(element.props.step ?? 1)} onChange={(v) => updatePropTyped("step", Number(v) || 1)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:tabs" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Tabs" value={(element.props.tabs as string[] ?? []).join(", ")} onChange={(v) => updatePropTyped("tabs", v.split(",").map(s => s.trim()).filter(Boolean))} />
            <PropRow label="Active" value={element.props.activeTab as string ?? ""} onChange={(v) => updateProp("activeTab", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:alert" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Title" value={element.props.title as string ?? ""} onChange={(v) => updateProp("title", v)} />}
            {!isMulti && <PropRow label="Desc" value={element.props.description as string ?? ""} onChange={(v) => updateProp("description", v)} />}
            <PropSelect label="Variant" value={sharedProp("variant", "default")} options={["default", "destructive"]} onChange={(v) => updateProp("variant", v)} mixed={sharedProp("variant", "default") === MIXED} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:toggle" && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            {!isMulti && <PropRow label="Label" value={element.props.label as string ?? ""} onChange={(v) => updateProp("label", v)} />}
            <PropToggleRow label="Pressed" value={Boolean(element.props.pressed)} onChange={(v) => updatePropTyped("pressed", v)} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:select" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Placeholder" value={element.props.placeholder as string ?? ""} onChange={(v) => updateProp("placeholder", v)} />
            <PropRow label="Options" value={(element.props.options as string[] ?? []).join(", ")} onChange={(v) => updatePropTyped("options", v.split(",").map(s => s.trim()).filter(Boolean))} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:table" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Headers" value={(element.props.headers as string[] ?? []).join(", ")} onChange={(v) => updatePropTyped("headers", v.split(",").map(s => s.trim()).filter(Boolean))} />
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:accordion" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <span style={{ fontSize: 11, color: T.textSub }}>{(element.props.items as unknown[])?.length ?? 0} items</span>
          </div>
        </PropSection>
      )}

      {allSameType && element.type === "sc:radio-group" && !isMulti && (
        <PropSection title="Component">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <PropRow label="Label" value={element.props.label as string ?? ""} onChange={(v) => updateProp("label", v)} />
            <PropRow label="Options" value={(element.props.options as string[] ?? []).join(", ")} onChange={(v) => updatePropTyped("options", v.split(",").map(s => s.trim()).filter(Boolean))} />
            <PropRow label="Value" value={element.props.value as string ?? ""} onChange={(v) => updateProp("value", v)} />
          </div>
        </PropSection>
      )}

      {/* Image Properties */}
      {!isMulti && element.type === "image" && (() => {
        const src = String(element.props.src ?? '')
        const alt = String(element.props.alt ?? '')
        const objectFit = String(element.style.objectFit ?? 'cover')

        return (
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Image</div>

            {/* Thumbnail preview */}
            {src && (
              <div style={{ marginBottom: 8, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.inputBorder}` }}>
                <img src={src} alt={alt} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            {/* Change image button */}
            <button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = () => {
                  const file = input.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Image file size must be under 5MB')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result !== 'string') return
                    updateProp('src', reader.result)
                  }
                  reader.readAsDataURL(file)
                }
                input.click()
              }}
              style={{
                width: '100%', padding: '4px 8px', fontSize: 11, border: `1px solid ${T.inputBorder}`,
                borderRadius: 4, background: T.inputBg, cursor: 'pointer', marginBottom: 8,
              }}
            >
              Change Image
            </button>

            {/* Alt text */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>Alt Text</div>
              <input
                value={alt}
                onChange={e => updateProp('alt', e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', fontSize: 11, border: `1px solid ${T.inputBorder}`,
                  borderRadius: 4, background: T.inputBg, color: T.text, boxSizing: 'border-box',
                }}
                placeholder="Describe the image"
              />
            </div>

            {/* Object Fit */}
            <div>
              <div style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>Object Fit</div>
              <select
                value={objectFit}
                onChange={e => updateStyle('objectFit', e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', fontSize: 11, border: `1px solid ${T.inputBorder}`,
                  borderRadius: 4, background: T.inputBg, color: T.text,
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
      })()}

      {/* Text Content — single text element */}
      {!isMulti && element.type === "text" && (
        <PropSection title="Text">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <textarea
              value={String(element.props.content ?? "")}
              onChange={(e) => updateProp("content", e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "6px 8px", fontSize: 12, lineHeight: 1.5,
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, boxSizing: "border-box",
                outline: "none", resize: "vertical", fontFamily: "inherit",
              }}
            />
          </div>
        </PropSection>
      )}

      {/* Typography */}
      <PropSection title="Typography">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
          <PropRow label="Size" value={sharedStyle("fontSize", "")} onChange={(v) => updateStyle("fontSize", v)} />
          <PropSelect label="Weight" value={String(sharedStyle("fontWeight", ""))} options={["400", "500", "600", "700", "800"]} onChange={(v) => updateStyle("fontWeight", v)} mixed={sharedStyle("fontWeight", "") === MIXED} />
          <PropSelect label="Align" value={String(sharedStyle("textAlign", ""))} options={["left", "center", "right"]} onChange={(v) => updateStyle("textAlign", v)} mixed={sharedStyle("textAlign", "") === MIXED} />
          <PropRow label="Height" value={sharedStyle("lineHeight", "")} onChange={(v) => updateStyle("lineHeight", v)} />
          <PropSelect label="Decor" value={String(sharedStyle("textDecoration", "none"))} options={["none", "underline", "line-through"]} onChange={(v) => updateStyle("textDecoration", v)} mixed={sharedStyle("textDecoration", "none") === MIXED} />
        </div>
      </PropSection>

      {/* Style — shared properties (works for multi-select) */}
      <PropSection title="Style">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
          <PropRow label="Opacity" value={sharedStyle("opacity", 1)} onChange={(v) => updateStyle("opacity", v)} />
          <PropRow label="Radius" value={sharedStyle("borderRadius", 0)} onChange={(v) => updateStyle("borderRadius", v)} />
          <PropRow label="Fill" value={sharedStyle("backgroundColor", "")} onChange={(v) => updateStyle("backgroundColor", v)} onLiveChange={(v) => updateStyleLive("backgroundColor", v)} color />
          <PropRow label="Color" value={sharedStyle("color", "")} onChange={(v) => updateStyle("color", v)} onLiveChange={(v) => updateStyleLive("color", v)} color />
          <PropRow label="Border" value={sharedStyle("border", "")} onChange={(v) => updateStyle("border", v)} />
          <PropRow label="Padding" value={sharedStyle("padding", 0)} onChange={(v) => updateStyle("padding", v)} />
          <PropRow label="Gap" value={sharedStyle("gap", 0)} onChange={(v) => updateStyle("gap", v)} />
        </div>
      </PropSection>

      {/* Section Props — single select with role */}
      {!isMulti && element.role && (
        <PropSection title="Section">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: T.textSub, width: 80, flexShrink: 0 }}>Background</span>
              <ColorPickerPopover
                value={element.sectionProps?.backgroundColor ?? '#ffffff'}
                onLiveChange={v => {
                  documentStore.updateSectionProps(element.id, { backgroundColor: v })
                  syncToCanvas()
                }}
                onChange={v => {
                  historyStore.pushSnapshot()
                  documentStore.updateSectionProps(element.id, { backgroundColor: v })
                  syncToCanvas()
                }}
              />
              <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>
                {element.sectionProps?.backgroundColor ?? '#ffffff'}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: T.textSub, width: 80, flexShrink: 0 }}>Max Width</span>
              <input
                type="number"
                value={element.sectionProps?.maxWidth ?? ''}
                placeholder="auto"
                onChange={e => {
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
                onChange={e => {
                  historyStore.pushSnapshot()
                  documentStore.updateSectionProps(element.id, { verticalPadding: Number(e.target.value) })
                  syncToCanvas()
                }}
                style={inputStyle}
              />
            </div>
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

function ColorPickerPopover({ value, onChange, onLiveChange }: { value: string; onChange: (v: string) => void; onLiveChange?: (v: string) => void }) {
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

  // Commit on close: push snapshot once (only after popover was actually opened)
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

function PropToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
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

function PropRow({ label, value, onChange, color, onLiveChange }: { label: string; value: string | number; onChange: (v: string) => void; color?: boolean; onLiveChange?: (v: string) => void }) {
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
