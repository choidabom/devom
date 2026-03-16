# Interaction Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit/interaction mode toggle so users can interact with real shadcn/ui components in the canvas.

**Architecture:** Shell manages mode state and sends `SET_MODE` to Canvas. Canvas disables editor event handlers and lets pointer events pass through to components in interaction mode.

**Tech Stack:** React, MobX, TypeScript, postMessage protocol

---

## Task 1: Add `SET_MODE` to protocol

**Files:**

- Modify: `packages/editor-core/src/protocol.ts`

- [ ] **Step 1: Add `SET_MODE` to `ShellToCanvasMessage`**

Add to the union type (after `SET_VIEWPORT`):

```typescript
| { type: "SET_MODE"; payload: { mode: "edit" | "interact" } }
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor-core/src/protocol.ts
git commit -m "feat(editor-core): add SET_MODE protocol message"
```

---

## Task 2: Add mode state and toggle to Shell

**Files:**

- Modify: `apps/editor-shell/src/App.tsx`
- Modify: `apps/editor-shell/src/components/Toolbar.tsx`

- [ ] **Step 1: Add mode state to Shell App**

Add state after line 19 (`const [showExport, setShowExport] = useState(false)`):

```typescript
const [editorMode, setEditorMode] = useState<"edit" | "interact">("edit")
```

- [ ] **Step 2: Add mode toggle handler**

Add after `handleAlign`:

```typescript
const handleToggleMode = useCallback(() => {
  setEditorMode((prev) => {
    const next = prev === "edit" ? "interact" : "edit"
    bridge.send({ type: "SET_MODE", payload: { mode: next } })
    if (next === "interact") selectionStore.clear()
    return next
  })
}, [])
```

- [ ] **Step 3: Add keyboard shortcut for mode toggle**

In the `onKeyDown` handler (inside the `useEffect`), add before the closing `}`:

```typescript
if (e.key === "v" || e.key === "V") {
  if (editorMode !== "edit") {
    setEditorMode("edit")
    bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
  }
}
if (e.key === "p" || e.key === "P") {
  if (editorMode !== "interact") {
    setEditorMode("interact")
    selectionStore.clear()
    bridge.send({ type: "SET_MODE", payload: { mode: "interact" } })
  }
}
```

- [ ] **Step 4: Pass mode props to Toolbar**

Add `editorMode` and `onToggleMode` props to `<Toolbar>`:

```tsx
<Toolbar
  ...existing props...
  editorMode={editorMode}
  onToggleMode={handleToggleMode}
/>
```

- [ ] **Step 5: Disable editor features in interaction mode**

Wrap the selection-dependent rendering. The Properties Panel area should show a message when in interaction mode:

```tsx
{
  editorMode === "interact" ? (
    <div style={{ padding: 20, color: T.textMuted, fontSize: 13, textAlign: "center" }}>
      Interaction Mode
      <br />
      <span style={{ fontSize: 11 }}>Press V to return to edit mode</span>
    </div>
  ) : selectedElements.length > 0 ? (
    <PropertiesPanel />
  ) : (
    <div style={{ padding: 20, color: T.textMuted, fontSize: 13, textAlign: "center" }}>Select an element</div>
  )
}
```

- [ ] **Step 6: Handle ESC key from canvas for mode switch**

In the `KEY_EVENT` handler, add:

```typescript
if (k.key === "Escape" && editorMode === "interact") {
  setEditorMode("edit")
  bridge.send({ type: "SET_MODE", payload: { mode: "edit" } })
}
```

- [ ] **Step 7: Add toggle button to Toolbar**

Read Toolbar.tsx, then add `editorMode` and `onToggleMode` to props interface. Add a toggle button in the toolbar (before the undo/redo buttons):

```tsx
<button
  onClick={onToggleMode}
  style={{ ...buttonStyle, background: editorMode === "interact" ? "#6366f1" : undefined, color: editorMode === "interact" ? "#fff" : undefined }}
  title={editorMode === "edit" ? "Interaction Mode (P)" : "Edit Mode (V)"}
>
  {editorMode === "edit" ? "▶" : "✎"}
</button>
```

