import type { CSSProperties } from "react"
import type { CanvasMode, EditorElement, ElementBounds, LayoutProps, PageViewportWidth, SizingProps } from "./types"

// Shell -> Canvas messages
export type ShellToCanvasMessage =
  | { type: "SYNC_DOCUMENT"; payload: { elements: Record<string, EditorElement>; rootId: string } }
  | { type: "ADD_ELEMENT"; payload: EditorElement }
  | { type: "DELETE_ELEMENT"; payload: { id: string } }
  | { type: "UPDATE_STYLE"; payload: { id: string; style: Partial<CSSProperties> } }
  | { type: "UPDATE_PROPS"; payload: { id: string; props: Record<string, unknown> } }
  | { type: "SELECT_ELEMENT"; payload: { ids: string[] } }
  | { type: "MOVE_ELEMENT"; payload: { id: string; parentId: string; index: number } }
  | { type: "SET_VIEWPORT"; payload: { width: number; height: number } }
  | { type: "TOGGLE_LOCK"; payload: { ids: string[] } }
  | { type: "SET_MODE"; payload: { mode: "edit" | "interact" } }
  | { type: "SET_LAYOUT_MODE"; payload: { id: string; mode: "none" | "flex" } }
  | { type: "UPDATE_LAYOUT_PROPS"; payload: { id: string; layoutProps: Partial<LayoutProps> } }
  | { type: "UPDATE_SIZING"; payload: { id: string; sizing: Partial<SizingProps> } }
  | { type: "SET_CANVAS_MODE"; payload: { mode: CanvasMode } }
  | { type: "SET_PAGE_VIEWPORT"; payload: { width: PageViewportWidth } }

// Canvas -> Shell messages
export type CanvasToShellMessage =
  | { type: "CANVAS_READY" }
  | { type: "ELEMENT_CLICKED"; payload: { id: string; bounds: ElementBounds; shiftKey: boolean } }
  | { type: "ELEMENT_MOVED"; payload: { id: string; x: number; y: number } }
  | { type: "ELEMENTS_MOVED"; payload: { moves: Array<{ id: string; x: number; y: number }> } }
  | { type: "ELEMENT_RESIZED"; payload: { id: string; width: number; height: number } }
  | { type: "CANVAS_CLICKED" }
  | { type: "MARQUEE_SELECT"; payload: { ids: string[] } }
  | { type: "KEY_EVENT"; payload: { key: string; code: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean } }
  | { type: "REORDER_CHILD"; payload: { parentId: string; childId: string; newIndex: number } }
  | { type: "REPARENT_ELEMENT"; payload: { id: string; oldParentId: string; newParentId: string; index: number; dropPosition?: { x: number; y: number } } }
  | { type: "SET_PAGE_VIEWPORT_REQUEST"; payload: { width: PageViewportWidth } }

export type EditorMessage = ShellToCanvasMessage | CanvasToShellMessage

export const EDITOR_MESSAGE_SOURCE = "devom-editor" as const

export interface WrappedMessage {
  source: typeof EDITOR_MESSAGE_SOURCE
  message: EditorMessage
}

export function wrapMessage(message: EditorMessage): WrappedMessage {
  return { source: EDITOR_MESSAGE_SOURCE, message }
}

export function isEditorMessage(data: unknown): data is WrappedMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "source" in data &&
    (data as WrappedMessage).source === EDITOR_MESSAGE_SOURCE
  )
}
