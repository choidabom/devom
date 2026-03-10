# Element Lock Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add element lock/unlock feature that prevents move, resize, and delete while allowing selection and property editing.

**Architecture:** Most lock guards already exist in the codebase (drag, delete, copy, duplicate, align all filter `el.locked`). This plan adds: `toggleLock()` action, lock UI in 3 locations (PropertiesPanel, LeftPanel, ContextMenu), lock icon in SelectionOverlay, and multi-drag group blocking when any selected element is locked.

**Tech Stack:** React, MobX, TypeScript, postMessage protocol

---

## Chunk 1: Core Logic + Protocol

### Task 1: Add `toggleLock` action to DocumentStore

**Files:**
- Modify: `packages/editor-core/src/stores/DocumentStore.ts:84` (before `removeElement`)

- [ ] **Step 1: Add `toggleLock` method**

After `removeElement` method (line 101), add:

```typescript
toggleLock(id: string) {
  const element = this.elements.get(id)
  if (!element || id === this.rootId) return
  element.locked = !element.locked
}
```

- [ ] **Step 2: Export `toggleLock` is auto-exposed by MobX `makeAutoObservable` — verify no additional export needed**

- [ ] **Step 3: Commit**

```bash
git add packages/editor-core/src/stores/DocumentStore.ts
git commit -m "feat(editor-core): add toggleLock action to DocumentStore"
```

### Task 2: Add `TOGGLE_LOCK` and `CONTEXT_MENU_ACTION` to protocol

**Files:**
- Modify: `packages/editor-core/src/protocol.ts`

- [ ] **Step 1: Add `TOGGLE_LOCK` to `ShellToCanvasMessage`**

Add to the union type at line 13 (after `SET_VIEWPORT`):

```typescript
| { type: "TOGGLE_LOCK"; payload: { ids: string[] } }
```

- [ ] **Step 2: Add `CONTEXT_MENU_ACTION` to `CanvasToShellMessage`**

Add to the union type at line 24 (after `KEY_EVENT`):

```typescript
| { type: "CONTEXT_MENU_ACTION"; payload: { action: "lock" | "unlock"; ids: string[] } }
```

- [ ] **Step 3: Commit**

```bash
git add packages/editor-core/src/protocol.ts
git commit -m "feat(editor-core): add TOGGLE_LOCK and CONTEXT_MENU_ACTION protocol messages"
```

### Task 3: Block multi-drag when any selected element is locked

**Files:**
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

Currently the drag handler (line 49) blocks drag only for the clicked element itself. When a non-locked element is dragged as part of a group containing locked elements, the non-locked ones still move. The design requires blocking the entire group.

- [ ] **Step 1: Add group-lock check after pointer capture setup**

After line 59 (`const startY = e.clientY`), insert the group-lock check BEFORE the existing `dragIds` line (line 61):

```typescript
// Block entire group drag if any selected element is locked
const dragIds = selectedIds.includes(elementId) ? selectedIds : [elementId]
const hasLockedInGroup = dragIds.some(id => {
  const el = documentStore.getElement(id)
  return el?.locked
})
if (hasLockedInGroup) {
  target.releasePointerCapture(e.pointerId)
  return
}
```

- [ ] **Step 2: Remove the old `dragIds` declaration**

Delete the old line 61 (`const dragIds = selectedIds.includes(elementId) ? selectedIds : [elementId]`) since it's now declared in the group-lock check above.

