# Auto Layout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Figma-style Auto Layout (Flexbox) to the editor, enabling any element to become a flex container with Fixed/Hug/Fill child sizing and drag-based reorder/reparent.

**Architecture:** Extend `EditorElement` with `layoutMode`, `layoutProps`, `sizing` fields. Canvas renders flex containers with CSS flexbox. Drag behavior branches: inside auto-layout uses insertion indicators and reorder, outside uses existing absolute positioning. New protocol messages handle reorder and reparent operations.

**Tech Stack:** MobX, React, CSS Flexbox, postMessage protocol

---

## File Structure

### New Files

- `packages/editor-core/src/utils/layoutStyles.ts` — Computes CSS from layoutMode/layoutProps/sizing (pure function)
- `apps/editor-canvas/src/components/InsertionIndicator.tsx` — Blue line showing drop position in auto-layout containers
- `apps/editor-canvas/src/utils/autoLayoutDrag.ts` — Drag logic for auto-layout: hit-test containers, calculate insertion index
- `apps/editor-shell/src/components/AutoLayoutSection.tsx` — PropertiesPanel section for auto-layout container props
- `apps/editor-shell/src/components/SizingSection.tsx` — PropertiesPanel section for child sizing (Fixed/Hug/Fill)

### Modified Files

- `packages/editor-core/src/types.ts` — Add SizingMode, LayoutProps, SizingProps, extend EditorElement
- `packages/editor-core/src/protocol.ts` — Add new message types
- `packages/editor-core/src/stores/DocumentStore.ts` — Add layout methods
- `packages/editor-core/src/export/jsxExport.ts` — Handle layoutMode in export
- `apps/editor-canvas/src/components/ElementRenderer.tsx` — Flex rendering, drag behavior branching
- `apps/editor-canvas/src/components/SelectionOverlay.tsx` — Resize behavior for auto-layout children
- `apps/editor-canvas/src/App.tsx` — Handle new protocol messages
- `apps/editor-shell/src/App.tsx` — Handle new canvas messages
- `apps/editor-shell/src/components/PropertiesPanel.tsx` — Integrate new sections
- `apps/editor-shell/src/components/LeftPanel.tsx` — Auto-layout container icon

---

## Chunk 1: Data Model & Protocol

### Task 1: Extend types.ts

**Files:**

- Modify: `packages/editor-core/src/types.ts`

- [ ] **Step 1: Add new types and extend EditorElement**

```typescript
// Add after ElementBounds interface (line 41)

export type SizingMode = "fixed" | "hug" | "fill"

export interface LayoutProps {
  direction: "row" | "column"
  gap: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  alignItems: "start" | "center" | "end" | "stretch"
  justifyContent: "start" | "center" | "end" | "space-between"
}

export interface SizingProps {
  w: SizingMode
  h: SizingMode
}

export const DEFAULT_LAYOUT_PROPS: LayoutProps = {
  direction: "column",
  gap: 8,
  paddingTop: 8,
  paddingRight: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  alignItems: "start",
  justifyContent: "start",
}

export const DEFAULT_SIZING: SizingProps = {
  w: "fixed",
  h: "fixed",
}
```

- [ ] **Step 2: Add layoutMode, layoutProps, sizing to EditorElement**

```typescript
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
  layoutMode: "none" | "flex" // NEW
  layoutProps: LayoutProps // NEW
  sizing: SizingProps // NEW
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build`
Expected: Build fails because DocumentStore doesn't provide new fields yet (this is expected, will fix in Task 2)

- [ ] **Step 4: Commit**

```bash
git add packages/editor-core/src/types.ts
git commit -m "feat(editor-core): add layoutMode, layoutProps, sizing to EditorElement type"
```

### Task 2: Update DocumentStore

**Files:**

- Modify: `packages/editor-core/src/stores/DocumentStore.ts`

- [ ] **Step 1: Add default fields to initRoot, addElement, pasteElements, duplicateElements**

Every place that creates an EditorElement needs `layoutMode: 'none'`, `layoutProps: { ...DEFAULT_LAYOUT_PROPS }`, `sizing: { ...DEFAULT_SIZING }`.

In `initRoot()` — add to root element:

```typescript
layoutMode: 'none' as const,
layoutProps: { ...DEFAULT_LAYOUT_PROPS },
sizing: { ...DEFAULT_SIZING },
```

In `addElement()` — add to new element:

```typescript
layoutMode: 'none' as const,
layoutProps: { ...DEFAULT_LAYOUT_PROPS },
sizing: { ...DEFAULT_SIZING },
```

In `pasteElements()` — ensure cloned elements include the new fields (they already come from JSON.parse, so they should carry through, but add defaults for safety):

```typescript
const cloned: EditorElement = {
  ...JSON.parse(JSON.stringify(el)),
  id: newId,
  parentId: parent.id,
  name: `${el.type}-${newId.slice(0, 4)}`,
  children: [],
  layoutMode: el.layoutMode ?? 'none',
  layoutProps: el.layoutProps ? { ...el.layoutProps } : { ...DEFAULT_LAYOUT_PROPS },
  sizing: el.sizing ? { ...el.sizing } : { ...DEFAULT_SIZING },
  style: { ... },
}
```

Same pattern for `duplicateElements()`.

- [ ] **Step 2: Add new store methods**

