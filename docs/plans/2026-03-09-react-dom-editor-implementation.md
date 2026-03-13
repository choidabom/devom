# React DOM Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Canvas API 없이 React DOM 기반으로 UI 컴포넌트를 배치/편집하는 디자인 에디터 구축

**Architecture:** 쉘-캔버스 cross-origin 분리 아키텍처. editor-core(공유 MobX 스토어/타입), editor-shell(Vite+React 쉘 UI), editor-canvas(Vite+React 캔버스 렌더러) 3개 패키지로 구성. postMessage로 프로세스 간 통신.

**Tech Stack:** React 19, MobX, Vite, TypeScript, Radix UI, nanoid

---

## Task 1: editor-core 패키지 스캐폴딩

**Files:**

- Create: `packages/editor-core/package.json`
- Create: `packages/editor-core/tsconfig.json`
- Create: `packages/editor-core/vite.config.ts`
- Create: `packages/editor-core/src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@devom/editor-core",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "dependencies": {
    "@devom/ts-config": "workspace:*",
    "mobx": "^6.13.7",
    "mobx-react-lite": "^4.1.0",
    "nanoid": "^5.1.5"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vite-plugin-dts": "catalog:",
    "react": "catalog:react",
    "react-dom": "catalog:react",
    "@types/react": "catalog:react"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@devom/ts-config/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "mobx", "mobx-react-lite"],
    },
  },
})
```

**Step 4: Create src/index.ts (placeholder)**

```typescript
export {}
```

**Step 5: Install dependencies and verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm install && pnpm --filter @devom/editor-core build`
Expected: Build succeeds with empty output

**Step 6: Commit**

```bash
git add packages/editor-core/
git commit -m "feat(editor-core): scaffold editor-core package"
```

---

## Task 2: 타입 정의 및 프로토콜

**Files:**

- Create: `packages/editor-core/src/types.ts`
- Create: `packages/editor-core/src/protocol.ts`
- Modify: `packages/editor-core/src/index.ts`

**Step 1: Create src/types.ts**

```typescript
import type { CSSProperties } from "react"

export type ElementType = "div" | "text" | "image" | "button" | "input" | "flex" | "grid"

export interface EditorElement {
  id: string
  type: ElementType
  name: string
  parentId: string | null
  children: string[]
  style: CSSProperties
  props: Record<string, unknown>
  locked: boolean
  visible: boolean
}

export interface EditorDocument {
  id: string
  name: string
  rootId: string
  elements: Record<string, EditorElement>
  viewport: { width: number; height: number }
}

export interface ElementBounds {
  x: number
  y: number
  width: number
  height: number
}

export const DEFAULT_ELEMENT_STYLE: Record<ElementType, CSSProperties> = {
  div: {
    position: "absolute",
    width: 200,
    height: 100,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
  },
  text: {
    position: "absolute",
    fontSize: 16,
    color: "#1a202c",
  },
  image: {
    position: "absolute",
    width: 200,
    height: 200,
    objectFit: "cover",
    backgroundColor: "#cbd5e0",
  },
  button: {
    position: "absolute",
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  input: {
    position: "absolute",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    width: 200,
  },
  flex: {
    position: "relative",
    display: "flex",
    gap: 8,
    padding: 8,
    minWidth: 100,
    minHeight: 50,
    backgroundColor: "rgba(59,130,246,0.05)",
    border: "1px dashed #93c5fd",
  },
  grid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 8,
    minWidth: 100,
    minHeight: 50,
    backgroundColor: "rgba(168,85,247,0.05)",
    border: "1px dashed #c4b5fd",
  },
}
```

**Step 2: Create src/protocol.ts**

```typescript
import type { CSSProperties } from "react"
import type { EditorElement, ElementBounds, ElementType } from "./types"

