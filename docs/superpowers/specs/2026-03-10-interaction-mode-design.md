# Interaction Mode Design

## Overview

편집 모드 / 인터랙션 모드 토글. 인터랙션 모드에서는 에디터 기능이 모두 꺼지고 실제 shadcn/ui 컴포넌트를 조작할 수 있음.

## Mode Comparison

|                   | Edit Mode (default)   | Interaction Mode                    |
| ----------------- | --------------------- | ----------------------------------- |
| Click             | Select element        | Component action (button click etc) |
| Drag              | Move element          | Component action (text drag etc)    |
| Pointer events    | Intercepted by editor | Passed to component                 |
| SelectionOverlay  | Shown                 | Hidden                              |
| SnapGuides        | Active                | Disabled                            |
| Marquee selection | Active                | Disabled                            |
| Input             | readOnly              | Editable                            |
| Properties Panel  | Shown                 | "Interaction Mode" message          |

## Mode Switching

- **Toolbar toggle button**: cursor icon (edit) / play icon (interact)
- **Keyboard shortcut**: `V` (edit) / `P` (interact)
- **ESC**: interact → edit fallback

## Affected Systems

### 1. Protocol

- Add `SET_MODE` message to `ShellToCanvasMessage`: `{ mode: "edit" | "interact" }`

### 2. Shell App

- Mode state management (`editorMode: "edit" | "interact"`)
- Send `SET_MODE` to Canvas on toggle
- Keyboard shortcut handling (V, P)

### 3. Shell Toolbar

- Mode toggle button (cursor ↔ play icon)
- Visual indicator for current mode

### 4. Shell PropertiesPanel

- Show "Interaction Mode" message when in interact mode

### 5. Canvas App

- Store mode state (received via `SET_MODE`)
- When interact mode: disable marquee handlers, hide SelectionOverlay
- Forward ESC key to shell for mode switch

### 6. Canvas ElementRenderer

- When interact mode: skip `handleClick` (selection) and `handlePointerDown` (drag)
- Remove `readOnly` from input elements
- Remove `cursor: move` override
- Let pointer events pass through to actual components

## Implementation Key Points

Canvas branching only needed in two places:

- **Canvas App**: if `interactionMode`, disable `onPointerDown/Move/Up` (marquee), hide SelectionOverlay
- **ElementRenderer**: if `interactionMode`, skip `handleClick`, `handlePointerDown`, remove `readOnly`