- [ ] **Step 8: Commit**

```bash
git add apps/editor-shell/src/App.tsx apps/editor-shell/src/components/Toolbar.tsx
git commit -m "feat(editor-shell): add edit/interaction mode toggle with keyboard shortcuts"
```

---

## Task 3: Handle mode in Canvas

**Files:**

- Modify: `apps/editor-canvas/src/App.tsx`
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

- [ ] **Step 1: Add mode state to Canvas App**

Add state:

```typescript
const [editorMode, setEditorMode] = useState<"edit" | "interact">("edit")
```

- [ ] **Step 2: Handle `SET_MODE` message**

In `handleShellMessage` switch, add:

```typescript
case "SET_MODE":
  setEditorMode(msg.payload.mode)
  if (msg.payload.mode === "interact") setSelectedIds([])
  break
```

- [ ] **Step 3: Disable marquee and selection in interaction mode**

Wrap the canvas pointer handlers:

```typescript
onPointerDown={editorMode === "edit" ? handleCanvasPointerDown : undefined}
onPointerMove={editorMode === "edit" ? handleCanvasPointerMove : undefined}
onPointerUp={editorMode === "edit" ? handleCanvasPointerUp : undefined}
```

Hide SelectionOverlay and SnapGuides:

```tsx
{
  editorMode === "edit" && !isDragging && selectedIds.map((id) => <SelectionOverlay key={id} elementId={id} documentStore={documentStore} bridge={bridge} />)
}
{
  editorMode === "edit" && <SnapGuides lines={snapLines} />
}
```

- [ ] **Step 4: Pass mode to ElementRenderer**

Add `editorMode` prop to ElementRenderer interface and pass it:

```tsx
<ElementRenderer ... editorMode={editorMode} />
```

Also pass it recursively in ElementRenderer's children rendering.

- [ ] **Step 5: Skip editor handlers in ElementRenderer when interaction mode**

In `handleClick`: add early return if interaction mode.

```typescript
const handleClick = (e: React.MouseEvent) => {
  if (editorMode === "interact") return
  e.stopPropagation()
  ...
```

In `handlePointerDown`: add early return if interaction mode.

```typescript
const handlePointerDown = (e: React.PointerEvent) => {
  if (editorMode === "interact") return
  ...
```

- [ ] **Step 6: Remove readOnly and editor styling in interaction mode**

In ElementRenderer's render, adjust the div style:

```typescript
style={{
  ...element.style,
  outline: editorMode === "edit" && isSelected ? "1.5px dashed #6366f1" : undefined,
  outlineOffset: editorMode === "edit" && isSelected ? 2 : undefined,
  cursor: editorMode === "interact" ? undefined : (element.locked || isRoot ? "default" : "move"),
  userSelect: editorMode === "interact" ? undefined : "none",
}}
```

Remove `stopPropagation` and `readOnly` behavior: In `getElementContent`, the `input` and `sc:input` cases have `readOnly`. Pass `editorMode` to `getElementContent` and conditionally set `readOnly`:

```typescript
const content = getElementContent(element.type, element.props, editorMode)
```

Update `getElementContent` signature:

```typescript
function getElementContent(type: string, props: Record<string, unknown>, editorMode: "edit" | "interact"): React.ReactNode {
```

For `input` case, change `readOnly` to `readOnly={editorMode === "edit"}`.
For `sc:input` case, change `readOnly` to `readOnly={editorMode === "edit"}`.

- [ ] **Step 7: Commit**

```bash
git add apps/editor-canvas/src/App.tsx apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): support interaction mode with component passthrough"
```

---

## Task 4: Build and verify

- [ ] **Step 1: Build all packages**

```bash
pnpm build:packages
```

- [ ] **Step 2: Verify both apps build successfully**

```bash
pnpm --filter @devom/editor-shell build
pnpm --filter @devom/editor-canvas build
```
