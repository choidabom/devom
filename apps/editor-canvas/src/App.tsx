import { useCallback, useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"
import { ElementRenderer } from "./components/ElementRenderer"
import { SelectionOverlay } from "./components/SelectionOverlay"

const SHELL_ORIGIN = import.meta.env.VITE_SHELL_ORIGIN || "http://localhost:4000"

const documentStore = new DocumentStore()
const bridge = new MessageBridge(SHELL_ORIGIN)

if (import.meta.hot) {
  import.meta.hot.dispose(() => bridge.destroy())
}

export const App = observer(function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleShellMessage = useCallback((msg: EditorMessage) => {
    switch (msg.type) {
      case "SYNC_DOCUMENT":
        documentStore.loadFromSerializable(msg.payload)
        break
      case "ADD_ELEMENT":
        documentStore.addElementFromRemote(msg.payload)
        break
      case "DELETE_ELEMENT":
        documentStore.removeElement(msg.payload.id)
        break
      case "UPDATE_STYLE":
        documentStore.updateStyle(msg.payload.id, msg.payload.style)
        break
      case "UPDATE_PROPS":
        documentStore.updateProps(msg.payload.id, msg.payload.props)
        break
      case "SELECT_ELEMENT":
        setSelectedId(msg.payload.id)
        break
    }
  }, [])

  useEffect(() => {
    bridge.setTarget(window.parent)
    const dispose = bridge.onMessage(handleShellMessage)
    bridge.send({ type: "CANVAS_READY" })

    const onKeyDown = (e: KeyboardEvent) => {
      bridge.send({
        type: "KEY_EVENT",
        payload: { key: e.key, code: e.code, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey },
      })
    }
    window.addEventListener("keydown", onKeyDown)

    return () => { dispose(); window.removeEventListener("keydown", onKeyDown) }
  }, [handleShellMessage])

  const root = documentStore.root
  if (!root) return null

  const handleCanvasClick = () => {
    setSelectedId(null)
    bridge.send({ type: "CANVAS_CLICKED" })
  }

  return (
    <div
      style={{ width: "100%", height: "100%", background: "#eeeef2", position: "relative" }}
      onClick={handleCanvasClick}
    >
      <ElementRenderer elementId={root.id} selectedId={selectedId} onSelect={setSelectedId} onDragChange={setIsDragging} documentStore={documentStore} bridge={bridge} />
      {selectedId && !isDragging && <SelectionOverlay elementId={selectedId} documentStore={documentStore} bridge={bridge} />}
    </div>
  )
})
