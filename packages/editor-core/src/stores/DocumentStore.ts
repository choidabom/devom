import { makeAutoObservable, observable } from "mobx"
import { nanoid } from "nanoid"
import type { CSSProperties } from "react"
import { DEFAULT_ELEMENT_STYLE, type EditorElement, type ElementType } from "../types"

export class DocumentStore {
  elements = observable.map<string, EditorElement>()
  rootId = ""
  name = "Untitled"
  viewport = { width: 1280, height: 720 }

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    this.initRoot()
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
        width: this.viewport.width,
        height: this.viewport.height,
        backgroundColor: "#ffffff",
        overflow: "hidden",
      },
      props: {},
      locked: true,
      visible: true,
    })
  }

  get root(): EditorElement | undefined {
    return this.elements.get(this.rootId)
  }

  getElement(id: string): EditorElement | undefined {
    return this.elements.get(id)
  }

  getAllElements(): EditorElement[] {
    return Array.from(this.elements.values())
  }

  addElement(type: ElementType, parentId?: string): string {
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
      props: this.getDefaultProps(type),
      locked: false,
      visible: true,
    }

    this.elements.set(id, element)
    parent.children.push(id)
    return id
  }

  addElementFromRemote(element: EditorElement) {
    this.elements.set(element.id, element)
    if (element.parentId) {
      const parent = this.elements.get(element.parentId)
      if (parent && !parent.children.includes(element.id)) {
        parent.children.push(element.id)
      }
    }
  }

  removeElement(id: string) {
    const element = this.elements.get(id)
    if (!element || id === this.rootId) return

    // Remove children recursively
    for (const childId of [...element.children]) {
      this.removeElement(childId)
    }

    // Remove from parent's children
    const parent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (parent) {
      const idx = parent.children.indexOf(id)
      if (idx !== -1) parent.children.splice(idx, 1)
    }

    this.elements.delete(id)
  }

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

  moveElement(id: string, newParentId: string, index: number) {
    const element = this.elements.get(id)
    const newParent = this.elements.get(newParentId)
    if (!element || !newParent || id === this.rootId) return

    // Remove from old parent
    const oldParent = element.parentId ? this.elements.get(element.parentId) : undefined
    if (oldParent) {
      const idx = oldParent.children.indexOf(id)
      if (idx !== -1) oldParent.children.splice(idx, 1)
    }

    // Add to new parent
    element.parentId = newParentId
    newParent.children.splice(index, 0, id)
  }

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
      this.elements.set(key, el)
    }
    this.rootId = data.rootId
  }

  private getDefaultProps(type: ElementType): Record<string, unknown> {
    switch (type) {
      case "text":
        return { content: "Text" }
      case "image":
        return { src: "", alt: "Image" }
      case "button":
        return { label: "Button" }
      case "input":
        return { placeholder: "Enter text..." }
      case "sc:button":
        return { label: "Button", variant: "default", size: "default" }
      case "sc:card":
        return { title: "Card Title", description: "Card description", content: "Card content here." }
      case "sc:input":
        return { placeholder: "Type something...", type: "text" }
      case "sc:badge":
        return { label: "Badge", variant: "default" }
      default:
        return {}
    }
  }
}
