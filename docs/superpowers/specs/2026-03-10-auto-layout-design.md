# Auto Layout (Flexbox) Design Spec

## Overview

EditorElement에 `layoutMode` 속성을 추가하여 임의의 요소를 Flexbox Auto Layout 컨테이너로 전환 가능하게 한다. 자식 요소는 Fixed/Hug/Fill 사이징 모델을 가지며, 캔버스에서 드래그로 컨테이너 진입/이탈/순서 변경이 가능하다.

## Decisions

| 항목          | 결정                        | 근거                                       |
| ------------- | --------------------------- | ------------------------------------------ |
| 범위          | Figma 스타일 Auto Layout    | 업계 표준, 데우스와 동일 수준              |
| 컨테이너 진입 | 캔버스 드래그 앤 드롭       | 직관적, Figma/데우스 방식                  |
| 사이징 모델   | Fixed/Hug/Fill              | 3가지 모두 필요, DOM CSS로 자연스럽게 매핑 |
| 순서 변경     | 삽입 인디케이터 (파란 라인) | 구현 난이도 대비 UX 최적                   |
| 스타일 전환   | 자동 (absolute ↔ flow)     | 드롭 행위가 의도를 표현                    |
| 구현 방식     | layoutMode 프로퍼티 추가    | 타입과 레이아웃 관심사 분리, 유연성        |

## Data Model

### New Types

```typescript
type SizingMode = "fixed" | "hug" | "fill"

interface LayoutProps {
  direction: "row" | "column"
  gap: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  alignItems: "start" | "center" | "end" | "stretch"
  justifyContent: "start" | "center" | "end" | "space-between"
}

interface SizingProps {
  w: SizingMode
  h: SizingMode
}
```

### EditorElement Extension

```typescript
interface EditorElement {
  // ...existing fields
  layoutMode: "none" | "flex"
  layoutProps: LayoutProps
  sizing: SizingProps
}
```

### Defaults

```typescript
const DEFAULT_LAYOUT_PROPS: LayoutProps = {
  direction: "column",
  gap: 8,
  paddingTop: 8,
  paddingRight: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  alignItems: "start",
  justifyContent: "start",
}

const DEFAULT_SIZING: SizingProps = {
  w: "fixed",
  h: "fixed",
}
```

### CSS Mapping

| State                                 | CSS Applied                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `layoutMode: 'flex'`                  | `display: flex`, `flexDirection`, `gap`, `padding`, `alignItems`, `justifyContent` |
| Child `sizing.w: 'fill'` (parent row) | `flex: 1 0 0`, width removed                                                       |
| Child `sizing.w: 'hug'`               | `width: fit-content`                                                               |
| Child `sizing.w: 'fixed'`             | Existing width preserved                                                           |
| Auto Layout child                     | `position: relative`, `left`/`top` removed                                         |
| Non-Auto Layout child                 | `position: absolute` (existing behavior)                                           |

### Invariants

- `layoutMode: 'none'` children use absolute positioning
- `layoutMode: 'flex'` children use flow positioning (position: relative)
- Entering Auto Layout container removes `left`/`top` styles
- Leaving Auto Layout container restores absolute positioning at drop coordinates

## Canvas Rendering & Drag Behavior

### Rendering

ElementRenderer branches on parent's `layoutMode`:

- **Parent `layoutMode: 'none'`** (existing): children use position: absolute, left/top
- **Parent `layoutMode: 'flex'`**: container gets display: flex + layout props as CSS, children get position: relative, sizing determines flex/width/height

### Three Drag Scenarios

#### 1. Reorder (within Auto Layout)

- Drag starts on Auto Layout child
- During drag: placeholder at original position, blue insertion indicator between siblings
- Drop: reorder in `children` array

#### 2. Insert (external → Auto Layout)

- Absolute element dragged over Auto Layout container
- Container highlights, insertion indicator appears
- Drop: reparent, convert absolute → flow, insert at indicated position

#### 3. Extract (Auto Layout → external)

