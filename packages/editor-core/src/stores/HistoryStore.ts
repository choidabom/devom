import { makeAutoObservable } from "mobx"
import type { DocumentStore } from "./DocumentStore"
import type { EditorElement } from "../types"

interface Snapshot {
  elements: Record<string, EditorElement>
  rootId: string
}

const MAX_HISTORY = 50

export class HistoryStore {
  undoStack: Snapshot[] = []
  redoStack: Snapshot[] = []

  constructor(private documentStore: DocumentStore) {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  pushSnapshot() {
    const snapshot = this.documentStore.toSerializable()
    this.undoStack.push(structuredClone(snapshot))
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  undo() {
    const prev = this.undoStack.pop()
    if (!prev) return
    const current = this.documentStore.toSerializable()
    this.redoStack.push(structuredClone(current))
    this.documentStore.loadFromSerializable(prev)
  }

  redo() {
    const next = this.redoStack.pop()
    if (!next) return
    const current = this.documentStore.toSerializable()
    this.undoStack.push(structuredClone(current))
    this.documentStore.loadFromSerializable(next)
  }
}