```typescript
import { DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, type LayoutProps, type SizingProps } from "../types"

// Add to DocumentStore class:

setLayoutMode(id: string, mode: 'none' | 'flex') {
  const element = this.elements.get(id)
  if (!element || element.locked || id === this.rootId) return
  element.layoutMode = mode
  if (mode === 'flex') {
    element.layoutProps = { ...DEFAULT_LAYOUT_PROPS }
    // Remove absolute positioning from children, keep their sizes
    for (const childId of element.children) {
      const child = this.elements.get(childId)
      if (!child) continue
      const { position, left, top, ...rest } = child.style
      child.style = { ...rest, position: 'relative' as const }
    }
  } else {
    // Restore absolute positioning for children
    for (const childId of element.children) {
      const child = this.elements.get(childId)
      if (!child) continue
      child.style = { ...child.style, position: 'absolute' as const, left: 0, top: 0 }
    }
  }
}

updateLayoutProps(id: string, props: Partial<LayoutProps>) {
  const element = this.elements.get(id)
  if (!element || element.layoutMode !== 'flex') return
  Object.assign(element.layoutProps, props)
}

updateSizing(id: string, sizing: Partial<SizingProps>) {
  const element = this.elements.get(id)
  if (!element) return
  Object.assign(element.sizing, sizing)
}

reorderChild(parentId: string, childId: string, newIndex: number) {
  const parent = this.elements.get(parentId)
  if (!parent) return
  const oldIndex = parent.children.indexOf(childId)
  if (oldIndex === -1) return
  parent.children.splice(oldIndex, 1)
  parent.children.splice(newIndex, 0, childId)
}

reparentElement(id: string, newParentId: string, index: number, dropPosition?: { x: number; y: number }) {
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

  // Adjust styles based on new parent's layout mode
  if (newParent.layoutMode === 'flex') {
    // Entering auto-layout: remove absolute positioning
    const { position, left, top, ...rest } = element.style
    element.style = { ...rest, position: 'relative' as const }
    element.sizing = { ...DEFAULT_SIZING }
  } else {
    // Leaving auto-layout: set absolute positioning
    element.style = {
      ...element.style,
      position: 'absolute' as const,
      left: dropPosition?.x ?? 0,
      top: dropPosition?.y ?? 0,
    }
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/editor-core/src/stores/DocumentStore.ts
git commit -m "feat(editor-core): add auto-layout store methods"
```

### Task 3: Update protocol.ts

**Files:**

- Modify: `packages/editor-core/src/protocol.ts`

- [ ] **Step 1: Add new message types**

Add to `ShellToCanvasMessage` union:

```typescript
| { type: "SET_LAYOUT_MODE"; payload: { id: string; mode: "none" | "flex" } }
| { type: "UPDATE_LAYOUT_PROPS"; payload: { id: string; layoutProps: Partial<LayoutProps> } }
| { type: "UPDATE_SIZING"; payload: { id: string; sizing: Partial<SizingProps> } }
```

Add to `CanvasToShellMessage` union:

```typescript
| { type: "REORDER_CHILD"; payload: { parentId: string; childId: string; newIndex: number } }
| { type: "REPARENT_ELEMENT"; payload: { id: string; oldParentId: string; newParentId: string; index: number; dropPosition?: { x: number; y: number } } }
```

Add imports at top:

```typescript
import type { EditorElement, ElementBounds, LayoutProps, SizingProps } from "./types"
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/editor-core/src/protocol.ts
git commit -m "feat(editor-core): add auto-layout protocol messages"
```

### Task 4: Create layoutStyles utility

**Files:**

- Create: `packages/editor-core/src/utils/layoutStyles.ts`

- [ ] **Step 1: Create the utility**

```typescript
import type { CSSProperties } from "react"
import type { EditorElement, SizingMode } from "../types"

/**
 * Compute CSS properties for a flex container from its layoutProps.
 */
export function getContainerStyles(element: EditorElement): CSSProperties {
  if (element.layoutMode !== "flex") return {}
  const lp = element.layoutProps
  return {
    display: "flex",
    flexDirection: lp.direction,
    gap: lp.gap,
    paddingTop: lp.paddingTop,
    paddingRight: lp.paddingRight,
    paddingBottom: lp.paddingBottom,
    paddingLeft: lp.paddingLeft,
    alignItems: lp.alignItems === "start" ? "flex-start" : lp.alignItems === "end" ? "flex-end" : lp.alignItems,
    justifyContent:
      lp.justifyContent === "start" ? "flex-start" : lp.justifyContent === "end" ? "flex-end" : lp.justifyContent === "space-between" ? "space-between" : lp.justifyContent,
  }
}

/**
 * Compute CSS properties for a child inside an auto-layout container.
 * parentDirection determines which axis is the main axis.
 */
export function getChildSizingStyles(child: EditorElement, parentDirection: "row" | "column"): CSSProperties {
  const styles: CSSProperties = {}
  const { w, h } = child.sizing

  // Main axis sizing
  const mainSizing = parentDirection === "row" ? w : h
  const crossSizing = parentDirection === "row" ? h : w
  const mainDim = parentDirection === "row" ? "width" : "height"
  const crossDim = parentDirection === "row" ? "height" : "width"

  if (mainSizing === "fill") {
    styles.flex = "1 0 0"
    // Remove fixed main dimension
    styles[mainDim] = undefined
  } else if (mainSizing === "hug") {
    styles[mainDim] = "fit-content"
  }
  // 'fixed': keep existing style dimension

  if (crossSizing === "fill") {
    styles.alignSelf = "stretch"
    styles[crossDim] = undefined
  } else if (crossSizing === "hug") {
    styles[crossDim] = "fit-content"
  }
  // 'fixed': keep existing style dimension

  return styles
}

/**
 * Check if an element is inside an auto-layout container.
 */
export function isAutoLayoutChild(element: EditorElement, getElement: (id: string) => EditorElement | undefined): boolean {
  if (!element.parentId) return false
  const parent = getElement(element.parentId)
  return parent?.layoutMode === "flex"
}
```