- Auto Layout child dragged outside container bounds
- Container highlight removed
- Drop: reparent to root, convert flow → absolute at drop coordinates

### Insertion Index Calculation

- Parent `direction: 'row'`: compare mouse X against each child's centerX
- Parent `direction: 'column'`: compare mouse Y against each child's centerY

### Resize Behavior

- `fixed`: existing resize behavior (direct width/height change)
- `fill`: resize handles disabled (flex determines size)
- `hug`: resizing converts to `fixed` mode

### Snap Guides

Disabled inside Auto Layout containers (order-based, not coordinate-based).

## Properties Panel UI

### Auto Layout Container Section

Shown when selected element has or can have Auto Layout:

```
┌─ Auto Layout ──────────────────────┐
│ [+ Auto Layout]  or  [- Remove]    │  ← layoutMode toggle
│ Direction:  [↓ Column ▾]           │  ← row / column dropdown
│ Gap:        [8    ]                 │
│ Align:      [≡] [≡] [≡] [≡]       │  ← start/center/end/stretch icons
│ Justify:    [≡] [≡] [≡] [≡]       │  ← start/center/end/space-between
│ Padding:    [8] [8] [8] [8]        │  ← top/right/bottom/left
└─────────────────────────────────────┘
```

### Child Sizing Section

Replaces Position(X,Y) / Size(W,H) when parent is Auto Layout:

```
┌─ Sizing ───────────────────────────┐
│ W:  [Fixed ▾] [120  ]              │  ← value input only for Fixed
│ H:  [Hug   ▾]                      │  ← no value for Hug/Fill
└─────────────────────────────────────┘
```

### Conditional Display Logic

| Selection State            | Shown Sections                      |
| -------------------------- | ----------------------------------- |
| Absolute element           | Position(X,Y) + Size(W,H) + Style   |
| Auto Layout container      | **Auto Layout** + Size(W,H) + Style |
| Auto Layout child          | **Sizing** (no Position) + Style    |
| Nested (container + child) | Auto Layout + Sizing                |

### LeftPanel Change

Auto Layout containers get visual distinction in layer tree:

- Flex icon + direction indicator next to container name

## Message Protocol

### New Messages

```typescript
// Shell → Canvas
| { type: 'SET_LAYOUT_MODE'; payload: { id: string; mode: 'none' | 'flex' } }
| { type: 'UPDATE_LAYOUT_PROPS'; payload: { id: string; layoutProps: Partial<LayoutProps> } }
| { type: 'UPDATE_SIZING'; payload: { id: string; sizing: Partial<SizingProps> } }

// Canvas → Shell
| { type: 'REORDER_CHILD'; payload: { parentId: string; childId: string; newIndex: number } }
| { type: 'REPARENT_ELEMENT'; payload: {
    id: string;
    oldParentId: string;
    newParentId: string;
    index: number;
    dropPosition?: { x: number; y: number }
  } }
```

### DocumentStore New Methods

```typescript
setLayoutMode(id, mode)
  → flex: remove children's position/left/top
  → none: restore absolute positioning based on current rendered positions

updateLayoutProps(id, props: Partial<LayoutProps>)

updateSizing(id, sizing: Partial<SizingProps>)

reorderChild(parentId, childId, newIndex)
  → move childId within parent's children array

reparentElement(id, newParentId, index, dropPosition?)
  → remove from old parent's children
  → insert into new parent's children at index
  → if new parent is flex: remove absolute styles, apply default sizing
  → if new parent is none: set absolute styles from dropPosition
```

### Impact on Existing Messages

| Existing Message  | Change                                                 |
| ----------------- | ------------------------------------------------------ |
| `ELEMENTS_MOVED`  | Ignored for Auto Layout children (use reorder instead) |
| `ELEMENT_RESIZED` | Converts fill/hug to fixed before applying             |
| `SYNC_DOCUMENT`   | Includes new fields (layoutMode, layoutProps, sizing)  |
| `ADD_ELEMENT`     | Auto-applies flow style if parent is flex              |