// Shell -> Canvas messages
export type ShellToCanvasMessage =
  | { type: "SYNC_DOCUMENT"; payload: { elements: Record<string, EditorElement>; rootId: string } }
  | { type: "ADD_ELEMENT"; payload: EditorElement }
  | { type: "DELETE_ELEMENT"; payload: { id: string } }
  | { type: "UPDATE_STYLE"; payload: { id: string; style: Partial<CSSProperties> } }
  | { type: "UPDATE_PROPS"; payload: { id: string; props: Record<string, unknown> } }
  | { type: "SELECT_ELEMENT"; payload: { id: string | null } }
  | { type: "MOVE_ELEMENT"; payload: { id: string; parentId: string; index: number } }
  | { type: "SET_VIEWPORT"; payload: { width: number; height: number } }

// Canvas -> Shell messages
export type CanvasToShellMessage =
  | { type: "CANVAS_READY" }
  | { type: "ELEMENT_CLICKED"; payload: { id: string; bounds: ElementBounds } }
  | { type: "ELEMENT_MOVED"; payload: { id: string; x: number; y: number } }
  | { type: "ELEMENT_RESIZED"; payload: { id: string; width: number; height: number } }
  | { type: "CANVAS_CLICKED" }

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
  return typeof data === "object" && data !== null && "source" in data && (data as WrappedMessage).source === EDITOR_MESSAGE_SOURCE
}
```

**Step 3: Update src/index.ts**

```typescript
export * from "./types"
export * from "./protocol"
```

**Step 4: Build and verify**

Run: `pnpm --filter @devom/editor-core build`
Expected: Build succeeds, `dist/index.js` and `dist/index.d.ts` generated

**Step 5: Commit**

```bash
git add packages/editor-core/src/
git commit -m "feat(editor-core): add types and protocol definitions"
```

---

## Task 3: MobX DocumentStore

**Files:**

- Create: `packages/editor-core/src/stores/DocumentStore.ts`
- Create: `packages/editor-core/src/stores/index.ts`
- Modify: `packages/editor-core/src/index.ts`

**Step 1: Create src/stores/DocumentStore.ts**

```typescript
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
      elements[key] = { ...el, style: { ...el.style }, children: [...el.children] }
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
      default:
        return {}
    }
  }
}
```

**Step 2: Create src/stores/index.ts**

```typescript
export { DocumentStore } from "./DocumentStore"
```

**Step 3: Update src/index.ts**

```typescript
export * from "./types"
export * from "./protocol"
export * from "./stores"
```

**Step 4: Build and verify**

Run: `pnpm --filter @devom/editor-core build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/editor-core/src/
git commit -m "feat(editor-core): add DocumentStore with MobX"
```

---

## Task 4: SelectionStore + HistoryStore + ViewportStore

**Files:**

- Create: `packages/editor-core/src/stores/SelectionStore.ts`
- Create: `packages/editor-core/src/stores/HistoryStore.ts`
- Create: `packages/editor-core/src/stores/ViewportStore.ts`
- Modify: `packages/editor-core/src/stores/index.ts`

**Step 1: Create SelectionStore.ts**

```typescript
import { makeAutoObservable, computed } from "mobx"
import type { DocumentStore } from "./DocumentStore"
import type { EditorElement, ElementBounds } from "../types"

export class SelectionStore {
  selectedId: string | null = null
  hoveredId: string | null = null
  selectedBounds: ElementBounds | null = null