- [ ] **Step 2: Export from index**

Add to `packages/editor-core/src/index.ts`:

```typescript
export * from "./utils/layoutStyles"
```

Create `packages/editor-core/src/utils/index.ts` (if needed):
— Actually, just export directly from the main index.

- [ ] **Step 3: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/editor-core/src/utils/layoutStyles.ts packages/editor-core/src/index.ts
git commit -m "feat(editor-core): add layoutStyles utility for CSS computation"
```

---

## Chunk 2: Canvas Rendering

### Task 5: Update ElementRenderer for flex rendering

**Files:**

- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

- [ ] **Step 1: Import layout utilities**

```typescript
import { getContainerStyles, getChildSizingStyles, isAutoLayoutChild } from "@devom/editor-core"
```

- [ ] **Step 2: Compute layout styles in render**

Inside the component, after `const isRoot = element.parentId === null`:

```typescript
// Auto Layout styles
const containerStyles = getContainerStyles(element)
const parent = element.parentId ? documentStore.getElement(element.parentId) : undefined
const inAutoLayout = parent?.layoutMode === "flex"
const childSizingStyles = inAutoLayout ? getChildSizingStyles(element, parent.layoutProps.direction) : {}
```

- [ ] **Step 3: Update the rendered div's style**

Replace the style computation in the `<div>` element:

```typescript
style={{
  ...element.style,
  // Override position for auto-layout children
  ...(inAutoLayout ? { position: 'relative' as const, left: undefined, top: undefined } : {}),
  // Apply container flex styles
  ...containerStyles,
  // Apply child sizing styles
  ...childSizingStyles,
  outline: editorMode === "edit" && isSelected ? "1.5px dashed #6366f1" : undefined,
  outlineOffset: editorMode === "edit" && isSelected ? 2 : undefined,
  cursor: editorMode === "interact" ? undefined : (element.locked || isRoot ? "default" : (inAutoLayout ? "grab" : "move")),
  userSelect: editorMode === "interact" ? undefined : "none",
}}
```

- [ ] **Step 4: Guard drag — skip absolute drag for auto-layout children**

In `handlePointerDown`, change the early return check on line 53 from:

```typescript
if (element.style.position !== "absolute") return
```

to:

```typescript
if (inAutoLayout) return // Auto-layout drag handled separately (Task 7)
if (element.style.position !== "absolute") return
```

This temporarily disables drag for auto-layout children. Task 7 will add the proper drag behavior.

- [ ] **Step 5: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-canvas build`
Expected: PASS

- [ ] **Step 6: Manual test**

1. Run: `cd /Users/dabom-choi/StudySource/devom && pnpm dev:editor`
2. Create a div element
3. In PropertiesPanel (not yet updated), add `display: flex` manually — children should not be visible yet, but the div should render normally
4. Verify existing absolute drag still works for normal elements

- [ ] **Step 7: Commit**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): render flex containers with auto-layout CSS"
```

### Task 6: Handle new messages in Canvas App.tsx

**Files:**

- Modify: `apps/editor-canvas/src/App.tsx`

- [ ] **Step 1: Add message handlers**

In `handleShellMessage` switch, add cases:

```typescript
case "SET_LAYOUT_MODE":
  documentStore.setLayoutMode(msg.payload.id, msg.payload.mode)
  break
case "UPDATE_LAYOUT_PROPS":
  documentStore.updateLayoutProps(msg.payload.id, msg.payload.layoutProps)
  break
case "UPDATE_SIZING":
  documentStore.updateSizing(msg.payload.id, msg.payload.sizing)
  break
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-canvas build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/editor-canvas/src/App.tsx
git commit -m "feat(editor-canvas): handle auto-layout protocol messages"
```

---

## Chunk 3: Shell UI (PropertiesPanel)

### Task 7: Create AutoLayoutSection component

**Files:**

- Create: `apps/editor-shell/src/components/AutoLayoutSection.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { observer } from "mobx-react-lite"
import type { EditorElement, LayoutProps } from "@devom/editor-core"
import { T } from "../theme"

interface AutoLayoutSectionProps {
  element: EditorElement
  onToggle: () => void
  onUpdate: (props: Partial<LayoutProps>) => void
}

