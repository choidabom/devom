# Page Mode Web Builder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Page mode를 섹션 기반 웹 페이지 빌더로 강화 — grid 레이아웃, 섹션 프리셋, 페이지 비주얼 개선 포함.

**Architecture:** 기존 auto layout 인프라(flex, sizing, reorder/reparent)를 확장하여 `layoutMode: 'grid'`, `role`, `sectionProps`, `gridProps` 필드를 추가한다. 단일 요소 트리를 Canvas/Page 두 뷰로 렌더링하며, 섹션은 특별한 타입이 아닌 `role` 메타데이터가 있는 flex/grid 컨테이너다.

**Tech Stack:** React 19, MobX, TypeScript, Vite, shadcn/ui (Tailwind v3)

**Spec:** `docs/superpowers/specs/2026-03-11-page-mode-web-builder-design.md`

---

## File Structure

### Modified Files

| File | Responsibility | Changes |
|------|---------------|---------|
| `packages/editor-core/src/types.ts` | 타입 정의 | `role`, `SectionProps`, `GridProps` 타입 + `EditorElement` 확장, `LayoutMode`에 `'grid'` 추가 |
| `packages/editor-core/src/utils/layoutStyles.ts` | 레이아웃 → CSS 변환 | `getContainerStyles()`에 grid 지원 추가, `getSectionStyles()` 함수 추가 |
| `packages/editor-core/src/stores/DocumentStore.ts` | 상태 관리 | `addSection()` 메서드, 6개 섹션 프리셋 팩토리, `setGridProps()` 메서드 |
| `packages/editor-core/src/protocol.ts` | 메시지 프로토콜 | `UPDATE_SECTION_PROPS`, `SET_GRID_PROPS` 메시지 추가 |
| `packages/editor-core/src/index.ts` | 패키지 exports | 새 타입/유틸 re-export |
| `apps/editor-canvas/src/components/ElementRenderer.tsx` | 요소 렌더링 | 섹션 스타일(배경, maxWidth, 패딩) 적용, page mode root shadow |
| `apps/editor-shell/src/components/Toolbar.tsx` | 툴바 | Sections 카테고리 드롭다운 추가 |
| `apps/editor-shell/src/components/PropertiesPanel.tsx` | 속성 패널 | 섹션 속성 편집 UI, grid 설정 UI, layout mode 3-way 선택 |
| `apps/editor-shell/src/App.tsx` | Shell 메시지 처리 | 새 메시지 타입 핸들링 |
| `apps/editor-canvas/src/App.tsx` | Canvas 메시지 처리 | 새 메시지 타입 핸들링, 섹션 삽입 버튼 |

### New Files

| File | Responsibility |
|------|---------------|
| `packages/editor-core/src/presets/sectionPresets.ts` | 6개 섹션 프리셋 팩토리 함수 |
| `apps/editor-canvas/src/components/SectionInsertButton.tsx` | 섹션 간 `+ 섹션 추가` 버튼 컴포넌트 |

---

## Chunk 1: Data Model & Grid Layout

### Task 1: EditorElement 타입 확장

**Files:**
- Modify: `packages/editor-core/src/types.ts`

- [ ] **Step 1: `SectionProps` 인터페이스 추가**

`packages/editor-core/src/types.ts`의 `SizingProps` 정의 아래(약 line 75)에 추가:

```typescript
export interface SectionProps {
  backgroundColor?: string
  backgroundImage?: string
  maxWidth?: number
  verticalPadding?: number
}

export interface GridProps {
  columns: number
  gap: number
  minColumnWidth?: number
}

export const DEFAULT_GRID_PROPS: GridProps = {
  columns: 3,
  gap: 24,
}

export type SectionRole = 'section' | 'hero' | 'features' | 'cta' | 'footer' | 'header'
```

- [ ] **Step 2: `EditorElement`에 필드 추가**

`EditorElement` 인터페이스에 3개 optional 필드 추가:

```typescript
export interface EditorElement {
  // ... existing fields ...
  role?: SectionRole
  sectionProps?: SectionProps
  gridProps?: GridProps
}
```

- [ ] **Step 3: `LayoutMode`에 `'grid'` 추가**

