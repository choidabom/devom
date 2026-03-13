# Element Lock Feature Design

## Overview

요소를 잠가서 이동/리사이즈/삭제를 방지하는 기능. 선택과 속성 편집은 허용.

## Behavior Rules

| Action                              | When Locked              |
| ----------------------------------- | ------------------------ |
| Click select                        | Allowed                  |
| Drag move                           | Blocked                  |
| Resize                              | Blocked (handles hidden) |
| Delete key                          | Blocked                  |
| Property editing (Properties Panel) | Allowed                  |
| Lock/Unlock toggle                  | Allowed                  |

## Lock/Unlock UI Locations

1. **Properties Panel** — Lock toggle button for selected element(s)
2. **Left Panel (Layer list)** — Lock icon toggle per element
3. **Right-click Context Menu** — "Lock" / "Unlock" menu item

## Canvas Visual Indicator

- Locked element selected: **lock icon replaces resize handles**
- Selection border remains visible (to indicate selection)

## Multi-Select Behavior

- If any selected element is locked, **entire group drag is blocked**
- Lock toggle in Properties Panel applies to all selected elements

## Affected Systems

### 1. DocumentStore

- Add `toggleLock(id: string)` action
- Add `isLocked(id: string)` helper

### 2. Canvas — ElementRenderer

- Block drag initiation for locked elements
- When multi-dragging, if any element in selection is locked, block all movement

### 3. Canvas — SelectionOverlay

- When selected element is locked: hide resize handles, show lock icon instead

### 4. Shell — App (message handling)

- Filter out locked elements from DELETE key handling

### 5. Shell — PropertiesPanel

- Add lock toggle button (top of panel)

### 6. Shell — LeftPanel

- Add lock icon toggle per layer item

### 7. Canvas — Context Menu (new)

- Right-click on element shows context menu with Lock/Unlock option

### 8. Protocol

- Add `TOGGLE_LOCK` message (Shell → Canvas)
- Add `CONTEXT_MENU_ACTION` message (Canvas → Shell) for right-click actions

## Existing Type Support

`EditorElement` already has `locked: boolean` field defined in `packages/editor-core/src/types.ts`. No type changes needed.