export const AutoLayoutSection = observer(function AutoLayoutSection({ element, onToggle, onUpdate }: AutoLayoutSectionProps) {
  const isActive = element.layoutMode === 'flex'
  const lp = element.layoutProps

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Auto Layout</span>
        <button
          onClick={onToggle}
          style={{
            padding: '3px 10px',
            fontSize: 11,
            background: isActive ? T.accent : T.inputBg,
            color: isActive ? '#fff' : T.text,
            border: `1px solid ${isActive ? T.accent : T.inputBorder}`,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {isActive ? '- Remove' : '+ Add'}
        </button>
      </div>

      {isActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px' }}>
          {/* Direction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Direction</span>
            <select
              value={lp.direction}
              onChange={(e) => onUpdate({ direction: e.target.value as 'row' | 'column' })}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </div>

          {/* Gap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Gap</span>
            <input
              value={lp.gap}
              onChange={(e) => onUpdate({ gap: Number(e.target.value) || 0 })}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none',
              }}
            />
          </div>

          {/* Align Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Align</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['start', 'center', 'end', 'stretch'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => onUpdate({ alignItems: val })}
                  style={{
                    padding: '4px 8px', fontSize: 10,
                    background: lp.alignItems === val ? T.accent : T.inputBg,
                    color: lp.alignItems === val ? '#fff' : T.text,
                    border: `1px solid ${lp.alignItems === val ? T.accent : T.inputBorder}`,
                    borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {val[0]!.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Justify Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Justify</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['start', 'center', 'end', 'space-between'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => onUpdate({ justifyContent: val })}
                  style={{
                    padding: '4px 8px', fontSize: 10,
                    background: lp.justifyContent === val ? T.accent : T.inputBg,
                    color: lp.justifyContent === val ? '#fff' : T.text,
                    border: `1px solid ${lp.justifyContent === val ? T.accent : T.inputBorder}`,
                    borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {val === 'space-between' ? 'SB' : val[0]!.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSub, width: 56, flexShrink: 0 }}>Padding</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, flex: 1 }}>
              {(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const).map(key => (
                <input
                  key={key}
                  value={lp[key]}
                  onChange={(e) => onUpdate({ [key]: Number(e.target.value) || 0 })}
                  title={key.replace('padding', '').toLowerCase()}
                  style={{
                    padding: '4px 6px', fontSize: 11, width: '100%', boxSizing: 'border-box',
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    borderRadius: 4, color: T.text, outline: 'none', textAlign: 'center',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-shell/src/components/AutoLayoutSection.tsx
git commit -m "feat(editor-shell): add AutoLayoutSection component"
```

### Task 8: Create SizingSection component

**Files:**

- Create: `apps/editor-shell/src/components/SizingSection.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { observer } from "mobx-react-lite"
import type { EditorElement, SizingMode } from "@devom/editor-core"
import { T } from "../theme"

interface SizingSectionProps {
  element: EditorElement
  onUpdateSizing: (sizing: { w?: SizingMode; h?: SizingMode }) => void
  onUpdateStyle: (key: string, value: string) => void
}

export const SizingSection = observer(function SizingSection({ element, onUpdateSizing, onUpdateStyle }: SizingSectionProps) {
  const { w, h } = element.sizing

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8, padding: '0 14px' }}>Sizing</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px' }}>
        {/* Width sizing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 20, flexShrink: 0 }}>W</span>
          <select
            value={w}
            onChange={(e) => onUpdateSizing({ w: e.target.value as SizingMode })}
            style={{
              width: 70, padding: '5px 8px',
              background: T.inputBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 6, color: T.text, fontSize: 12, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="fixed">Fixed</option>
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
          </select>
          {w === 'fixed' && (
            <input
              value={element.style.width ?? 'auto'}
              onChange={(e) => onUpdateStyle('width', e.target.value)}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none',
              }}
            />
          )}
        </div>

        {/* Height sizing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSub, width: 20, flexShrink: 0 }}>H</span>
          <select
            value={h}
            onChange={(e) => onUpdateSizing({ h: e.target.value as SizingMode })}
            style={{
              width: 70, padding: '5px 8px',
              background: T.inputBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 6, color: T.text, fontSize: 12, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="fixed">Fixed</option>
            <option value="hug">Hug</option>
            <option value="fill">Fill</option>
          </select>
          {h === 'fixed' && (
            <input
              value={element.style.height ?? 'auto'}
              onChange={(e) => onUpdateStyle('height', e.target.value)}
              style={{
                flex: 1, padding: '5px 8px',
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 6, color: T.text, fontSize: 12, outline: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-shell/src/components/SizingSection.tsx
git commit -m "feat(editor-shell): add SizingSection component"
```

### Task 9: Integrate into PropertiesPanel

**Files:**

- Modify: `apps/editor-shell/src/components/PropertiesPanel.tsx`

- [ ] **Step 1: Import new components and utilities**

```typescript
import { isAutoLayoutChild } from "@devom/editor-core"
import { AutoLayoutSection } from "./AutoLayoutSection"
import { SizingSection } from "./SizingSection"
```

- [ ] **Step 2: Add helper functions for layout operations**

Inside the PropertiesPanel component, after `updateProp`:

```typescript
const toggleAutoLayout = () => {
  historyStore.pushSnapshot()
  const newMode = element.layoutMode === "flex" ? "none" : "flex"
  documentStore.setLayoutMode(element.id, newMode as "none" | "flex")
  bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
}

const updateLayoutProps = (props: Record<string, unknown>) => {
  historyStore.pushSnapshot()
  for (const el of elements) {
    documentStore.updateLayoutProps(el.id, props as any)
  }
  bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
}

const updateSizing = (sizing: Record<string, unknown>) => {
  historyStore.pushSnapshot()
  for (const el of elements) {
    documentStore.updateSizing(el.id, sizing as any)
  }
  bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
}
```

- [ ] **Step 3: Add computed values**

After `const allSameType = ...`:

```typescript
const inAutoLayout = !isMulti && isAutoLayoutChild(element, (id) => documentStore.getElement(id))
```

- [ ] **Step 4: Add AutoLayoutSection to render (after Lock toggle, before Position)**

```typescript
{/* Auto Layout — single select only */}
{!isMulti && (
  <AutoLayoutSection
    element={element}
    onToggle={toggleAutoLayout}
    onUpdate={updateLayoutProps}
  />
)}
```

- [ ] **Step 5: Conditionally show Position/Size vs Sizing section**

Replace the Position and Size sections with:

```typescript
{/* Position — single select, only for absolute elements */}
{!isMulti && !inAutoLayout && (
  <PropSection title="Position">
    <PropGrid>
      <PropCompact label="X" value={element.style.left ?? 0} onChange={(v) => updateStyle("left", v)} />
      <PropCompact label="Y" value={element.style.top ?? 0} onChange={(v) => updateStyle("top", v)} />
    </PropGrid>
  </PropSection>
)}

{/* Sizing — single select, only for auto-layout children */}
{!isMulti && inAutoLayout && (
  <SizingSection
    element={element}
    onUpdateSizing={updateSizing}
    onUpdateStyle={updateStyle}
  />
)}

{/* Size — single select, absolute elements or auto-layout containers */}
{!isMulti && !inAutoLayout && (!isShadcn || element.type === "sc:card" || element.type === "sc:input") && (
  <PropSection title="Size">
    <PropGrid>
      <PropCompact label="W" value={element.style.width ?? "auto"} onChange={(v) => updateStyle("width", v)} />
      <PropCompact label="H" value={element.style.height ?? "auto"} onChange={(v) => updateStyle("height", v)} />
    </PropGrid>
  </PropSection>
)}
```

- [ ] **Step 6: Remove old Container section**

Remove the existing Container section (lines 151-163 approximately) that handles flex/grid types. The new AutoLayoutSection replaces it.

- [ ] **Step 7: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-shell build`
Expected: PASS

- [ ] **Step 8: Manual test**

1. Run dev server
2. Add a div element
3. In PropertiesPanel, click "+ Add" Auto Layout button
4. Verify the div shows Auto Layout controls (direction, gap, align, justify, padding)
5. Add child elements — they should appear inside with flow layout
6. Select a child — verify Sizing section (Fixed/Hug/Fill) appears instead of Position

- [ ] **Step 9: Commit**

```bash
git add apps/editor-shell/src/components/PropertiesPanel.tsx
git commit -m "feat(editor-shell): integrate Auto Layout and Sizing into PropertiesPanel"
```

### Task 10: Update LeftPanel icons

**Files:**

- Modify: `apps/editor-shell/src/components/LeftPanel.tsx`

- [ ] **Step 1: Import LayoutList icon**

Add to lucide-react imports:

```typescript
import { ..., LayoutList } from "lucide-react"
```

- [ ] **Step 2: Show flex icon for auto-layout containers**

In `LayerTree`, after `const icon = iconMap[...] ?? ...`:

```typescript
const displayIcon = element.layoutMode === 'flex'
  ? <LayoutList size={S} />
  : icon
```

Use `displayIcon` instead of `icon` in the render:

```typescript
<span style={{ ... }}>{displayIcon}</span>
```

- [ ] **Step 3: Show direction indicator**

After the name span, add:

```typescript
{element.layoutMode === 'flex' && (
  <span style={{ fontSize: 10, opacity: 0.4, flexShrink: 0 }}>
    {element.layoutProps.direction === 'row' ? '→' : '↓'}
  </span>
)}
```

- [ ] **Step 4: Commit**

```bash
git add apps/editor-shell/src/components/LeftPanel.tsx
git commit -m "feat(editor-shell): show auto-layout indicator in layer tree"
```

### Task 11: Handle new Canvas messages in Shell App.tsx

**Files:**

- Modify: `apps/editor-shell/src/App.tsx`

- [ ] **Step 1: Add message handlers**

In the `bridge.onMessage` switch inside `useEffect`, add:

```typescript
case "REORDER_CHILD":
  historyStore.pushSnapshot()
  documentStore.reorderChild(msg.payload.parentId, msg.payload.childId, msg.payload.newIndex)
  syncToCanvas()
  break
case "REPARENT_ELEMENT":
  historyStore.pushSnapshot()
  documentStore.reparentElement(msg.payload.id, msg.payload.newParentId, msg.payload.index, msg.payload.dropPosition)
  syncToCanvas()
  break
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-shell/src/App.tsx
git commit -m "feat(editor-shell): handle reorder and reparent messages"
```

---

## Chunk 4: Canvas Drag Behavior

### Task 12: Create autoLayoutDrag utility

**Files:**

- Create: `apps/editor-canvas/src/utils/autoLayoutDrag.ts`

- [ ] **Step 1: Create hit-test and insertion index utilities**

```typescript
import type { DocumentStore } from "@devom/editor-core"

export interface DropTarget {
  containerId: string
  insertIndex: number
}

/**
 * Find the auto-layout container under the given point, if any.
 * Returns the container element ID and the insertion index.
 */
export function findDropTarget(clientX: number, clientY: number, draggedIds: string[], documentStore: DocumentStore): DropTarget | null {
  // Find all auto-layout containers
  const containers = documentStore.getAllElements().filter((el) => el.layoutMode === "flex" && !draggedIds.includes(el.id))

  for (const container of containers) {
    const dom = document.querySelector(`[data-element-id="${container.id}"]`) as HTMLElement | null
    if (!dom) continue

    const rect = dom.getBoundingClientRect()
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue

    // We're inside this container — find insertion index
    const insertIndex = calcInsertionIndex(container.id, container.layoutProps.direction, clientX, clientY, draggedIds, documentStore)
    return { containerId: container.id, insertIndex }
  }

  return null
}

/**
 * Calculate the insertion index within an auto-layout container
 * based on mouse position relative to children.
 */
export function calcInsertionIndex(containerId: string, direction: "row" | "column", clientX: number, clientY: number, draggedIds: string[], documentStore: DocumentStore): number {
  const container = documentStore.getElement(containerId)
  if (!container) return 0

  const childIds = container.children.filter((id) => !draggedIds.includes(id))
  if (childIds.length === 0) return 0

  for (let i = 0; i < childIds.length; i++) {
    const childDom = document.querySelector(`[data-element-id="${childIds[i]}"]`) as HTMLElement | null
    if (!childDom) continue

    const childRect = childDom.getBoundingClientRect()
    const centerX = childRect.left + childRect.width / 2
    const centerY = childRect.top + childRect.height / 2

    if (direction === "row" && clientX < centerX) return i
    if (direction === "column" && clientY < centerY) return i
  }

  return childIds.length
}

/**
 * Calculate the position and dimensions of the insertion indicator line.
 */
export function calcInsertionIndicator(
  containerId: string,
  insertIndex: number,
  direction: "row" | "column",
  draggedIds: string[],
  documentStore: DocumentStore
): { x: number; y: number; width: number; height: number } | null {
  const container = documentStore.getElement(containerId)
  if (!container) return null

  const containerDom = document.querySelector(`[data-element-id="${containerId}"]`) as HTMLElement | null
  if (!containerDom) return null

  const containerRect = containerDom.getBoundingClientRect()
  const childIds = container.children.filter((id) => !draggedIds.includes(id))

  const THICKNESS = 2
  const INSET = 4

  if (childIds.length === 0) {
    // Empty container — show indicator at start
    if (direction === "row") {
      return { x: containerRect.left + INSET, y: containerRect.top + INSET, width: THICKNESS, height: containerRect.height - INSET * 2 }
    }
    return { x: containerRect.left + INSET, y: containerRect.top + INSET, width: containerRect.width - INSET * 2, height: THICKNESS }
  }

  if (insertIndex >= childIds.length) {
    // After last child
    const lastDom = document.querySelector(`[data-element-id="${childIds[childIds.length - 1]}"]`) as HTMLElement | null
    if (!lastDom) return null
    const lastRect = lastDom.getBoundingClientRect()

    if (direction === "row") {
      return { x: lastRect.right + 2, y: containerRect.top + INSET, width: THICKNESS, height: containerRect.height - INSET * 2 }
    }
    return { x: containerRect.left + INSET, y: lastRect.bottom + 2, width: containerRect.width - INSET * 2, height: THICKNESS }
  }

  // Before child at insertIndex
  const childDom = document.querySelector(`[data-element-id="${childIds[insertIndex]}"]`) as HTMLElement | null
  if (!childDom) return null
  const childRect = childDom.getBoundingClientRect()

  if (direction === "row") {
    return { x: childRect.left - 2, y: containerRect.top + INSET, width: THICKNESS, height: containerRect.height - INSET * 2 }
  }
  return { x: containerRect.left + INSET, y: childRect.top - 2, width: containerRect.width - INSET * 2, height: THICKNESS }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-canvas/src/utils/autoLayoutDrag.ts
git commit -m "feat(editor-canvas): add auto-layout drag utilities"
```

### Task 13: Create InsertionIndicator component

**Files:**

- Create: `apps/editor-canvas/src/components/InsertionIndicator.tsx`

- [ ] **Step 1: Create the component**

```typescript
interface InsertionIndicatorProps {
  x: number
  y: number
  width: number
  height: number
}

export function InsertionIndicator({ x, y, width, height }: InsertionIndicatorProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: '#3b82f6',
        borderRadius: 1,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/editor-canvas/src/components/InsertionIndicator.tsx
git commit -m "feat(editor-canvas): add InsertionIndicator component"
```

### Task 14: Add auto-layout drag to ElementRenderer

**Files:**

- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

- [ ] **Step 1: Import utilities**

```typescript
import { findDropTarget, calcInsertionIndicator } from "../utils/autoLayoutDrag"
```

- [ ] **Step 2: Add auto-layout drag props**

Add to `ElementRendererProps`:

```typescript
onInsertionIndicator?: (indicator: { x: number; y: number; width: number; height: number } | null) => void
onDropHighlight?: (containerId: string | null) => void
```

- [ ] **Step 3: Add auto-layout reorder drag handler**

Add a new handler after `handlePointerDown`, for auto-layout children:

```typescript
const handleAutoLayoutPointerDown = (e: React.PointerEvent) => {
  if (editorMode === "interact") return
  if (element.locked || isRoot) return
  if (!inAutoLayout || !parent) return
  e.stopPropagation()
  e.preventDefault()

  const target = e.currentTarget as HTMLElement
  target.setPointerCapture(e.pointerId)
  const startX = e.clientX
  const startY = e.clientY
  let hasMoved = false

  onDragChange?.(true)

  const cleanup = () => {
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener("pointermove", onMove)
    target.removeEventListener("pointerup", onUp)
    target.removeEventListener("pointercancel", onCancel)
    dragCleanupRef.current = null
    onDragChange?.(false)
    onInsertionIndicator?.(null)
    onDropHighlight?.(null)
    target.style.transform = ""
    target.style.opacity = ""
    target.style.zIndex = ""
  }

  const onMove = (me: PointerEvent) => {
    const dx = me.clientX - startX
    const dy = me.clientY - startY

    if (!hasMoved && Math.abs(dx) + Math.abs(dy) < 3) return
    hasMoved = true

    target.style.transform = `translate(${dx}px, ${dy}px)`
    target.style.opacity = "0.7"
    target.style.zIndex = "1000"

    // Find drop target
    const dropTarget = findDropTarget(me.clientX, me.clientY, [elementId], documentStore)

    if (dropTarget) {
      onDropHighlight?.(dropTarget.containerId)
      const container = documentStore.getElement(dropTarget.containerId)
      if (container) {
        const indicator = calcInsertionIndicator(dropTarget.containerId, dropTarget.insertIndex, container.layoutProps.direction, [elementId], documentStore)
        onInsertionIndicator?.(indicator)
      }
    } else {
      onDropHighlight?.(null)
      onInsertionIndicator?.(null)
    }
  }

  const onUp = (me: PointerEvent) => {
    cleanup()

    if (!hasMoved) return

    const dropTarget = findDropTarget(me.clientX, me.clientY, [elementId], documentStore)

    if (dropTarget && dropTarget.containerId === element.parentId) {
      // Reorder within same container
      bridge.send({
        type: "REORDER_CHILD",
        payload: { parentId: dropTarget.containerId, childId: elementId, newIndex: dropTarget.insertIndex },
      })
    } else if (dropTarget) {
      // Reparent to different container
      bridge.send({
        type: "REPARENT_ELEMENT",
        payload: {
          id: elementId,
          oldParentId: element.parentId!,
          newParentId: dropTarget.containerId,
          index: dropTarget.insertIndex,
        },
      })
    } else {
      // Dragged outside all containers — extract to root
      const canvasRect = document.querySelector(`[data-element-id="${documentStore.rootId}"]`)?.getBoundingClientRect()
      const dropX = canvasRect ? me.clientX - canvasRect.left : me.clientX
      const dropY = canvasRect ? me.clientY - canvasRect.top : me.clientY
      bridge.send({
        type: "REPARENT_ELEMENT",
        payload: {
          id: elementId,
          oldParentId: element.parentId!,
          newParentId: documentStore.rootId,
          index: 0,
          dropPosition: { x: Math.round(dropX), y: Math.round(dropY) },
        },
      })
    }
  }

  const onCancel = () => {
    cleanup()
  }

  dragCleanupRef.current = cleanup
  target.addEventListener("pointermove", onMove)
  target.addEventListener("pointerup", onUp)
  target.addEventListener("pointercancel", onCancel)
}
```

- [ ] **Step 4: Update onPointerDown to branch**

Change the `onPointerDown` in the rendered div:

```typescript
onPointerDown={inAutoLayout ? handleAutoLayoutPointerDown : handlePointerDown}
```

- [ ] **Step 5: Pass new props through recursive children**

Update the children rendering:

```typescript
{element.children.map((childId) => (
  <ElementRenderer
    key={childId}
    elementId={childId}
    selectedIds={selectedIds}
    onSelect={onSelect}
    onDragChange={onDragChange}
    onSnapLines={onSnapLines}
    onInsertionIndicator={onInsertionIndicator}
    onDropHighlight={onDropHighlight}
    documentStore={documentStore}
    bridge={bridge}
    editorMode={editorMode}
  />
))}
```

- [ ] **Step 6: Commit**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): add auto-layout drag with reorder and reparent"
```

### Task 15: Wire InsertionIndicator and drop highlight in Canvas App

**Files:**

- Modify: `apps/editor-canvas/src/App.tsx`

- [ ] **Step 1: Add state for insertion indicator and drop highlight**

```typescript
const [insertionIndicator, setInsertionIndicator] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
const [dropHighlightId, setDropHighlightId] = useState<string | null>(null)
```

- [ ] **Step 2: Import InsertionIndicator**

```typescript
import { InsertionIndicator } from "./components/InsertionIndicator"
```

- [ ] **Step 3: Pass callbacks to ElementRenderer**

Add to the root `<ElementRenderer>`:

```typescript
onInsertionIndicator = { setInsertionIndicator }
onDropHighlight = { setDropHighlightId }
```

- [ ] **Step 4: Render InsertionIndicator**

Add after SnapGuides:

```typescript
{insertionIndicator && <InsertionIndicator {...insertionIndicator} />}
```

- [ ] **Step 5: Apply drop highlight style**

Add a CSS effect: when `dropHighlightId` is set, the container gets a highlight. This can be done via a separate overlay div or by adding a data attribute.

Add after InsertionIndicator:

```typescript
{dropHighlightId && (() => {
  const dom = document.querySelector(`[data-element-id="${dropHighlightId}"]`) as HTMLElement | null
  if (!dom) return null
  const parent = dom.offsetParent as HTMLElement | null
  if (!parent) return null
  const parentRect = parent.getBoundingClientRect()
  const domRect = dom.getBoundingClientRect()
  return (
    <div style={{
      position: 'absolute',
      left: domRect.left - parentRect.left,
      top: domRect.top - parentRect.top,
      width: domRect.width,
      height: domRect.height,
      border: '2px solid #3b82f6',
      borderRadius: 4,
      pointerEvents: 'none',
      zIndex: 9998,
    }} />
  )
})()}
```

- [ ] **Step 6: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-canvas build`
Expected: PASS

- [ ] **Step 7: Manual test — full auto-layout flow**

1. Run dev server
2. Add a div, click "+ Add" Auto Layout in PropertiesPanel
3. Add child elements (buttons, inputs, etc.) — they should flow inside the container
4. Drag a child within the container — blue insertion line should appear, reorder on drop
5. Drag a child outside the container — should become absolute at drop position
6. Drag an absolute element into the container — should insert at indicator position
7. Toggle direction (row/column) — children should reflow
8. Change child sizing (Fixed/Hug/Fill) — verify CSS changes

- [ ] **Step 8: Commit**

```bash
git add apps/editor-canvas/src/App.tsx
git commit -m "feat(editor-canvas): wire insertion indicator and drop highlight"
```

---

## Chunk 5: Polish & Edge Cases

### Task 16: Update SelectionOverlay for auto-layout children

**Files:**

- Modify: `apps/editor-canvas/src/components/SelectionOverlay.tsx`

- [ ] **Step 1: Import utility**

```typescript
import { isAutoLayoutChild } from "@devom/editor-core"
```

- [ ] **Step 2: Detect auto-layout context**

After the element fetch:

```typescript
const inAutoLayout = element ? isAutoLayoutChild(element, (id) => documentStore.getElement(id)) : false
```

- [ ] **Step 3: Adjust resize handles based on sizing**

If `inAutoLayout` and sizing is `fill` or `hug`, hide the relevant resize handles:

```typescript
const filteredHandles = inAutoLayout
  ? handles.filter((h) => {
      const parent = documentStore.getElement(element!.parentId!)
      if (!parent) return true
      const dir = parent.layoutProps.direction
      const mainAxis = dir === "row" ? ["e", "w"] : ["n", "s"]
      const crossAxis = dir === "row" ? ["n", "s"] : ["e", "w"]
      // Hide main axis handles if fill
      if (element!.sizing[dir === "row" ? "w" : "h"] === "fill" && mainAxis.some((a) => h.position.includes(a))) return false
      // Hide cross axis handles if fill
      if (element!.sizing[dir === "row" ? "h" : "w"] === "fill" && crossAxis.some((a) => h.position.includes(a))) return false
      return true
    })
  : handles
```

Use `filteredHandles` instead of `handles` in the render.

- [ ] **Step 4: Commit**

```bash
git add apps/editor-canvas/src/components/SelectionOverlay.tsx
git commit -m "feat(editor-canvas): adjust resize handles for auto-layout children"
```

### Task 17: Update JSX export for auto-layout

**Files:**

- Modify: `packages/editor-core/src/export/jsxExport.ts`

- [ ] **Step 1: Handle layoutMode in style generation**

The current `styleToJsx` function already exports all CSSProperties. Since the canvas computes layout styles from `layoutProps` and applies them to the element's rendered style, the export needs to include these computed styles.

In `renderHtmlElement`, before generating the style string, compute the auto-layout CSS:

```typescript
import { getContainerStyles, getChildSizingStyles } from "../utils/layoutStyles"

// In renderHtmlElement, compute effective style:
const effectiveStyle = { ...el.style }
if (el.layoutMode === "flex") {
  Object.assign(effectiveStyle, getContainerStyles(el))
}
if (el.parentId) {
  const parent = elements[el.parentId]
  if (parent?.layoutMode === "flex") {
    const { position, left, top, ...rest } = effectiveStyle
    Object.assign(effectiveStyle, rest, getChildSizingStyles(el, parent.layoutProps.direction))
    delete (effectiveStyle as any).position
    delete (effectiveStyle as any).left
    delete (effectiveStyle as any).top
  }
}
const styleStr = styleToJsx(effectiveStyle)
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor-core/src/export/jsxExport.ts
git commit -m "feat(editor-core): include auto-layout styles in JSX export"
```

### Task 18: Handle external drag into auto-layout containers

**Files:**

- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

- [ ] **Step 1: Extend absolute drag to detect auto-layout containers**

In the existing `handlePointerDown` (absolute drag), modify the `onMove` handler to also check for auto-layout drop targets:

```typescript
// Inside onMove, after snap calculation:
const dropTarget = findDropTarget(me.clientX, me.clientY, dragIds, documentStore)
if (dropTarget) {
  onDropHighlight?.(dropTarget.containerId)
  const container = documentStore.getElement(dropTarget.containerId)
  if (container) {
    const indicator = calcInsertionIndicator(dropTarget.containerId, dropTarget.insertIndex, container.layoutProps.direction, dragIds, documentStore)
    onInsertionIndicator?.(indicator)
  }
  onSnapLines?.([]) // Disable snap when over a container
} else {
  onDropHighlight?.(null)
  onInsertionIndicator?.(null)
}
```

In `onUp`, check if dropping into a container:

```typescript
const dropTarget = findDropTarget(me.clientX, me.clientY, dragIds, documentStore)
if (dropTarget) {
  // Reparent into auto-layout container
  for (const t of dragTargets) {
    bridge.send({
      type: "REPARENT_ELEMENT",
      payload: {
        id: t.id,
        oldParentId: documentStore.getElement(t.id)?.parentId ?? documentStore.rootId,
        newParentId: dropTarget.containerId,
        index: dropTarget.insertIndex,
      },
    })
  }
  onInsertionIndicator?.(null)
  onDropHighlight?.(null)
  return
}
// ...existing absolute move logic
```

- [ ] **Step 2: Cleanup on cancel**

In `onCancel`, also clear indicators:

```typescript
const onCancel = () => {
  cleanup()
  clearTransforms()
  onInsertionIndicator?.(null)
  onDropHighlight?.(null)
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): support drag from absolute into auto-layout containers"
```

### Task 19: Final integration test & cleanup

- [ ] **Step 1: Full manual test**

Run dev server and test all scenarios:

1. Create a div → toggle Auto Layout on
2. Add multiple children (button, input, card, badge)
3. Verify direction toggle (row ↔ column)
4. Change gap, padding — verify visual update
5. Change align/justify — verify CSS
6. Drag child to reorder — blue line appears, order changes
7. Drag child out of container — becomes absolute at drop point
8. Drag absolute element into container — inserts at indicator
9. Change child sizing (Fixed/Hug/Fill) — verify CSS
10. Undo/Redo — verify state rolls back correctly
11. Export JSX — verify auto-layout styles included
12. Copy/paste auto-layout container — verify fields preserved
13. Lock/unlock — verify behavior with auto-layout

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Build all packages**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm build:packages && pnpm --filter @devom/editor-shell build && pnpm --filter @devom/editor-canvas build`
Expected: PASS

- [ ] **Step 4: Final commit if any fixes**

```bash
git add -A
git commit -m "fix(editor): polish auto-layout edge cases"
```