현재 `layoutMode?: 'none' | 'flex'` → `layoutMode?: 'none' | 'flex' | 'grid'`로 변경. `EditorElement` 내부의 `layoutMode` 필드 타입을 수정.

- [ ] **Step 4: 빌드 확인**

```bash
pnpm --filter @devom/editor-core build
```

Expected: 성공 (타입 추가만, 기존 코드 변경 없음)

- [ ] **Step 5: 커밋**

```bash
git add packages/editor-core/src/types.ts
git commit -m "feat(editor-core): add SectionProps, GridProps types and grid layout mode"
```

---

### Task 2: Grid 레이아웃 스타일 유틸리티

**Files:**
- Modify: `packages/editor-core/src/utils/layoutStyles.ts`

- [ ] **Step 1: `getContainerStyles()`에 grid 지원 추가**

현재 `layoutMode === 'flex'`만 처리하는 `getContainerStyles()`를 확장:

```typescript
export function getContainerStyles(element: EditorElement): React.CSSProperties {
  if (element.layoutMode === 'flex' && element.layoutProps) {
    // ... existing flex code (unchanged) ...
  }

  if (element.layoutMode === 'grid' && element.gridProps) {
    const g = element.gridProps
    return {
      display: 'grid',
      gridTemplateColumns: g.minColumnWidth
        ? `repeat(auto-fit, minmax(${g.minColumnWidth}px, 1fr))`
        : `repeat(${g.columns}, 1fr)`,
      gap: g.gap,
    }
  }

  return {}
}
```

- [ ] **Step 2: `getSectionStyles()` 함수 추가**

같은 파일에 섹션 전용 스타일 유틸리티 추가:

```typescript
export function getSectionStyles(element: EditorElement): React.CSSProperties {
  if (!element.sectionProps) return {}
  const s = element.sectionProps
  const styles: React.CSSProperties = {}
  if (s.backgroundColor) styles.backgroundColor = s.backgroundColor
  if (s.backgroundImage) styles.backgroundImage = `url(${s.backgroundImage})`
  if (s.verticalPadding != null) {
    styles.paddingTop = s.verticalPadding
    styles.paddingBottom = s.verticalPadding
  }
  return styles
}

export function getSectionContentStyles(element: EditorElement): React.CSSProperties {
  if (!element.sectionProps?.maxWidth) return {}
  return {
    maxWidth: element.sectionProps.maxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  }
}
```

- [ ] **Step 3: `isAutoLayoutChild` 확장**

기존 `isAutoLayoutChild`가 `parent.layoutMode === 'flex'`만 체크 → `'grid'`도 포함:

```typescript
export function isAutoLayoutChild(element: EditorElement, getElement: (id: string) => EditorElement | undefined): boolean {
  if (!element.parentId) return false
  const parent = getElement(element.parentId)
  return parent?.layoutMode === 'flex' || parent?.layoutMode === 'grid'
}
```

- [ ] **Step 4: 빌드 확인**

```bash
pnpm --filter @devom/editor-core build
```

- [ ] **Step 5: 커밋**

```bash
git add packages/editor-core/src/utils/layoutStyles.ts
git commit -m "feat(editor-core): add grid container styles and section style utilities"
```

---

### Task 3: DocumentStore grid 메서드 추가

**Files:**
- Modify: `packages/editor-core/src/stores/DocumentStore.ts`

- [ ] **Step 1: `setLayoutMode` 확장 — grid 모드 지원**

현재 `setLayoutMode(id, mode: 'none' | 'flex')` 메서드에서 `'grid'` 처리 추가. grid 모드 진입 시 `gridProps`를 기본값으로 설정:

```typescript
setLayoutMode(id: string, mode: 'none' | 'flex' | 'grid') {
  const el = this.elements.get(id)
  if (!el) return

  if (mode === 'grid') {
    // grid 모드 진입
    el.layoutMode = 'grid'
    if (!el.gridProps) {
      el.gridProps = { ...DEFAULT_GRID_PROPS }
    }
    // 자식 요소 position: relative로 변환
    for (const childId of el.children) {
      const child = this.elements.get(childId)
      if (child && child.style.position === 'absolute') {
        child.canvasPosition = { x: child.style.left as number ?? 0, y: child.style.top as number ?? 0 }
        child.style = { ...child.style, position: 'relative' as const, left: undefined, top: undefined }
      }
    }
  } else if (mode === 'flex') {
    // ... existing flex code ...
  } else {
    // ... existing none code ...
  }

  el.layoutMode = mode
}
```