- [ ] **Step 3: Commit**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): block multi-drag when any selected element is locked"
```

---

## Chunk 2: SelectionOverlay Lock Icon

### Task 4: Show lock icon instead of resize handles when element is locked

**Files:**
- Modify: `apps/editor-canvas/src/components/SelectionOverlay.tsx:65-180`

- [ ] **Step 1: Block resize for locked elements**

In `handlePointerDown` (line 83), add early return at the top:

```typescript
const handlePointerDown = (e: React.PointerEvent, position: string) => {
  if (element.locked) return
  e.stopPropagation()
  // ... rest unchanged
```

- [ ] **Step 2: Conditionally render lock icon or resize handles**

Replace the return block (lines 149-181) — conditionally show lock icon when locked:

```tsx
return (
  <div
    ref={overlayRef}
    style={{
      position: "absolute",
      left: elLeft,
      top: elTop,
      width: elWidth,
      height: elHeight,
      pointerEvents: "none",
    }}
  >
    {element.locked ? (
      <div
        style={{
          position: "absolute",
          top: -12,
          left: elWidth / 2 - 10,
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          border: "1.5px solid #94a3b8",
          borderRadius: 4,
          fontSize: 12,
          pointerEvents: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        }}
      >
        🔒
      </div>
    ) : (
      handles.map((handle) => (
        <div
          key={handle.position}
          onPointerDown={(e) => handlePointerDown(e, handle.position)}
          style={{
            position: "absolute",
            left: handle.x,
            top: handle.y,
            width: 8,
            height: 8,
            background: "#fff",
            border: "1.5px solid #6366f1",
            borderRadius: 2,
            cursor: handle.cursor,
            pointerEvents: "auto",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        />
      ))
    )}
  </div>
)
```

- [ ] **Step 3: Commit**

```bash
git add apps/editor-canvas/src/components/SelectionOverlay.tsx
git commit -m "feat(editor-canvas): show lock icon instead of resize handles for locked elements"
```

---

## Chunk 3: Shell UI — PropertiesPanel + LeftPanel

### Task 5: Add lock toggle to PropertiesPanel

**Files:**
- Modify: `apps/editor-shell/src/components/PropertiesPanel.tsx`

- [ ] **Step 1: Add lock toggle button at the top of the panel**

After the multi-select count display (line 49) and before the Position section (line 52), add a lock toggle:

```tsx
{/* Lock toggle */}
<div style={{ padding: "0 14px 10px", borderBottom: `1px solid ${T.border}`, marginBottom: 10 }}>
  <button
    onClick={() => {
      historyStore.pushSnapshot()
      for (const el of elements) {
        documentStore.toggleLock(el.id)
      }
      bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      background: elements.some(el => el.locked) ? T.accent : T.inputBg,
      color: elements.some(el => el.locked) ? "#fff" : T.text,
      border: `1px solid ${elements.some(el => el.locked) ? T.accent : T.inputBorder}`,
      borderRadius: 6,
      fontSize: 12,
      cursor: "pointer",
      width: "100%",
    }}
  >
    {elements.some(el => el.locked) ? "🔒 Locked" : "🔓 Unlocked"}
  </button>
</div>
```

- [ ] **Step 2: Import `documentStore` `toggleLock` is already available — verify `documentStore` import exists**

The import `import { documentStore, selectionStore, historyStore, bridge } from "../stores"` already exists.

- [ ] **Step 3: Commit**

```bash
git add apps/editor-shell/src/components/PropertiesPanel.tsx
git commit -m "feat(editor-shell): add lock toggle button to PropertiesPanel"
```

### Task 6: Add lock icon toggle to LeftPanel

**Files:**
- Modify: `apps/editor-shell/src/components/LeftPanel.tsx`

- [ ] **Step 1: Import stores needed for lock toggle**

Add `historyStore` to the import on line 3:

```typescript
import { documentStore, selectionStore, historyStore, bridge } from "../stores"
```

- [ ] **Step 2: Add lock icon button to each layer item**

In the `LayerTree` component, keep existing lines 62-65 (expansion arrow + icon span). Replace line 66 (`{element.name}`) with the name wrapped in a flex span, followed by the lock toggle:

```tsx
<span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{element.name}</span>
{!isRoot && (
  <span
    onClick={(e) => {
      e.stopPropagation()
      historyStore.pushSnapshot()
      documentStore.toggleLock(elementId)
      bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
    }}
    style={{
      fontSize: 11,
      opacity: element.locked ? 1 : 0,
      cursor: "pointer",
      padding: "0 2px",
      transition: "opacity 0.15s",
      ...(hovered && !element.locked ? { opacity: 0.3 } : {}),
    }}
  >
    {element.locked ? "🔒" : "🔓"}
  </span>
)}
```

The lock icon is: always visible when locked, shown at 0.3 opacity on hover when unlocked, hidden otherwise.

- [ ] **Step 3: Commit**

```bash
git add apps/editor-shell/src/components/LeftPanel.tsx
git commit -m "feat(editor-shell): add lock icon toggle to LeftPanel layer items"
```

---

## Chunk 4: Context Menu

### Task 7: Create ContextMenu component in Canvas

**Files:**
- Create: `apps/editor-canvas/src/components/ContextMenu.tsx`

- [ ] **Step 1: Create the ContextMenu component**

```tsx
import { useState, useEffect } from "react"
import type { DocumentStore } from "@devom/editor-core"
import type { MessageBridge } from "@devom/editor-core"

interface ContextMenuProps {
  documentStore: DocumentStore
  selectedIds: string[]
  bridge: MessageBridge
}

interface MenuState {
  x: number
  y: number
  targetId: string | null
}

export function ContextMenu({ documentStore, selectedIds, bridge }: ContextMenuProps) {
  const [menu, setMenu] = useState<MenuState | null>(null)

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      const target = (e.target as HTMLElement).closest("[data-element-id]")
      const id = target?.getAttribute("data-element-id") ?? null
      if (!id) {
        setMenu(null)
        return
      }
      const el = documentStore.getElement(id)
      if (!el || el.parentId === null) return
      setMenu({ x: e.clientX, y: e.clientY, targetId: id })
    }
    const onClickAway = () => setMenu(null)

    window.addEventListener("contextmenu", onContextMenu)
    window.addEventListener("click", onClickAway)
    window.addEventListener("pointerdown", onClickAway)
    return () => {
      window.removeEventListener("contextmenu", onContextMenu)
      window.removeEventListener("click", onClickAway)
      window.removeEventListener("pointerdown", onClickAway)
    }
  }, [documentStore])

  if (!menu || !menu.targetId) return null

  const targetEl = documentStore.getElement(menu.targetId)
  if (!targetEl) return null

  // If target is in selection, apply to all selected; otherwise just the target
  const actionIds = selectedIds.includes(menu.targetId) ? selectedIds : [menu.targetId]
  const anyLocked = actionIds.some(id => documentStore.getElement(id)?.locked)

  const handleToggleLock = () => {
    bridge.send({
      type: "CONTEXT_MENU_ACTION",
      payload: { action: anyLocked ? "unlock" : "lock", ids: actionIds },
    })
    setMenu(null)
  }

  return (
    <div
      style={{
        position: "fixed",
        left: menu.x,
        top: menu.y,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        border: "1px solid #e2e8f0",
        padding: "4px 0",
        minWidth: 140,
        zIndex: 9999,
        fontSize: 13,
      }}
    >
      <div
        onClick={handleToggleLock}
        style={{
          padding: "8px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <span style={{ fontSize: 12 }}>{anyLocked ? "🔓" : "🔒"}</span>
        {anyLocked ? "Unlock" : "Lock"}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-canvas/src/components/ContextMenu.tsx
git commit -m "feat(editor-canvas): create ContextMenu component with lock/unlock action"
```

### Task 8: Wire ContextMenu into Canvas App

**Files:**
- Modify: `apps/editor-canvas/src/App.tsx`

- [ ] **Step 1: Import ContextMenu**

Add import at line 5:

```typescript
import { ContextMenu } from "./components/ContextMenu"
```

- [ ] **Step 2: Add ContextMenu to render output**

After the marquee overlay div (line 184), before the closing `</div>` (line 186), add:

```tsx
<ContextMenu documentStore={documentStore} selectedIds={selectedIds} bridge={bridge} />
```

- [ ] **Step 3: Commit**

```bash
git add apps/editor-canvas/src/App.tsx
git commit -m "feat(editor-canvas): wire ContextMenu into Canvas App"
```

### Task 9: Handle `CONTEXT_MENU_ACTION` in Shell App

**Files:**
- Modify: `apps/editor-shell/src/App.tsx`

- [ ] **Step 1: Add `CONTEXT_MENU_ACTION` handler in the message switch**

In the `bridge.onMessage` callback (line 22), add a new case after `KEY_EVENT` (line 73):

```typescript
case "CONTEXT_MENU_ACTION": {
  const { action, ids } = msg.payload
  historyStore.pushSnapshot()
  for (const id of ids) {
    const el = documentStore.getElement(id)
    if (!el || id === documentStore.rootId) continue
    const shouldBeLocked = action === "lock"
    if (el.locked !== shouldBeLocked) documentStore.toggleLock(id)
  }
  syncToCanvas()
  break
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-shell/src/App.tsx
git commit -m "feat(editor-shell): handle CONTEXT_MENU_ACTION for lock/unlock from canvas"
```

---

## Chunk 5: Click-through for locked elements (allow selection)

### Task 10: Allow click-select on locked elements

**Files:**
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx:34-47`

Currently line 36 blocks click entirely for locked elements:
```typescript
if (element.locked) return
```

The design says locked elements should still be selectable. Remove this guard.

- [ ] **Step 1: Remove the `if (element.locked) return` from `handleClick`**

Delete line 36. Clicks on locked elements should still trigger selection and send `ELEMENT_CLICKED`.

- [ ] **Step 2: Commit**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): allow click-select on locked elements"
```
