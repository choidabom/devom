import { type ReactNode, useState, useRef, useEffect, useCallback } from "react"
import {
  Plus,
  Type,
  ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  Settings,
  ChevronDown,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowLeftRight,
  ArrowUpDown,
  PanelTop,
  LayoutDashboard,
  LayoutTemplate,
  FileDown,
  Check,
  ClipboardList,
} from "lucide-react"
import type { ElementType, FormPresetId, SectionRole } from "@devom/editor-core"
import { TEMPLATES, FORM_PRESETS } from "@devom/editor-core"
import { T } from "../theme"

export type AlignType = "left" | "center-h" | "right" | "top" | "center-v" | "bottom" | "distribute-h" | "distribute-v"

interface ToolbarProps {
  onAdd: (type: ElementType, props?: Record<string, unknown>) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onImportJSX?: () => void
  onDelete: () => void
  onAlign: (type: AlignType) => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  multiSelected: boolean
  editorMode: "edit" | "interact"
  onToggleMode: () => void
  canvasMode: "canvas" | "page"
  onToggleCanvasMode: () => void
  onAddSection?: (role: SectionRole) => void
  onLoadTemplate?: (templateId: string) => void
  onAddFormPreset?: (presetId: FormPresetId) => void
  currentTemplateId?: string | null
}

const S = 15

const SHADCN_COMPONENTS: { type: ElementType; label: string; category: string }[] = [
  { type: "sc:button", label: "Button", category: "Input" },
  { type: "sc:input", label: "Input", category: "Input" },
  { type: "sc:textarea", label: "Textarea", category: "Input" },
  { type: "sc:checkbox", label: "Checkbox", category: "Input" },
  { type: "sc:switch", label: "Switch", category: "Input" },
  { type: "sc:slider", label: "Slider", category: "Input" },
  { type: "sc:select", label: "Select", category: "Input" },
  { type: "sc:radio-group", label: "Radio Group", category: "Input" },
  { type: "sc:toggle", label: "Toggle", category: "Input" },
  { type: "sc:label", label: "Label", category: "Input" },
  { type: "sc:card", label: "Card", category: "Display" },
  { type: "sc:badge", label: "Badge", category: "Display" },
  { type: "sc:alert", label: "Alert", category: "Display" },
  { type: "sc:avatar", label: "Avatar", category: "Display" },
  { type: "sc:progress", label: "Progress", category: "Display" },
  { type: "sc:skeleton", label: "Skeleton", category: "Display" },
  { type: "sc:separator", label: "Separator", category: "Display" },
  { type: "sc:tabs", label: "Tabs", category: "Layout" },
  { type: "sc:accordion", label: "Accordion", category: "Layout" },
  { type: "sc:table", label: "Table", category: "Data" },
]

const FORM_ITEMS = [
  { type: "form" as const, label: "Form Container", category: "Container" },
  { type: "sc:input" as const, label: "Input", category: "Fields" },
  { type: "sc:textarea" as const, label: "Textarea", category: "Fields" },
  { type: "sc:checkbox" as const, label: "Checkbox", category: "Fields" },
  { type: "sc:switch" as const, label: "Switch", category: "Fields" },
  { type: "sc:select" as const, label: "Select", category: "Fields" },
  { type: "sc:radio-group" as const, label: "RadioGroup", category: "Fields" },
  { type: "sc:slider" as const, label: "Slider", category: "Fields" },
  { type: "sc:button" as const, label: "Submit Button", category: "Actions" },
]

const SECTION_PRESETS: { role: SectionRole; label: string }[] = [
  { role: "section", label: "Empty Section" },
  { role: "header", label: "Header" },
  { role: "hero", label: "Hero" },
  { role: "features", label: "Features" },
  { role: "cta", label: "CTA" },
  { role: "footer", label: "Footer" },
]