- [ ] **Step 2: `updateGridProps` 메서드 추가**

```typescript
updateGridProps(id: string, props: Partial<GridProps>) {
  const el = this.elements.get(id)
  if (!el || !el.gridProps) return
  el.gridProps = { ...el.gridProps, ...props }
}
```

- [ ] **Step 3: `updateSectionProps` 메서드 추가**

```typescript
updateSectionProps(id: string, props: Partial<SectionProps>) {
  const el = this.elements.get(id)
  if (!el) return
  el.sectionProps = { ...el.sectionProps, ...props }
}
```

- [ ] **Step 4: import 추가**

`DocumentStore.ts` 상단에 `DEFAULT_GRID_PROPS`, `GridProps`, `SectionProps` import 확인.

- [ ] **Step 5: 빌드 확인**

```bash
pnpm --filter @devom/editor-core build
```

- [ ] **Step 6: 커밋**

```bash
git add packages/editor-core/src/stores/DocumentStore.ts
git commit -m "feat(editor-core): add grid layout mode and section props to DocumentStore"
```

---

### Task 4: 프로토콜 메시지 추가

**Files:**
- Modify: `packages/editor-core/src/protocol.ts`

- [ ] **Step 1: Shell→Canvas 메시지 추가**

`ShellToCanvasMessage`에 추가:

```typescript
| { type: "UPDATE_SECTION_PROPS"; payload: { id: string; sectionProps: Partial<SectionProps> } }
| { type: "UPDATE_GRID_PROPS"; payload: { id: string; gridProps: Partial<GridProps> } }
| { type: "ADD_SECTION"; payload: { preset: SectionRole; index?: number } }
```

- [ ] **Step 2: Canvas→Shell 메시지 추가**

`CanvasToShellMessage`에 추가:

```typescript
| { type: "INSERT_SECTION_REQUEST"; payload: { preset: SectionRole; index: number } }
```

- [ ] **Step 3: import 추가**

`SectionProps`, `GridProps`, `SectionRole` import 확인.

- [ ] **Step 4: 빌드 확인**

```bash
pnpm --filter @devom/editor-core build
```

- [ ] **Step 5: 커밋**

```bash
git add packages/editor-core/src/protocol.ts
git commit -m "feat(editor-core): add section and grid protocol messages"
```

---

## Chunk 2: Section Presets & Page Visual

### Task 5: 섹션 프리셋 팩토리

**Files:**
- Create: `packages/editor-core/src/presets/sectionPresets.ts`
- Modify: `packages/editor-core/src/index.ts`

- [ ] **Step 1: 프리셋 팩토리 파일 생성**

`packages/editor-core/src/presets/sectionPresets.ts` 생성. 각 프리셋은 `EditorElement[]` 배열을 반환하는 함수 (첫 번째 요소가 섹션 컨테이너, 나머지가 자식):

