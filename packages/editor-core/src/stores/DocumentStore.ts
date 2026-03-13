import { makeAutoObservable, observable } from "mobx"
import { nanoid } from "nanoid"
import type { CSSProperties } from "react"
import {
  DEFAULT_ELEMENT_STYLE,
  DEFAULT_GRID_PROPS,
  DEFAULT_LAYOUT_PROPS,
  DEFAULT_SIZING,
  type CanvasMode,
  type PageViewportWidth,
  type EditorElement,
  type ElementTemplate,
  type ElementType,
  type FormFieldConfig,
  type GridProps,
  type LayoutProps,
  type SectionProps,
  type SectionRole,
  type SizingProps,
} from "../types"
import { createSectionPreset } from "../presets/sectionPresets"
import { TEMPLATE_BUILDERS } from "../presets/templates"
import { getDefaultProps } from "../utils/getDefaultProps"
import { collectSubtree, pasteElements as pasteHelper, duplicateElements as duplicateHelper, importElements as importHelper } from "./helpers/cloneHelpers"
import { groupElements as groupHelper, ungroupElements as ungroupHelper } from "./helpers/groupHelpers"
import { switchCanvasMode } from "./helpers/canvasModeHelpers"

export class DocumentStore {
  elements = observable.map<string, EditorElement>()
  rootId = ""
  name = "Untitled"
  viewport = { width: 1280, height: 800 }
  canvasMode: CanvasMode = "canvas"
  pageViewport: PageViewportWidth = 1280
  currentTemplateId: string | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    this.initRoot()
    const saved = typeof window !== "undefined" ? localStorage.getItem("devom-editor-template") : null
    this.loadTemplate(saved || "galaxy-flip")
  }

  private initRoot() {
    const rootId = nanoid()
    this.rootId = rootId
    this.elements.set(rootId, {
      id: rootId,
      type: "div",
      name: "Root",
      parentId: null,
      children: [],
      style: {
        position: "relative",
        width: undefined,
        height: undefined,
        backgroundColor: "transparent",
        overflow: "visible",
      },
      props: {},
      locked: true,
      visible: true,
      layoutMode: "none" as const,
      layoutProps: { ...DEFAULT_LAYOUT_PROPS },
      sizing: { ...DEFAULT_SIZING },
      canvasPosition: null,
    })
  }

  loadTemplate(templateId: string) {
    const builder = TEMPLATE_BUILDERS[templateId]
    if (!builder) return
    this.elements.clear()
    this.initRoot()
    builder(this)
    this.currentTemplateId = templateId
    if (typeof window !== "undefined") {
      localStorage.setItem("devom-editor-template", templateId)
    }
  }

  resetDocument() {
    this.elements.clear()
    this.initRoot()
  }

  // --- Core CRUD ---

  get root(): EditorElement | undefined {
    return this.elements.get(this.rootId)
  }

  getElement(id: string): EditorElement | undefined {
    return this.elements.get(id)
  }

  getAllElements(): EditorElement[] {
    return Array.from(this.elements.values())
  }

  addElement(type: ElementType, parentId?: string, initialProps?: Record<string, unknown>): string {
    const id = nanoid()
    const targetParentId = parentId ?? this.rootId
    const parent = this.elements.get(targetParentId)
    if (!parent) return ""

    const element: EditorElement = {
      id,
      type,
      name: `${type}-${id.slice(0, 4)}`,
      parentId: targetParentId,
      children: [],
      style: { ...DEFAULT_ELEMENT_STYLE[type] },
      props: { ...getDefaultProps(type), ...(initialProps ?? {}) },
      locked: false,
      visible: true,
      layoutMode: "none" as const,
      layoutProps: { ...DEFAULT_LAYOUT_PROPS },
      sizing: { ...DEFAULT_SIZING },
      canvasPosition: null,
    }

    // Page Mode: root children default to flow layout
    if (this.canvasMode === "page" && targetParentId === this.rootId) {
      const { position, left, top, ...rest } = element.style
      element.style = { ...rest, position: "relative" as const }
      element.sizing = { w: "fill", h: "hug" }
    }

    // Auto-set layoutMode for 'form'
    if (type === "form") {
      element.layoutMode = "flex"
      element.layoutProps = { ...element.layoutProps, direction: "column", gap: 16 }
    }

    this.elements.set(id, element)
    parent.children.push(id)
    return id
  }

  addElementFromRemote(element: EditorElement) {
    this.elements.set(element.id, {
      ...element,
      layoutMode: element.layoutMode ?? "none",
      layoutProps: element.layoutProps ?? { ...DEFAULT_LAYOUT_PROPS },
      sizing: element.sizing ?? { ...DEFAULT_SIZING },
      canvasPosition: element.canvasPosition ?? null,
    })
    if (element.parentId) {
      const parent = this.elements.get(element.parentId)
      if (parent && !parent.children.includes(element.id)) {
        parent.children.push(element.id)
      }
    }
  }

  addSection(role: SectionRole, index?: number) {
    const preset = createSectionPreset(role)
    const sectionId = nanoid()
    const root = this.elements.get(this.rootId)
    if (!root) return

    const section: EditorElement = {
      ...preset.section,
      id: sectionId,
      parentId: this.rootId,
    }
    this.elements.set(sectionId, section)

    for (const childTemplate of preset.children) {
      const childId = nanoid()
      const child: EditorElement = {
        ...childTemplate,
        id: childId,
        parentId: sectionId,
      }
      this.elements.set(childId, child)
      section.children = [...section.children, childId]
    }

    if (index != null && index < root.children.length) {
      const newChildren = [...root.children]
      newChildren.splice(index, 0, sectionId)
      root.children = newChildren
    } else {
      root.children = [...root.children, sectionId]
    }
  }

  removeElement(id: string) {
    const element = this.elements.get(id)
    if (!element || id === this.rootId) return

    for (const childId of [...element.children]) {
      this.removeElement(childId)
    }

    const parent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (parent) {
      const idx = parent.children.indexOf(id)
      if (idx !== -1) parent.children.splice(idx, 1)
    }

    this.elements.delete(id)
  }

  toggleLock(id: string) {
    const element = this.elements.get(id)
    if (!element || id === this.rootId) return
    element.locked = !element.locked
  }

  // --- Style / Props ---

  updateStyle(id: string, style: Partial<CSSProperties>) {
    const element = this.elements.get(id)
    if (!element || element.locked) return
    Object.assign(element.style, style)
  }

  updateProps(id: string, props: Record<string, unknown>) {
    const element = this.elements.get(id)
    if (!element) return
    Object.assign(element.props, props)
  }

  updateFormField(id: string, formField: FormFieldConfig | undefined) {
    const element = this.elements.get(id)
    if (!element) return
    element.formField = formField
  }

  // --- Layout ---

  setLayoutMode(id: string, mode: "none" | "flex" | "grid") {
    const element = this.elements.get(id)
    if (!element || element.locked || id === this.rootId) return
    element.layoutMode = mode
    if (mode === "flex") {
      element.layoutProps = { ...DEFAULT_LAYOUT_PROPS }
      for (const childId of element.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        const { position, left, top, ...rest } = child.style
        child.style = { ...rest, position: "relative" as const }
      }
    } else if (mode === "grid") {
      if (!element.gridProps) {
        element.gridProps = { ...DEFAULT_GRID_PROPS }
      }
      for (const childId of element.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        const { position, left, top, ...rest } = child.style
        child.style = { ...rest, position: "relative" as const }
      }
    } else {
      for (const childId of element.children) {
        const child = this.elements.get(childId)
        if (!child) continue
        child.style = { ...child.style, position: "absolute" as const, left: 0, top: 0 }
      }
    }
  }

  updateLayoutProps(id: string, props: Partial<LayoutProps>) {
    const element = this.elements.get(id)
    if (!element || element.layoutMode !== "flex") return
    Object.assign(element.layoutProps, props)
  }

  updateSizing(id: string, sizing: Partial<SizingProps>) {
    const element = this.elements.get(id)
    if (!element) return
    Object.assign(element.sizing, sizing)
  }

  updateGridProps(id: string, props: Partial<GridProps>) {
    const el = this.elements.get(id)
    if (!el || !el.gridProps) return
    el.gridProps = { ...el.gridProps, ...props }
  }

  updateSectionProps(id: string, props: Partial<SectionProps>) {
    const el = this.elements.get(id)
    if (!el) return
    el.sectionProps = { ...el.sectionProps, ...props }
  }

  moveElement(id: string, newParentId: string, index: number) {
    const element = this.elements.get(id)
    const newParent = this.elements.get(newParentId)
    if (!element || !newParent || id === this.rootId) return

    const oldParent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (oldParent) {
      const idx = oldParent.children.indexOf(id)
      if (idx !== -1) oldParent.children.splice(idx, 1)
    }

    element.parentId = newParentId
    newParent.children.splice(index, 0, id)
  }

  reorderChild(parentId: string, childId: string, newIndex: number) {
    const parent = this.elements.get(parentId)
    if (!parent) return
    const oldIndex = parent.children.indexOf(childId)
    if (oldIndex === -1) return
    parent.children.splice(oldIndex, 1)
    parent.children.splice(newIndex, 0, childId)
  }

  reparentElement(id: string, newParentId: string, index: number, dropPosition?: { x: number; y: number }) {
    const element = this.elements.get(id)
    const newParent = this.elements.get(newParentId)
    if (!element || !newParent || id === this.rootId) return

    const oldParent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (oldParent) {
      const idx = oldParent.children.indexOf(id)
      if (idx !== -1) oldParent.children.splice(idx, 1)
    }

    element.parentId = newParentId
    newParent.children.splice(index, 0, id)

    if (newParent.layoutMode === "flex") {
      const { position, left, top, ...rest } = element.style
      element.style = { ...rest, position: "relative" as const }
      element.sizing = { ...DEFAULT_SIZING }
    } else {
      element.style = {
        ...element.style,
        position: "absolute" as const,
        left: dropPosition?.x ?? 0,
        top: dropPosition?.y ?? 0,
      }
    }
  }

  // --- Clone / Clipboard (delegated) ---

  collectSubtree(id: string): EditorElement[] {
    return collectSubtree(this.elements, id)
  }

  pasteElements(elements: EditorElement[], offset = 20): string[] {
    return pasteHelper(this.elements, this.rootId, this.canvasMode, elements, offset)
  }

  duplicateElements(ids: string[], offset = 20): string[] {
    return duplicateHelper(this.elements, this.rootId, this.canvasMode, ids, offset)
  }

  importElements(templates: ElementTemplate[], targetParentId?: string): string[] {
    return importHelper(this.elements, this.rootId, templates, targetParentId)
  }

  // --- Group / Ungroup (delegated) ---

  groupElements(ids: string[], elementBounds: Record<string, { left: number; top: number; width: number; height: number }>): string | null {
    return groupHelper(this.elements, this.rootId, ids, elementBounds)
  }

  ungroupElements(ids: string[]): string[] {
    return ungroupHelper(this.elements, this.rootId, ids)
  }

  // --- Form Helpers ---

  getFormFields(formId: string): Array<{ element: EditorElement; formField: FormFieldConfig }> {
    const result: Array<{ element: EditorElement; formField: FormFieldConfig }> = []
    const traverse = (id: string) => {
      const el = this.elements.get(id)
      if (!el) return
      if (el.formField) result.push({ element: el, formField: el.formField })
      el.children.forEach(traverse)
    }
    traverse(formId)
    return result
  }

  // --- Canvas Mode (delegated) ---

  setCanvasMode(mode: CanvasMode) {
    if (mode === this.canvasMode) return
    switchCanvasMode(this.elements, this.rootId, mode, this.pageViewport)
    this.canvasMode = mode
  }

  setPageViewport(width: PageViewportWidth) {
    this.pageViewport = width
    if (this.canvasMode === "page") {
      const root = this.elements.get(this.rootId)
      if (root) {
        root.style = { ...root.style, width }
      }
    }
  }

  // --- Serialization ---

  toSerializable(): { elements: Record<string, EditorElement>; rootId: string } {
    const elements: Record<string, EditorElement> = {}
    this.elements.forEach((el, key) => {
      elements[key] = JSON.parse(JSON.stringify(el))
    })
    return { elements, rootId: this.rootId }
  }

  loadFromSerializable(data: { elements: Record<string, EditorElement>; rootId: string }) {
    this.elements.clear()
    for (const [key, el] of Object.entries(data.elements)) {
      this.elements.set(key, {
        ...el,
        layoutMode: el.layoutMode ?? "none",
        layoutProps: { ...DEFAULT_LAYOUT_PROPS, ...el.layoutProps },
        sizing: el.sizing ?? { ...DEFAULT_SIZING },
        canvasPosition: el.canvasPosition ?? null,
      })
    }
    this.rootId = data.rootId
  }
}
