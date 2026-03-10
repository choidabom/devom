import { DocumentStore, SelectionStore, HistoryStore, ViewportStore, MessageBridge } from "@devom/editor-core"

export const documentStore = new DocumentStore()
export const selectionStore = new SelectionStore(documentStore)
export const historyStore = new HistoryStore(documentStore)
export const viewportStore = new ViewportStore()
export const bridge = new MessageBridge("http://localhost:4001")