```typescript
import { nanoid } from "nanoid"
import type { EditorElement, SectionRole, SectionProps } from "../types"
import { DEFAULT_ELEMENT_STYLE, DEFAULT_LAYOUT_PROPS } from "../types"

interface PresetResult {
  section: Omit<EditorElement, 'id'>
  children: Omit<EditorElement, 'id'>[]
}

function createText(content: string, style: Partial<React.CSSProperties> = {}): Omit<EditorElement, 'id'> {
  return {
    type: 'text',
    parentId: '',  // filled by caller
    children: [],
    style: { ...DEFAULT_ELEMENT_STYLE['text'], position: 'relative' as const, left: undefined, top: undefined, ...style },
    props: { content },
    locked: false,
    sizing: { width: 'hug', height: 'hug' },
  }
}

function createButton(label: string, style: Partial<React.CSSProperties> = {}): Omit<EditorElement, 'id'> {
  return {
    type: 'button',
    parentId: '',
    children: [],
    style: { ...DEFAULT_ELEMENT_STYLE['button'], position: 'relative' as const, left: undefined, top: undefined, ...style },
    props: { label },
    locked: false,
    sizing: { width: 'hug', height: 'hug' },
  }
}

function createDiv(style: Partial<React.CSSProperties> = {}, overrides: Partial<EditorElement> = {}): Omit<EditorElement, 'id'> {
  return {
    type: 'div',
    parentId: '',
    children: [],
    style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto', ...style },
    props: {},
    locked: false,
    sizing: { width: 'fill', height: 'hug' },
    ...overrides,
  }
}

export function createSectionPreset(role: SectionRole): PresetResult {
  switch (role) {
    case 'header':
      return {
        section: {
          type: 'div', parentId: '', children: [], locked: false,
          role: 'header',
          style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto', borderBottom: '1px solid #e5e7eb' },
          props: {},
          sizing: { width: 'fill', height: 'hug' },
          layoutMode: 'flex',
          layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'row', gap: 12, paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24, alignItems: 'center' },
          sectionProps: {},
        },
        children: [
          createDiv({ width: 32, height: 32, backgroundColor: '#6366f1', borderRadius: 6 }, { sizing: { width: 'fixed', height: 'fixed' } }),
          createText('My App', { fontWeight: '600', fontSize: 16, color: '#1e293b' }),
          createText('Home', { fontSize: 14, color: '#64748b', marginLeft: 'auto' }),
          createText('About', { fontSize: 14, color: '#64748b' }),
          createText('Contact', { fontSize: 14, color: '#64748b' }),
        ],
      }

    case 'hero':
      return {
        section: {
          type: 'div', parentId: '', children: [], locked: false,
          role: 'hero',
          style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto' },
          props: {},
          sizing: { width: 'fill', height: 'hug' },
          layoutMode: 'flex',
          layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column', gap: 16, paddingTop: 80, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, alignItems: 'center' },
          sectionProps: { backgroundColor: '#6366f1', verticalPadding: 80 },
        },
        children: [
          createText('Build something amazing', { fontSize: 36, fontWeight: '700', color: '#ffffff', textAlign: 'center' }),
          createText('Create beautiful web pages with our intuitive editor', { fontSize: 18, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }),
          createButton('Get Started', { backgroundColor: '#ffffff', color: '#6366f1' }),
        ],
      }

    case 'features':
      return {
        section: {
          type: 'div', parentId: '', children: [], locked: false,
          role: 'features',
          style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto' },
          props: {},
          sizing: { width: 'fill', height: 'hug' },
          layoutMode: 'grid',
          gridProps: { columns: 3, gap: 24 },
          layoutProps: { ...DEFAULT_LAYOUT_PROPS, paddingTop: 60, paddingBottom: 60, paddingLeft: 24, paddingRight: 24 },
          sectionProps: { backgroundColor: '#f8fafc', verticalPadding: 60 },
        },
        children: [
          createDiv({ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }, {
            layoutMode: 'flex', layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column', gap: 8 }, sizing: { width: 'fill', height: 'hug' },
          }),
          createDiv({ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }, {
            layoutMode: 'flex', layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column', gap: 8 }, sizing: { width: 'fill', height: 'hug' },
          }),
          createDiv({ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }, {
            layoutMode: 'flex', layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column', gap: 8 }, sizing: { width: 'fill', height: 'hug' },
          }),
        ],
      }

    case 'cta':
      return {
        section: {
          type: 'div', parentId: '', children: [], locked: false,
          role: 'cta',
          style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto' },
          props: {},
          sizing: { width: 'fill', height: 'hug' },
          layoutMode: 'flex',
          layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column', gap: 16, paddingTop: 60, paddingBottom: 60, paddingLeft: 24, paddingRight: 24, alignItems: 'center' },
          sectionProps: { backgroundColor: '#1e293b', verticalPadding: 60 },
        },
        children: [
          createText('Ready to get started?', { fontSize: 28, fontWeight: '700', color: '#ffffff', textAlign: 'center' }),
          createButton('Sign Up Now', { backgroundColor: '#6366f1', color: '#ffffff' }),
        ],
      }

    case 'footer':
      return {
        section: {
          type: 'div', parentId: '', children: [], locked: false,
          role: 'footer',
          style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto' },
          props: {},
          sizing: { width: 'fill', height: 'hug' },
          layoutMode: 'flex',
          layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'row', gap: 24, paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, alignItems: 'center' },
          sectionProps: { backgroundColor: '#1e293b' },
        },
        children: [
          createText('© 2026 My App', { fontSize: 13, color: '#94a3b8' }),
          createText('Privacy', { fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }),
          createText('Terms', { fontSize: 13, color: '#94a3b8' }),
        ],
      }

    case 'section':
    default:
      return {
        section: {
          type: 'div', parentId: '', children: [], locked: false,
          role: 'section',
          style: { ...DEFAULT_ELEMENT_STYLE['div'], position: 'relative' as const, left: undefined, top: undefined, height: 'auto' },
          props: {},
          sizing: { width: 'fill', height: 'hug' },
          layoutMode: 'flex',
          layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column', gap: 16, paddingTop: 40, paddingBottom: 40, paddingLeft: 24, paddingRight: 24 },
          sectionProps: {},
        },
        children: [],
      }
  }
}
```

