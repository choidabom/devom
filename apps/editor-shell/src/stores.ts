import { DocumentStore, SelectionStore, HistoryStore, ViewportStore, MessageBridge } from "@devom/editor-core"

const CANVAS_ORIGIN = import.meta.env.VITE_CANVAS_ORIGIN || "http://localhost:4001"

export const documentStore = new DocumentStore()
export const selectionStore = new SelectionStore(documentStore)
export const historyStore = new HistoryStore(documentStore)
export const viewportStore = new ViewportStore()
export const bridge = new MessageBridge(CANVAS_ORIGIN)

if (import.meta.hot) {
  import.meta.hot.dispose(() => bridge.destroy())
}
