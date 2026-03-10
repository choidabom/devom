import { makeAutoObservable, computed } from "mobx"
import type { DocumentStore } from "./DocumentStore"
import type { EditorElement, ElementBounds } from "../types"

export class SelectionStore {
  selectedId: string | null = null
  hoveredId: string | null = null
  selectedBounds: ElementBounds | null = null

  constructor(private documentStore: DocumentStore) {
    makeAutoObservable(this, {
      selectedElement: computed,
    }, { autoBind: true })
  }

  get selectedElement(): EditorElement | undefined {
    if (!this.selectedId) return undefined
    return this.documentStore.getElement(this.selectedId)
  }

  select(id: string | null, bounds?: ElementBounds) {
    this.selectedId = id
    this.selectedBounds = bounds ?? null
  }

  hover(id: string | null) {
    this.hoveredId = id
  }

  clear() {
    this.selectedId = null
    this.selectedBounds = null
  }
}