- [ ] **Step 2: DocumentStore에 `addSection` 메서드 추가**

`packages/editor-core/src/stores/DocumentStore.ts`에 추가:

```typescript
addSection(role: SectionRole, index?: number) {
  const preset = createSectionPreset(role)
  const sectionId = nanoid()
  const root = this.elements.get(this.rootId)
  if (!root) return

  // 섹션 요소 생성
  const section: EditorElement = {
    ...preset.section,
    id: sectionId,
    parentId: this.rootId,
  }
  this.elements.set(sectionId, section)

  // 자식 요소 생성
  for (const childTemplate of preset.children) {
    const childId = nanoid()
    const child: EditorElement = {
      ...childTemplate,
      id: childId,
      parentId: sectionId,
    }
    this.elements.set(childId, child)
    section.children = [...section.children, childId]
  }

  // root에 삽입
  if (index != null && index < root.children.length) {
    const newChildren = [...root.children]
    newChildren.splice(index, 0, sectionId)
    root.children = newChildren
  } else {
    root.children = [...root.children, sectionId]
  }
}
```

- [ ] **Step 3: index.ts에 export 추가**

`packages/editor-core/src/index.ts`에 추가:

```typescript
export * from "./presets/sectionPresets"
```

- [ ] **Step 4: 빌드 확인**

```bash
pnpm --filter @devom/editor-core build
```

- [ ] **Step 5: 커밋**

```bash
git add packages/editor-core/src/presets/sectionPresets.ts packages/editor-core/src/stores/DocumentStore.ts packages/editor-core/src/index.ts
git commit -m "feat(editor-core): add section preset factory and addSection method"
```

---

### Task 6: ElementRenderer — 페이지 비주얼 & 섹션 렌더링

**Files:**
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

- [ ] **Step 1: import 추가**

`ElementRenderer.tsx` 상단에 추가:

```typescript
import { getSectionStyles, getSectionContentStyles } from "@devom/editor-core"
```

- [ ] **Step 2: root 요소에 page mode 비주얼 추가**

ElementRenderer의 return JSX에서, root 요소(`isRoot && canvasMode === 'page'`)일 때 shadow와 border-radius를 적용. `canvasMode`는 새 prop으로 전달받거나, documentStore에서 읽음.

root div의 style에 조건부 추가:

```typescript
style={{
  ...element.style,
  // ... existing spreads ...
  // Page mode: root에 그림자와 둥근 모서리
  ...(isRoot && documentStore.canvasMode === 'page' ? {
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  } : {}),
}}
```

- [ ] **Step 3: 섹션 스타일 적용**

섹션(`element.role`)이 있는 요소에 `getSectionStyles()` 적용:

```typescript
const sectionStyles = getSectionStyles(element)

// div의 style에 merge
style={{
  ...element.style,
  ...sectionStyles,
  // ... existing spreads ...
}}
```

- [ ] **Step 4: 섹션 maxWidth 처리**

`sectionProps.maxWidth`가 있는 섹션은 내부에 wrapper div를 추가하여 콘텐츠 폭 제한:

```typescript
const contentStyles = getSectionContentStyles(element)
const hasContentWrapper = element.sectionProps?.maxWidth != null

// 렌더링:
{hasContentWrapper ? (
  <div style={contentStyles}>
    {element.children.map(childId => <ElementRenderer ... />)}
  </div>
) : (
  element.children.map(childId => <ElementRenderer ... />)
)}
```

