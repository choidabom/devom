import { useEffect } from "react"
import { selectionStore, bridge } from "../stores"

interface UseEditorKeyboardOptions {
  editorMode: "edit" | "interact"
  canvasMode: "canvas" | "page"
  handleDelete: () => void
  handleUndo: () => void
  handleRedo: () => void
  handleCopy: () => void
  handleCut: () => void
  handlePaste: () => void
  handleDuplicate: () => void
  setEditorMode: (mode: "edit" | "interact") => void
  setShowPanels: React.Dispatch<React.SetStateAction<boolean>>
}

export function useEditorKeyboard({
  editorMode,
  canvasMode,
  handleDelete,
  handleUndo,
  handleRedo,
  handleCopy,
  handleCut,
  handlePaste,
  handleDuplicate,
  setEditorMode,
  setShowPanels,
}: UseEditorKeyboardOptions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      // Modifier shortcuts take priority — use e.code for Korean IME compatibility
      if (e.metaKey || e.ctrlKey) {
        if (e.code === "Backslash") {
          e.preventDefault()
          setShowPanels((prev) => !prev)
          return
        }
        if (e.code === "KeyZ") {
          e.preventDefault()
          if (e.shiftKey) handleRedo()
          else handleUndo()
        }
        if (e.code === "KeyC") {
          e.preventDefault()
          handleCopy()
        }
        if (e.code === "KeyX") {
          e.preventDefault()
          handleCut()
        }
        if (e.code === "KeyV") {
          e.preventDefault()
          handlePaste()
        }
        if (e.code === "KeyD") {
          e.preventDefault()
          handleDuplicate()
        }
        return
      }

      // Escape exits interact mode
      if (e.key === "Escape" && editorMode === "interact") {
        setEditorMode("edit")
        bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
        setShowPanels(true)
        return
      }

      // Single-key mode switches (no modifier)
      if (e.key === "v" || e.key === "V") {
        if (editorMode !== "edit") {
          setEditorMode("edit")
          bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
          setShowPanels(true)
        }
        return
      }
      if (e.key === "p" || e.key === "P") {
        if (editorMode !== "interact") {
          setEditorMode("interact")
          selectionStore.clear()
          bridge.send({ type: "SET_MODE", payload: { mode: "interact", canvasMode } })
          if (canvasMode === "page") setShowPanels(false)
        }
        return
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleDelete, handleUndo, handleRedo, handleCopy, handleCut, handlePaste, handleDuplicate, editorMode, canvasMode, setEditorMode, setShowPanels])
}