  constructor(private documentStore: DocumentStore) {
    makeAutoObservable(
      this,
      {
        selectedElement: computed,
      },
      { autoBind: true }
    )
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
```

**Step 2: Create HistoryStore.ts**

```typescript
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
```

**Step 3: Create ViewportStore.ts**

```typescript
import { makeAutoObservable } from "mobx"

export class ViewportStore {
  zoom = 1
  panX = 0
  panY = 0

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(0.1, Math.min(5, zoom))
  }

  zoomIn() {
    this.setZoom(this.zoom * 1.2)
  }

  zoomOut() {
    this.setZoom(this.zoom / 1.2)
  }

  resetZoom() {
    this.zoom = 1
    this.panX = 0
    this.panY = 0
  }

  pan(dx: number, dy: number) {
    this.panX += dx
    this.panY += dy
  }

  setPan(x: number, y: number) {
    this.panX = x
    this.panY = y
  }
}
```

**Step 4: Update stores/index.ts**

```typescript
export { DocumentStore } from "./DocumentStore"
export { SelectionStore } from "./SelectionStore"
export { HistoryStore } from "./HistoryStore"
export { ViewportStore } from "./ViewportStore"
```

**Step 5: Build and verify**

Run: `pnpm --filter @devom/editor-core build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add packages/editor-core/src/stores/
git commit -m "feat(editor-core): add Selection, History, Viewport stores"
```

---

## Task 5: MessageBridge (쉘-캔버스 통신)

**Files:**

- Create: `packages/editor-core/src/bridge/MessageBridge.ts`
- Create: `packages/editor-core/src/bridge/index.ts`
- Modify: `packages/editor-core/src/index.ts`

**Step 1: Create src/bridge/MessageBridge.ts**

```typescript
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
```

**Step 2: Create src/bridge/index.ts**

```typescript
export { MessageBridge } from "./MessageBridge"
```

**Step 3: Update src/index.ts**

```typescript
export * from "./types"
export * from "./protocol"
export * from "./stores"
export * from "./bridge"
```

**Step 4: Build and verify**

Run: `pnpm --filter @devom/editor-core build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/editor-core/src/bridge/
git commit -m "feat(editor-core): add MessageBridge for shell-canvas communication"
```

---

## Task 6: editor-canvas 앱 스캐폴딩

**Files:**

- Create: `apps/editor-canvas/package.json`
- Create: `apps/editor-canvas/tsconfig.json`
- Create: `apps/editor-canvas/vite.config.ts`
- Create: `apps/editor-canvas/index.html`
- Create: `apps/editor-canvas/src/main.tsx`
- Create: `apps/editor-canvas/src/App.tsx`

**Step 1: Create package.json**

```json
{
  "name": "@devom/editor-canvas",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 4001",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@devom/editor-core": "workspace:*",
    "mobx": "^6.13.7",
    "mobx-react-lite": "^4.1.0",
    "react": "catalog:react",
    "react-dom": "catalog:react"
  },
  "devDependencies": {
    "@types/react": "catalog:react",
    "@types/react-dom": "catalog:react",
    "@vitejs/plugin-react": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@devom/ts-config/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create vite.config.ts**

```typescript
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4001,
  },
})
```

**Step 4: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Editor Canvas</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body,
      #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Create src/main.tsx**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 6: Create src/App.tsx**

```tsx
import { useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import { DocumentStore, MessageBridge, type EditorMessage } from "@devom/editor-core"

const documentStore = new DocumentStore()
const bridge = new MessageBridge()

function handleShellMessage(msg: EditorMessage) {
  switch (msg.type) {
    case "SYNC_DOCUMENT":
      documentStore.loadFromSerializable(msg.payload)
      break
    case "ADD_ELEMENT":
      documentStore.elements.set(msg.payload.id, msg.payload)
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
  }
}

export const App = observer(function App() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    bridge.setTarget(window.parent)
    bridge.onMessage(handleShellMessage)
    bridge.send({ type: "CANVAS_READY" })
  }, [])

  const root = documentStore.root
  if (!root) return null

  return (
    <div style={{ width: "100%", height: "100%", background: "#f1f5f9" }}>
      <ElementRenderer elementId={root.id} />
    </div>
  )
})

const ElementRenderer = observer(function ElementRenderer({ elementId }: { elementId: string }) {
  const element = documentStore.getElement(elementId)
  if (!element || !element.visible) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (element.locked) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    bridge.send({
      type: "ELEMENT_CLICKED",
      payload: {
        id: element.id,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      },
    })
  }

  const content = getElementContent(element.type, element.props)

  return (
    <div data-element-id={element.id} style={element.style} onClick={handleClick}>
      {content}
      {element.children.map((childId) => (
        <ElementRenderer key={childId} elementId={childId} />
      ))}
    </div>
  )
})

function getElementContent(type: string, props: Record<string, unknown>): React.ReactNode {
  switch (type) {
    case "text":
      return String(props.content ?? "Text")
    case "button":
      return String(props.label ?? "Button")
    case "input":
      return <input placeholder={String(props.placeholder ?? "")} style={{ width: "100%", border: "none", outline: "none", background: "transparent", font: "inherit" }} readOnly />
    case "image":
      return props.src ? (
        <img src={String(props.src)} alt={String(props.alt ?? "")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Image</div>
      )
    default:
      return null
  }
}
```

**Step 7: Install dependencies and verify dev server**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm install && pnpm --filter @devom/editor-canvas dev`
Expected: Vite dev server starts on port 4001

**Step 8: Commit**

```bash
git add apps/editor-canvas/
git commit -m "feat(editor-canvas): scaffold canvas app with element renderer"
```

---

## Task 7: editor-shell 앱 스캐폴딩

**Files:**

- Create: `apps/editor-shell/package.json`
- Create: `apps/editor-shell/tsconfig.json`
- Create: `apps/editor-shell/vite.config.ts`
- Create: `apps/editor-shell/index.html`
- Create: `apps/editor-shell/src/main.tsx`
- Create: `apps/editor-shell/src/App.tsx`
- Create: `apps/editor-shell/src/stores.ts`

**Step 1: Create package.json**

```json
{
  "name": "@devom/editor-shell",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 4000",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@devom/editor-core": "workspace:*",
    "mobx": "^6.13.7",
    "mobx-react-lite": "^4.1.0",
    "react": "catalog:react",
    "react-dom": "catalog:react"
  },
  "devDependencies": {
    "@types/react": "catalog:react",
    "@types/react-dom": "catalog:react",
    "@vitejs/plugin-react": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@devom/ts-config/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create vite.config.ts**

```typescript
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4000,
  },
})
```

**Step 4: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Editor Shell</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body,
      #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Create src/stores.ts (singleton store instances)**

```typescript
import { DocumentStore, SelectionStore, HistoryStore, ViewportStore, MessageBridge } from "@devom/editor-core"

export const documentStore = new DocumentStore()
export const selectionStore = new SelectionStore(documentStore)
export const historyStore = new HistoryStore(documentStore)
export const viewportStore = new ViewportStore()
export const bridge = new MessageBridge()
```

**Step 6: Create src/main.tsx**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 7: Create src/App.tsx**

```tsx
import { useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import type { EditorMessage } from "@devom/editor-core"
import { documentStore, selectionStore, historyStore, bridge } from "./stores"

export const App = observer(function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const dispose = bridge.onMessage((msg: EditorMessage) => {
      switch (msg.type) {
        case "CANVAS_READY": {
          const data = documentStore.toSerializable()
          bridge.send({ type: "SYNC_DOCUMENT", payload: data })
          break
        }
        case "ELEMENT_CLICKED":
          selectionStore.select(msg.payload.id, msg.payload.bounds)
          break
        case "ELEMENT_MOVED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { left: msg.payload.x, top: msg.payload.y })
          bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
          break
        case "ELEMENT_RESIZED":
          historyStore.pushSnapshot()
          documentStore.updateStyle(msg.payload.id, { width: msg.payload.width, height: msg.payload.height })
          bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
          break
        case "CANVAS_CLICKED":
          selectionStore.clear()
          break
      }
    })

    return dispose
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe) {
      const onLoad = () => {
        if (iframe.contentWindow) {
          bridge.setTarget(iframe.contentWindow)
        }
      }
      iframe.addEventListener("load", onLoad)
      return () => iframe.removeEventListener("load", onLoad)
    }
  }, [])

  const handleAddElement = (type: Parameters<typeof documentStore.addElement>[0]) => {
    historyStore.pushSnapshot()
    const id = documentStore.addElement(type)
    if (id) {
      const element = documentStore.getElement(id)
      if (element) {
        bridge.send({ type: "ADD_ELEMENT", payload: element })
        selectionStore.select(id)
      }
    }
  }

  const handleDelete = () => {
    if (!selectionStore.selectedId) return
    historyStore.pushSnapshot()
    documentStore.removeElement(selectionStore.selectedId)
    selectionStore.clear()
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const handleUndo = () => {
    historyStore.undo()
    selectionStore.clear()
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const handleRedo = () => {
    historyStore.redo()
    selectionStore.clear()
    bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
  }

  const selected = selectionStore.selectedElement

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #1e293b", alignItems: "center" }}>
        <ToolButton label="div" onClick={() => handleAddElement("div")} />
        <ToolButton label="T" onClick={() => handleAddElement("text")} />
        <ToolButton label="img" onClick={() => handleAddElement("image")} />
        <ToolButton label="btn" onClick={() => handleAddElement("button")} />
        <ToolButton label="input" onClick={() => handleAddElement("input")} />
        <ToolButton label="flex" onClick={() => handleAddElement("flex")} />
        <ToolButton label="grid" onClick={() => handleAddElement("grid")} />
        <div style={{ width: 1, height: 20, background: "#334155", margin: "0 8px" }} />
        <ToolButton label="↶" onClick={handleUndo} disabled={!historyStore.canUndo} />
        <ToolButton label="↷" onClick={handleRedo} disabled={!historyStore.canRedo} />
        {selected && <ToolButton label="✕" onClick={handleDelete} />}
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Layers */}
        <div style={{ width: 200, borderRight: "1px solid #1e293b", padding: 8, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Layers</div>
          <LayerTree elementId={documentStore.rootId} depth={0} />
        </div>

        {/* Canvas iframe */}
        <div style={{ flex: 1, position: "relative" }}>
          <iframe ref={iframeRef} src="http://localhost:4001" style={{ width: "100%", height: "100%", border: "none" }} title="Editor Canvas" />
        </div>

        {/* Properties */}
        <div style={{ width: 260, borderLeft: "1px solid #1e293b", padding: 12, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Properties</div>
          {selected ? <PropertiesPanel /> : <div style={{ color: "#475569", fontSize: 13 }}>Select an element</div>}
        </div>
      </div>
    </div>
  )
})

function ToolButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 10px",
        background: disabled ? "#1e293b" : "#1e293b",
        color: disabled ? "#475569" : "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  )
}

const LayerTree = observer(function LayerTree({ elementId, depth }: { elementId: string; depth: number }) {
  const element = documentStore.getElement(elementId)
  if (!element) return null
  const isSelected = selectionStore.selectedId === elementId
  const isRoot = elementId === documentStore.rootId

  return (
    <div>
      <div
        onClick={() => !isRoot && selectionStore.select(elementId)}
        style={{
          padding: "3px 6px",
          paddingLeft: depth * 12 + 6,
          fontSize: 12,
          cursor: isRoot ? "default" : "pointer",
          background: isSelected ? "#1d4ed8" : "transparent",
          borderRadius: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {element.name}
      </div>
      {element.children.map((childId) => (
        <LayerTree key={childId} elementId={childId} depth={depth + 1} />
      ))}
    </div>
  )
})

const PropertiesPanel = observer(function PropertiesPanel() {
  const element = selectionStore.selectedElement
  if (!element) return null

  const updateStyle = (key: string, value: string | number) => {
    historyStore.pushSnapshot()
    const parsed = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value
    documentStore.updateStyle(element.id, { [key]: parsed })
    bridge.send({ type: "UPDATE_STYLE", payload: { id: element.id, style: { [key]: parsed } } })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        {element.type} — {element.name}
      </div>

      <PropSection title="Layout">
        <PropRow label="x" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
        <PropRow label="y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
        <PropRow label="w" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
        <PropRow label="h" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
      </PropSection>

      <PropSection title="Style">
        <PropRow label="bg" value={element.style.backgroundColor ?? ""} onChange={(v) => updateStyle("backgroundColor", v)} />
        <PropRow label="radius" value={element.style.borderRadius ?? 0} onChange={(v) => updateStyle("borderRadius", v)} />
        <PropRow label="opacity" value={element.style.opacity ?? 1} onChange={(v) => updateStyle("opacity", v)} />
      </PropSection>
    </div>
  )
})

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  )
}

function PropRow({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#94a3b8", width: 36 }}>{label}</span>
      <input
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "3px 6px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 3,
          color: "#e2e8f0",
          fontSize: 12,
        }}
      />
    </div>
  )
}
```

**Step 8: Install and verify**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm install && pnpm --filter @devom/editor-shell dev`
Expected: Vite dev server starts on port 4000

**Step 9: Commit**

```bash
git add apps/editor-shell/
git commit -m "feat(editor-shell): scaffold shell app with toolbar, layers, properties"
```

---

## Task 8: 캔버스 드래그 & 리사이즈

**Files:**

- Modify: `apps/editor-canvas/src/App.tsx`

**Step 1: Add drag and resize to ElementRenderer**

캔버스의 `App.tsx`에 포인터 이벤트 기반 드래그/리사이즈를 추가한다.
기존 `ElementRenderer`를 수정하여 선택 UI(파란 테두리 + 리사이즈 핸들)와 드래그 로직을 포함시킨다.

주요 변경:

- 선택된 요소에 파란 아웃라인 + 8방향 리사이즈 핸들 표시
- `pointerdown` → `pointermove` → `pointerup`으로 드래그 구현
- 드래그 완료 시 `ELEMENT_MOVED` 메시지를 쉘로 전송
- 리사이즈 완료 시 `ELEMENT_RESIZED` 메시지를 쉘로 전송
- 캔버스 빈 영역 클릭 시 `CANVAS_CLICKED` 전송하여 선택 해제

```tsx
// App.tsx 내 상태 추가
import { useState } from "react"

// 선택된 요소 ID를 캔버스 로컬 상태로 관리
const [selectedId, setSelectedId] = useState<string | null>(null)

// SELECT_ELEMENT 메시지 처리 추가
case "SELECT_ELEMENT":
  setSelectedId(msg.payload.id)
  break
```

드래그 핸들러:

```tsx
const handlePointerDown = (e: React.PointerEvent) => {
  e.stopPropagation()
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  target.setPointerCapture(e.pointerId)
  const startX = e.clientX
  const startY = e.clientY
  const startLeft = parseInt(String(element.style.left ?? 0))
  const startTop = parseInt(String(element.style.top ?? 0))

  const onMove = (me: PointerEvent) => {
    const dx = me.clientX - startX
    const dy = me.clientY - startY
    documentStore.updateStyle(element.id, {
      left: startLeft + dx,
      top: startTop + dy,
    })
  }

  const onUp = (ue: PointerEvent) => {
    target.releasePointerCapture(ue.pointerId)
    target.removeEventListener("pointermove", onMove)
    target.removeEventListener("pointerup", onUp)
    bridge.send({
      type: "ELEMENT_MOVED",
      payload: {
        id: element.id,
        x: parseInt(String(element.style.left ?? 0)),
        y: parseInt(String(element.style.top ?? 0)),
      },
    })
  }

  target.addEventListener("pointermove", onMove)
  target.addEventListener("pointerup", onUp)
}
```

**Step 2: Verify drag works**

Run both servers:

```bash
# Terminal 1
pnpm --filter @devom/editor-core build
# Terminal 2
pnpm --filter @devom/editor-canvas dev
# Terminal 3
pnpm --filter @devom/editor-shell dev
```

Open http://localhost:4000, add an element, drag it in the canvas.
Expected: Element moves, properties panel updates position values.

**Step 3: Commit**

```bash
git add apps/editor-canvas/
git commit -m "feat(editor-canvas): add drag and resize interaction"
```

---

## Task 9: 내보내기 기능

**Files:**

- Create: `packages/editor-core/src/export/jsonExport.ts`
- Create: `packages/editor-core/src/export/jsxExport.ts`
- Create: `packages/editor-core/src/export/htmlExport.ts`
- Create: `packages/editor-core/src/export/index.ts`
- Modify: `packages/editor-core/src/index.ts`

**Step 1: Create jsonExport.ts**

```typescript
import type { EditorDocument } from "../types"

export function exportToJSON(doc: EditorDocument): string {
  return JSON.stringify(doc, null, 2)
}
```

**Step 2: Create jsxExport.ts**

```typescript
import type { CSSProperties } from "react"
import type { EditorElement } from "../types"

export function exportToJSX(elements: Map<string, EditorElement>, rootId: string): string {
  const root = elements.get(rootId)
  if (!root) return ""

  const lines: string[] = []
  lines.push("export default function Component() {")
  lines.push("  return (")
  renderElement(root, elements, lines, 4)
  lines.push("  )")
  lines.push("}")
  return lines.join("\n")
}

function renderElement(el: EditorElement, elements: Map<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const tag = getTag(el)
  const styleStr = styleToString(el.style)
  const propsStr = getPropsString(el)
  const hasChildren = el.children.length > 0
  const content = getContent(el)

  if (!hasChildren && !content) {
    lines.push(`${pad}<${tag}${styleStr}${propsStr} />`)
  } else {
    lines.push(`${pad}<${tag}${styleStr}${propsStr}>`)
    if (content) lines.push(`${pad}  ${content}`)
    for (const childId of el.children) {
      const child = elements.get(childId)
      if (child) renderElement(child, elements, lines, indent + 2)
    }
    lines.push(`${pad}</${tag}>`)
  }
}

function getTag(el: EditorElement): string {
  switch (el.type) {
    case "button":
      return "button"
    case "input":
      return "input"
    case "image":
      return "img"
    default:
      return "div"
  }
}

function getContent(el: EditorElement): string {
  if (el.type === "text") return String(el.props.content ?? "")
  if (el.type === "button") return String(el.props.label ?? "")
  return ""
}

function getPropsString(el: EditorElement): string {
  if (el.type === "image" && el.props.src) return ` src="${el.props.src}" alt="${el.props.alt ?? ""}"`
  if (el.type === "input") return ` placeholder="${el.props.placeholder ?? ""}"`
  return ""
}

function styleToString(style: CSSProperties): string {
  const entries = Object.entries(style).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  const inner = entries
    .map(([k, v]) => {
      const val = typeof v === "number" ? String(v) : `"${v}"`
      return `${k}: ${val}`
    })
    .join(", ")
  return ` style={{ ${inner} }}`
}
```

**Step 3: Create htmlExport.ts**

```typescript
import type { CSSProperties } from "react"
import type { EditorElement } from "../types"

export function exportToHTML(elements: Map<string, EditorElement>, rootId: string): string {
  const root = elements.get(rootId)
  if (!root) return ""

  const lines: string[] = ["<!DOCTYPE html>", '<html><head><meta charset="UTF-8"><style>* { margin: 0; box-sizing: border-box; }</style></head>', "<body>"]
  renderHTML(root, elements, lines, 2)
  lines.push("</body></html>")
  return lines.join("\n")
}

function renderHTML(el: EditorElement, elements: Map<string, EditorElement>, lines: string[], indent: number) {
  const pad = " ".repeat(indent)
  const tag = el.type === "image" ? "img" : el.type === "button" ? "button" : el.type === "input" ? "input" : "div"
  const styleStr = cssToInline(el.style)
  const content = el.type === "text" ? String(el.props.content ?? "") : el.type === "button" ? String(el.props.label ?? "") : ""

  let attrs = styleStr ? ` style="${styleStr}"` : ""
  if (el.type === "image") attrs += ` src="${el.props.src ?? ""}" alt="${el.props.alt ?? ""}"`
  if (el.type === "input") attrs += ` placeholder="${el.props.placeholder ?? ""}"`

  if (tag === "img" || tag === "input") {
    lines.push(`${pad}<${tag}${attrs} />`)
  } else {
    lines.push(`${pad}<${tag}${attrs}>`)
    if (content) lines.push(`${pad}  ${content}`)
    for (const childId of el.children) {
      const child = elements.get(childId)
      if (child) renderHTML(child, elements, lines, indent + 2)
    }
    lines.push(`${pad}</${tag}>`)
  }
}

function cssToInline(style: CSSProperties): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const prop = k.replace(/([A-Z])/g, "-$1").toLowerCase()
      const val = typeof v === "number" && !["opacity", "zIndex", "flex", "order"].includes(k) ? `${v}px` : v
      return `${prop}: ${val}`
    })
    .join("; ")
}
```

**Step 4: Create export/index.ts**

```typescript
export { exportToJSON } from "./jsonExport"
export { exportToJSX } from "./jsxExport"
export { exportToHTML } from "./htmlExport"
```

**Step 5: Update src/index.ts**

```typescript
export * from "./types"
export * from "./protocol"
export * from "./stores"
export * from "./bridge"
export * from "./export"
```

**Step 6: Build and verify**

Run: `pnpm --filter @devom/editor-core build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add packages/editor-core/src/export/
git commit -m "feat(editor-core): add JSON, JSX, HTML export"
```

---

## Task 10: 쉘에 내보내기 UI 연결

**Files:**

- Modify: `apps/editor-shell/src/App.tsx`

**Step 1: Add export buttons and modal to shell toolbar**

쉘 툴바에 Export 버튼을 추가하고, 클릭하면 JSON/JSX/HTML 선택 모달을 표시한다.
선택하면 해당 포맷으로 변환된 코드를 `<textarea>`에 표시하고 복사 버튼을 제공한다.

```tsx
import { exportToJSON, exportToJSX, exportToHTML } from "@devom/editor-core"