export function Toolbar({
  onAdd,
  onUndo,
  onRedo,
  onExport,
  onImportJSX,
  onDelete,
  onAlign,
  canUndo,
  canRedo,
  hasSelection,
  multiSelected,
  editorMode,
  onToggleMode,
  canvasMode,
  onToggleCanvasMode,
  onAddSection,
  onLoadTemplate,
  onAddFormPreset,
  currentTemplateId,
}: ToolbarProps) {
  const currentTemplateName = TEMPLATES.find((t) => t.id === currentTemplateId)?.name
  const [showShadcn, setShowShadcn] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSections, setShowSections] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const formDropRef = useRef<HTMLDivElement>(null)
  const sectionsDropRef = useRef<HTMLDivElement>(null)
  const templatesDropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size must be under 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== "string") return
        onAdd("image", { src: reader.result, alt: file.name })
      }
      reader.readAsDataURL(file)

      // Reset input so same file can be re-selected
      e.target.value = ""
    },
    [onAdd]
  )

  useEffect(() => {
    if (!showShadcn) return
    const onClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowShadcn(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [showShadcn])

  useEffect(() => {
    if (!showForm) return
    const onClick = (e: MouseEvent) => {
      if (formDropRef.current && !formDropRef.current.contains(e.target as Node)) setShowForm(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [showForm])

  useEffect(() => {
    if (!showSections) return
    const onClick = (e: MouseEvent) => {
      if (sectionsDropRef.current && !sectionsDropRef.current.contains(e.target as Node)) setShowSections(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [showSections])

  useEffect(() => {
    if (!showTemplates) return
    const onClick = (e: MouseEvent) => {
      if (templatesDropRef.current && !templatesDropRef.current.contains(e.target as Node)) setShowTemplates(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [showTemplates])

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 16px", flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 6px",
          background: T.panel,
          borderRadius: 10,
          boxShadow: T.panelShadow,
          border: `1px solid ${T.panelBorder}`,
        }}
      >
        <ToolBtn icon={<Plus size={S} />} title="Frame" onClick={() => onAdd("div")} draggableType="div" />
        <ToolBtn icon={<Type size={S} />} title="Text" onClick={() => onAdd("text")} draggableType="text" />
        <ToolBtn icon={<ImageIcon size={S} />} title="Image" onClick={() => fileInputRef.current?.click()} />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
        <ToolSep />

        {/* shadcn/ui dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <ToolBtn
            wide
            icon={
              <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600 }}>
                UI <ChevronDown size={10} />
              </span>
            }
            title="shadcn/ui Components"
            onClick={() => setShowShadcn((v) => !v)}
            active={showShadcn}
          />
          {showShadcn && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginTop: 8,
                padding: 8,
                borderRadius: 12,
                background: T.panel,
                border: `1px solid ${T.panelBorder}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                zIndex: 1000,
                width: 280,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {["Input", "Display", "Layout", "Data"].map((cat) => {
                const items = SHADCN_COMPONENTS.filter((c) => c.category === cat)
                if (items.length === 0) return null
                return (
                  <div key={cat}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, padding: "6px 8px 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>{cat}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "2px 0 6px" }}>
                      {items.map((c) => (
                        <button
                          key={c.type}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("application/devom-element", c.type)
                            e.dataTransfer.effectAllowed = "copy"
                            setShowShadcn(false)
                          }}
                          onClick={() => {
                            onAdd(c.type)
                            setShowShadcn(false)
                          }}
                          style={{
                            padding: "4px 10px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: `1px solid ${T.panelBorder}`,
                            background: "transparent",
                            color: T.text,
                            cursor: "grab",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form dropdown */}
        <div ref={formDropRef} style={{ position: "relative" }}>
          <ToolBtn icon={<ClipboardList size={S} />} title="Form" onClick={() => setShowForm((v) => !v)} active={showForm} />
          {showForm && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginTop: 8,
                padding: 8,
                borderRadius: 12,
                background: T.panel,
                border: `1px solid ${T.panelBorder}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                zIndex: 1000,
                width: 280,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {/* Presets */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, padding: "6px 8px 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Presets</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "2px 0 6px" }}>
                  {FORM_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onAddFormPreset?.(p.id)
                        setShowForm(false)
                      }}
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: `1px solid ${T.panelBorder}`,
                        background: "transparent",
                        color: T.text,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontWeight: 500 }}>{p.label}</span>
                      <span style={{ color: T.textMuted, marginLeft: 6, fontSize: 11 }}>{p.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, margin: "2px 0" }} />
              {["Container", "Fields", "Actions"].map((cat) => {
                const items = FORM_ITEMS.filter((c) => c.category === cat)
                if (items.length === 0) return null
                return (
                  <div key={cat}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, padding: "6px 8px 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>{cat}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "2px 0 6px" }}>
                      {items.map((c) => {
                        // Prepare metadata for form-specific items
                        const isField = cat === "Fields"
                        const isSubmitButton = c.type === "sc:button" && cat === "Actions"

                        // Encode extra metadata in drag data
                        const dragData = JSON.stringify({
                          type: c.type,
                          ...(isField ? { formField: { name: `field_${Date.now()}` } } : {}),
                          ...(isSubmitButton ? { formRole: "submit" } : {}),
                        })

                        return (
                          <button
                            key={c.type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/devom-element", dragData)
                              e.dataTransfer.effectAllowed = "copy"
                              setShowForm(false)
                            }}
                            onClick={() => {
                              const props: Record<string, unknown> = {}
                              if (isField) {
                                props.formField = { name: `field_${Date.now()}` }
                              }
                              if (isSubmitButton) {
                                props.formRole = "submit"
                              }
                              onAdd(c.type, props)
                              setShowForm(false)
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              borderRadius: 6,
                              border: `1px solid ${T.panelBorder}`,
                              background: "transparent",
                              color: T.text,
                              cursor: "grab",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sections dropdown - only visible in page mode */}
        {canvasMode === "page" && (
          <div ref={sectionsDropRef} style={{ position: "relative" }}>
            <ToolBtn icon={<LayoutTemplate size={S} />} title="Sections" onClick={() => setShowSections((v) => !v)} active={showSections} />
            {showSections && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  border: "1px solid #e2e8f0",
                  padding: 4,
                  zIndex: 200,
                  minWidth: 160,
                }}
              >
                {SECTION_PRESETS.map((p) => (
                  <button
                    key={p.role}
                    onClick={() => {
                      onAddSection?.(p.role)
                      setShowSections(false)
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 10px",
                      fontSize: 12,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <ToolSep />

        {/* Templates dropdown */}
        <div ref={templatesDropRef} style={{ position: "relative" }}>
          <ToolBtn
            wide
            icon={
              <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600 }}>
                {currentTemplateName ?? "Templates"} <ChevronDown size={10} />
              </span>
            }
            title="Load Template"
            onClick={() => setShowTemplates((v) => !v)}
            active={showTemplates}
          />
          {showTemplates && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                border: "1px solid #e2e8f0",
                padding: 4,
                zIndex: 200,
                minWidth: 220,
              }}
            >
              {TEMPLATES.map((t) => {
                const isActive = t.id === currentTemplateId
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (confirm("Replace current document with template?")) {
                        onLoadTemplate?.(t.id)
                      }
                      setShowTemplates(false)
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      fontSize: 12,
                      border: "none",
                      background: isActive ? T.accentLight : "none",
                      cursor: "pointer",
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isActive ? T.accentLight : "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? T.accentLight : "none")}
                  >
                    <span style={{ width: 14, flexShrink: 0, color: T.accent }}>{isActive ? <Check size={12} /> : null}</span>
                    <div>
                      <div style={{ fontWeight: 500, color: isActive ? T.accent : undefined }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <ToolSep />
        <ToolBtn icon={<Settings size={S} />} title="Export" onClick={onExport} />
        <ToolBtn icon={<FileDown size={S} />} title="Import JSX" onClick={() => onImportJSX?.()} />
        <ToolSep />

        <ToolBtn icon={<Undo2 size={S} />} title="Undo" onClick={onUndo} disabled={!canUndo} />
        <ToolBtn icon={<Redo2 size={S} />} title="Redo" onClick={onRedo} disabled={!canRedo} />
        {hasSelection && (
          <>
            <ToolSep />
            <ToolBtn icon={<Trash2 size={S} />} title="Delete" onClick={onDelete} />
          </>
        )}
        {multiSelected && (
          <>
            <ToolSep />
            <ToolBtn icon={<AlignLeft size={S} />} title="Align Left" onClick={() => onAlign("left")} />
            <ToolBtn icon={<AlignCenterHorizontal size={S} />} title="Align Center" onClick={() => onAlign("center-h")} />
            <ToolBtn icon={<AlignRight size={S} />} title="Align Right" onClick={() => onAlign("right")} />
            <ToolBtn icon={<AlignStartVertical size={S} />} title="Align Top" onClick={() => onAlign("top")} />
            <ToolBtn icon={<AlignCenterVertical size={S} />} title="Align Middle" onClick={() => onAlign("center-v")} />
            <ToolBtn icon={<AlignEndVertical size={S} />} title="Align Bottom" onClick={() => onAlign("bottom")} />
            <ToolSep />
            <ToolBtn icon={<ArrowLeftRight size={S} />} title="Distribute Horizontally" onClick={() => onAlign("distribute-h")} />
            <ToolBtn icon={<ArrowUpDown size={S} />} title="Distribute Vertically" onClick={() => onAlign("distribute-v")} />
          </>
        )}
        <ToolSep />
        <ToolBtn
          icon={canvasMode === "canvas" ? <PanelTop size={S} /> : <LayoutDashboard size={S} />}
          title={canvasMode === "canvas" ? "Page Mode" : "Canvas Mode"}
          onClick={onToggleCanvasMode}
          active={canvasMode === "page"}
        />
        <ToolBtn
          icon={editorMode === "edit" ? "▶" : "✎"}
          title={editorMode === "edit" ? "Interaction Mode (P)" : "Edit Mode (V)"}
          onClick={onToggleMode}
          active={editorMode === "interact"}
        />
      </div>
    </div>
  )
}

function ToolBtn({
  icon,
  title,
  onClick,
  disabled,
  active,
  wide,
  draggableType,
}: {
  icon: ReactNode
  title: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  wide?: boolean
  draggableType?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={!!draggableType}
      onDragStart={
        draggableType
          ? (e) => {
              e.dataTransfer.setData("application/devom-element", draggableType)
              e.dataTransfer.effectAllowed = "copy"
            }
          : undefined
      }
    >
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...(wide ? { height: 32, padding: "0 10px" } : { width: 32, height: 32, padding: 0 }),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? T.accentLight : hovered && !disabled ? T.hover : "transparent",
          color: disabled ? T.textMuted : active ? T.accent : T.text,
          border: "none",
          borderRadius: 8,
          cursor: disabled ? "default" : draggableType ? "grab" : "pointer",
          fontSize: 14,
          lineHeight: 1,
          opacity: disabled ? 0.4 : 1,
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {icon}
      </button>
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 6,
            padding: "4px 8px",
            borderRadius: 6,
            background: T.text,
            color: T.bg,
            fontSize: 11,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {title}
        </div>
      )}
    </div>
  )
}

function ToolSep() {
  return <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />
}
