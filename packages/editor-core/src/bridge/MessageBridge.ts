import type { EditorMessage, WrappedMessage } from "../protocol"
import { EDITOR_MESSAGE_SOURCE, isEditorMessage } from "../protocol"

type MessageHandler = (message: EditorMessage) => void

export class MessageBridge {
  private handlers = new Set<MessageHandler>()
  private targetWindow: Window | null = null

  constructor(private targetOrigin: string = "*") {
    this.handleMessage = this.handleMessage.bind(this)
    window.addEventListener("message", this.handleMessage)
  }

  setTarget(win: Window) {
    this.targetWindow = win
  }

  send(message: EditorMessage) {
    if (!this.targetWindow) return
    const wrapped: WrappedMessage = {
      source: EDITOR_MESSAGE_SOURCE,
      message,
    }
    this.targetWindow.postMessage(wrapped, this.targetOrigin)
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  private handleMessage(event: MessageEvent) {
    if (!isEditorMessage(event.data)) return
    const { message } = event.data
    this.handlers.forEach((handler) => handler(message))
  }

  destroy() {
    window.removeEventListener("message", this.handleMessage)
    this.handlers.clear()
    this.targetWindow = null
  }
}