- [ ] **Step 5: 빌드 확인**

```bash
pnpm --filter @devom/editor-canvas build
```

- [ ] **Step 6: 커밋**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx
git commit -m "feat(editor-canvas): add page visual shadow and section rendering styles"
```

---

## Chunk 3: Shell UI — Toolbar, Properties Panel, Message Handling

### Task 7: Toolbar에 Sections 카테고리 추가

**Files:**
- Modify: `apps/editor-shell/src/components/Toolbar.tsx`

- [ ] **Step 1: 섹션 프리셋 목록 상수 추가**

`SHADCN_COMPONENTS` 배열 아래에 추가:

```typescript
const SECTION_PRESETS = [
  { role: 'section' as const, label: 'Empty Section', icon: '☐' },
  { role: 'header' as const, label: 'Header', icon: '▔' },
  { role: 'hero' as const, label: 'Hero', icon: '◆' },
  { role: 'features' as const, label: 'Features', icon: '▦' },
  { role: 'cta' as const, label: 'CTA', icon: '▶' },
  { role: 'footer' as const, label: 'Footer', icon: '▁' },
]
```

- [ ] **Step 2: Toolbar props에 `onAddSection` 추가**

```typescript
interface ToolbarProps {
  // ... existing props ...
  onAddSection?: (role: SectionRole) => void
  canvasMode: CanvasMode
}
```

- [ ] **Step 3: Sections 드롭다운 UI 추가**

기존 UI 드롭다운(`showUI` state) 옆에 Sections 드롭다운 추가. Page mode일 때만 표시:

```typescript
{canvasMode === 'page' && (
  <div style={{ position: 'relative' }}>
    <ToolBtn icon={<LayoutTemplate size={15} />} onClick={() => setShowSections(p => !p)} label="Sections" />
    {showSections && (
      <div style={{
        position: 'absolute', top: '100%', left: 0, marginTop: 4,
        background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0', padding: 4, zIndex: 200, minWidth: 160,
      }}>
        {SECTION_PRESETS.map(p => (
          <button key={p.role} onClick={() => { onAddSection?.(p.role); setShowSections(false) }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
              fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ marginRight: 8 }}>{p.icon}</span>{p.label}
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: `LayoutTemplate` 아이콘 import**

```typescript
import { ..., LayoutTemplate } from "lucide-react"
```

- [ ] **Step 5: 빌드 확인**

```bash
pnpm --filter @devom/editor-shell build
```

- [ ] **Step 6: 커밋**

```bash
git add apps/editor-shell/src/components/Toolbar.tsx
git commit -m "feat(editor-shell): add Sections dropdown to toolbar for page mode"
```

---

### Task 8: PropertiesPanel — 섹션 속성 & Grid 설정 UI

**Files:**
- Modify: `apps/editor-shell/src/components/PropertiesPanel.tsx`

- [ ] **Step 1: Layout Mode 3-way 선택 UI**

현재 Auto Layout 토글(flex on/off)을 3-way 선택으로 변경:

```typescript
{!isMulti && (
  <PropSection label="Layout">
    <PropSelect label="Mode" value={element.layoutMode ?? 'none'}
      options={[
        { value: 'none', label: 'None' },
        { value: 'flex', label: 'Flex' },
        { value: 'grid', label: 'Grid' },
      ]}
      onChange={v => {
        historyStore.pushSnapshot()
        documentStore.setLayoutMode(element.id, v as 'none' | 'flex' | 'grid')
        syncToCanvas()
      }}
    />
    {/* Flex settings (existing) */}
    {element.layoutMode === 'flex' && element.layoutProps && (
      // ... existing flex controls ...
    )}
    {/* Grid settings (new) */}
    {element.layoutMode === 'grid' && element.gridProps && (
      <>
        <PropRow label="Columns">
          <input type="number" value={element.gridProps.columns} min={1} max={12}
            onChange={e => {
              historyStore.pushSnapshot()
              documentStore.updateGridProps(element.id, { columns: Number(e.target.value) })
              syncToCanvas()
            }} />
        </PropRow>
        <PropRow label="Gap">
          <input type="number" value={element.gridProps.gap} min={0}
            onChange={e => {
              historyStore.pushSnapshot()
              documentStore.updateGridProps(element.id, { gap: Number(e.target.value) })
              syncToCanvas()
            }} />
        </PropRow>
      </>
    )}
  </PropSection>
)}
```

- [ ] **Step 2: Section Props 편집 UI**

섹션(`element.role`)이 있는 요소 선택 시 표시:

```typescript
{!isMulti && element.role && (
  <PropSection label="Section">
    <PropRow label="Background">
      <input type="color" value={element.sectionProps?.backgroundColor ?? '#ffffff'}
        onChange={e => {
          historyStore.pushSnapshot()
          documentStore.updateSectionProps(element.id, { backgroundColor: e.target.value })
          syncToCanvas()
        }} />
    </PropRow>
    <PropRow label="Max Width">
      <input type="number" value={element.sectionProps?.maxWidth ?? ''} placeholder="auto"
        onChange={e => {
          historyStore.pushSnapshot()
          const val = e.target.value ? Number(e.target.value) : undefined
          documentStore.updateSectionProps(element.id, { maxWidth: val })
          syncToCanvas()
        }} />
    </PropRow>
    <PropRow label="V. Padding">
      <input type="number" value={element.sectionProps?.verticalPadding ?? 0} min={0}
        onChange={e => {
          historyStore.pushSnapshot()
          documentStore.updateSectionProps(element.id, { verticalPadding: Number(e.target.value) })
          syncToCanvas()
        }} />
    </PropRow>
  </PropSection>
)}
```

- [ ] **Step 3: 빌드 확인**

```bash
pnpm --filter @devom/editor-shell build
```

- [ ] **Step 4: 커밋**

```bash
git add apps/editor-shell/src/components/PropertiesPanel.tsx
git commit -m "feat(editor-shell): add grid layout and section props to PropertiesPanel"
```

---

### Task 9: Shell App — 메시지 핸들링 & addSection 연결

**Files:**
- Modify: `apps/editor-shell/src/App.tsx`

- [ ] **Step 1: `handleAddSection` 콜백 추가**

기존 `handleAddElement` 근처에:

```typescript
const handleAddSection = useCallback((role: SectionRole) => {
  historyStore.pushSnapshot()
  documentStore.addSection(role)
  syncToCanvas()
}, [syncToCanvas])
```

- [ ] **Step 2: Canvas→Shell 메시지 핸들링**

`INSERT_SECTION_REQUEST` 처리 추가 (섹션 삽입 버튼에서 오는 메시지):

```typescript
case "INSERT_SECTION_REQUEST":
  historyStore.pushSnapshot()
  documentStore.addSection(msg.payload.preset, msg.payload.index)
  syncToCanvas()
  break
```

- [ ] **Step 3: Toolbar에 `onAddSection` prop 전달**

```typescript
<Toolbar
  // ... existing props ...
  onAddSection={handleAddSection}
/>
```

- [ ] **Step 4: import 추가**

`SectionRole` type import:

```typescript
import { ..., SectionRole } from "@devom/editor-core"
```

- [ ] **Step 5: 빌드 확인**

```bash
pnpm --filter @devom/editor-shell build
```

- [ ] **Step 6: 커밋**

```bash
git add apps/editor-shell/src/App.tsx
git commit -m "feat(editor-shell): wire up section adding and message handling"
```

---

## Chunk 4: Canvas UI — Section Insert Button

### Task 10: 섹션 삽입 버튼 컴포넌트

**Files:**
- Create: `apps/editor-canvas/src/components/SectionInsertButton.tsx`

- [ ] **Step 1: 컴포넌트 생성**

섹션과 섹션 사이에 호버 시 `+ 섹션 추가` 버튼을 표시하는 컴포넌트:

```typescript
import { useState } from "react"
import type { SectionRole } from "@devom/editor-core"

interface SectionInsertButtonProps {
  index: number
  onInsert: (role: SectionRole, index: number) => void
}

const PRESETS: { role: SectionRole; label: string }[] = [
  { role: 'section', label: 'Empty Section' },
  { role: 'header', label: 'Header' },
  { role: 'hero', label: 'Hero' },
  { role: 'features', label: 'Features' },
  { role: 'cta', label: 'CTA' },
  { role: 'footer', label: 'Footer' },
]

export function SectionInsertButton({ index, onInsert }: SectionInsertButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMenu(false) }}
    >
      {(hovered || showMenu) && (
        <>
          {/* Dashed line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed #cbd5e1' }} />
          {/* + button */}
          <button
            onClick={() => setShowMenu(p => !p)}
            style={{
              position: 'relative', zIndex: 1,
              width: 24, height: 24, borderRadius: '50%',
              background: '#6366f1', color: '#fff', border: 'none',
              fontSize: 14, lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
          {/* Preset menu */}
          {showMenu && (
            <div style={{
              position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
              background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0', padding: 4, zIndex: 200, minWidth: 140,
            }}>
              {PRESETS.map(p => (
                <button key={p.role} onClick={() => { onInsert(p.role, index); setShowMenu(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', fontSize: 11, border: 'none',
                    background: 'none', cursor: 'pointer', borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/editor-canvas/src/components/SectionInsertButton.tsx
git commit -m "feat(editor-canvas): add SectionInsertButton component"
```

---

### Task 11: ElementRenderer에 섹션 삽입 버튼 통합

**Files:**
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`
- Modify: `apps/editor-canvas/src/App.tsx`

- [ ] **Step 1: ElementRenderer에 page mode일 때 섹션 삽입 버튼 렌더링**

Root 요소의 children 렌더링 부분에서, page mode이고 root일 때 각 child 사이에 `SectionInsertButton` 삽입:

```typescript
import { SectionInsertButton } from "./SectionInsertButton"

// root 요소의 children 렌더링 수정:
{isRoot && documentStore.canvasMode === 'page' && editorMode === 'edit' ? (
  <>
    <SectionInsertButton index={0} onInsert={handleInsertSection} />
    {element.children.map((childId, i) => (
      <React.Fragment key={childId}>
        <ElementRenderer ... />
        <SectionInsertButton index={i + 1} onInsert={handleInsertSection} />
      </React.Fragment>
    ))}
  </>
) : (
  element.children.map((childId) => (
    <ElementRenderer key={childId} ... />
  ))
)}
```

- [ ] **Step 2: `handleInsertSection` 콜백 추가**

ElementRenderer에 `onInsertSection` prop 추가하거나, bridge를 통해 메시지 전송:

```typescript
const handleInsertSection = (role: SectionRole, index: number) => {
  bridge.send({ type: "INSERT_SECTION_REQUEST", payload: { preset: role, index } })
}
```

- [ ] **Step 3: SectionInsertButton에 onPointerDown stopPropagation 추가**

ViewportBar와 같은 이슈 방지:

```typescript
<div onPointerDown={e => e.stopPropagation()} ...>
```

- [ ] **Step 4: 전체 빌드 확인**

```bash
pnpm --filter @devom/editor-core build && pnpm --filter @devom/editor-shell build && pnpm --filter @devom/editor-canvas build
```

- [ ] **Step 5: 커밋**

```bash
git add apps/editor-canvas/src/components/ElementRenderer.tsx apps/editor-canvas/src/App.tsx
git commit -m "feat(editor-canvas): integrate section insert buttons in page mode"
```

---

### Task 12: 통합 테스트 — dev 서버에서 수동 검증

- [ ] **Step 1: dev 서버 시작**

```bash
pnpm --filter @devom/editor-shell dev &
pnpm --filter @devom/editor-canvas dev &
```

- [ ] **Step 2: 기능 검증 체크리스트**

1. Page mode 전환 시 root에 그림자/border-radius 적용됨
2. Toolbar의 Sections 드롭다운에서 프리셋 선택 → 섹션 추가됨
3. 추가된 섹션에 배경색이 적용됨
4. 섹션 선택 시 PropertiesPanel에 Section 속성 UI 표시됨
5. Section 배경색 변경 가능
6. Layout mode를 Grid로 변경 가능, columns/gap 조절 가능
7. 섹션 간 `+` 버튼 호버 시 표시, 클릭 시 프리셋 메뉴 표시
8. Desktop/Tablet/Mobile viewport 전환 시 섹션이 full-width 유지
9. Page↔Canvas 모드 전환 후 돌아와도 섹션 유지됨
10. Undo/Redo로 섹션 추가/삭제 되돌리기 가능

- [ ] **Step 3: 최종 커밋**

수동 검증 중 발견된 버그 수정 후 커밋.