// 툴바에 Export 버튼 추가
;<ToolButton label="Export" onClick={() => setShowExport(true)} />

// 모달 컴포넌트
{
  showExport && <ExportModal onClose={() => setShowExport(false)} />
}
```

**Step 2: Verify export flow**

1. Add elements on canvas
2. Click Export
3. Select JSON/JSX/HTML
4. Verify output matches elements

**Step 3: Commit**

```bash
git add apps/editor-shell/
git commit -m "feat(editor-shell): add export UI with JSON, JSX, HTML formats"
```

---

## Task 11: turbo 설정 및 통합 dev 스크립트

**Files:**

- Modify: `/Users/dabom-choi/StudySource/devom/package.json` (root)

**Step 1: Add editor dev script to root package.json**

```json
{
  "scripts": {
    "editor": "turbo run dev --filter=@devom/editor-shell --filter=@devom/editor-canvas",
    "editor:build": "turbo run build --filter=@devom/editor-core && turbo run build --filter=@devom/editor-shell --filter=@devom/editor-canvas"
  }
}
```

**Step 2: Verify both servers start**

Run: `pnpm editor`
Expected: Both Vite dev servers start (shell:4000, canvas:4001). Open http://localhost:4000 to see the editor with embedded canvas iframe.

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add editor dev and build scripts"
```

---

## Task Summary

| #   | Task                       | Package       | Description                             |
| --- | -------------------------- | ------------- | --------------------------------------- |
| 1   | editor-core 스캐폴딩       | editor-core   | package.json, tsconfig, vite config     |
| 2   | 타입 & 프로토콜            | editor-core   | EditorElement, EditorDocument, messages |
| 3   | DocumentStore              | editor-core   | MobX store for element tree             |
| 4   | Selection/History/Viewport | editor-core   | Supporting stores                       |
| 5   | MessageBridge              | editor-core   | postMessage wrapper                     |
| 6   | editor-canvas 스캐폴딩     | editor-canvas | Vite app + element renderer             |
| 7   | editor-shell 스캐폴딩      | editor-shell  | Vite app + toolbar, layers, properties  |
| 8   | 드래그 & 리사이즈          | editor-canvas | Pointer events interaction              |
| 9   | 내보내기                   | editor-core   | JSON, JSX, HTML export                  |
| 10  | 내보내기 UI                | editor-shell  | Export modal                            |
| 11  | 통합 스크립트              | root          | turbo dev/build scripts                 |
