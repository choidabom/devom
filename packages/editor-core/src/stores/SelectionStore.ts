import { makeAutoObservable, computed } from "mobx"
import type { DocumentStore } from "./DocumentStore"
import type { EditorElement, ElementBounds } from "../types"

export class SelectionStore {
  selectedIds: string[] = []
  hoveredId: string | null = null
  selectedBounds: ElementBounds | null = null

  constructor(private documentStore: DocumentStore) {
    makeAutoObservable(this, {
      selectedElement: computed,
      selectedElements: computed,
      selectedId: computed,
    }, { autoBind: true })
  }

  get selectedId(): string | null {
    return this.selectedIds.length > 0 ? this.selectedIds[0] : null
  }

  get selectedElement(): EditorElement | undefined {
    if (this.selectedIds.length === 0) return undefined
    return this.documentStore.getElement(this.selectedIds[0])
  }

  get selectedElements(): EditorElement[] {
    return this.selectedIds
      .map(id => this.documentStore.getElement(id))
      .filter((el): el is EditorElement => el !== undefined)
  }

  select(id: string | null, bounds?: ElementBounds) {
    this.selectedIds = id ? [id] : []
    this.selectedBounds = bounds ?? null
  }

  toggle(id: string) {
    const idx = this.selectedIds.indexOf(id)
    if (idx >= 0) {
      this.selectedIds = this.selectedIds.filter((_, i) => i !== idx)
    } else {
      this.selectedIds = [...this.selectedIds, id]
    }
    this.selectedBounds = null
  }

  setIds(ids: string[]) {
    this.selectedIds = ids
    this.selectedBounds = null
  }

  hover(id: string | null) {
    this.hoveredId = id
  }

  clear() {
    this.selectedIds = []
    this.selectedBounds = null
  }
}
