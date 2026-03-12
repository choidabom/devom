# Template System + JSX Importer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 에디터에 빌트인 템플릿 4종 + JSX 임포터를 추가하여 다양한 shadcn/ui UI를 로드/임포트할 수 있게 한다.

**Architecture:** DocumentStore에 loadTemplate()/importElements() 메서드 추가. 빌트인 템플릿은 기존 initDemo() 패턴의 빌더 함수. JSX 임포터는 @babel/parser로 AST 파싱 → componentMap/tailwindMap으로 ElementTemplate 트리 생성. Shell Toolbar에 Templates 드롭다운 + Import 모달 추가.

**Tech Stack:** TypeScript, MobX, @babel/parser, React

**Spec:** `docs/superpowers/specs/2026-03-12-template-system-jsx-importer-design.md`

---

## Chunk 1: Template Infrastructure + Dashboard 추출

### Task 1: ElementTemplate 타입 추가

**Files:**
- Modify: `packages/editor-core/src/types.ts`

- [ ] **Step 1: types.ts에 ElementTemplate 타입 추가**

`packages/editor-core/src/types.ts` 파일 끝에 추가:

```ts
export type ElementTemplate = Omit<EditorElement, 'id' | 'parentId' | 'children'> & {
  children: ElementTemplate[]
}
```

- [ ] **Step 2: index.ts에서 이미 `export * from "./types"` 하고 있으므로 별도 작업 불필요. 빌드 확인**

Run: `pnpm --filter @devom/editor-core build`
Expected: 성공, dist에 ElementTemplate 타입 포함

- [ ] **Step 3: Commit**

```
feat(editor-core): add ElementTemplate type for template system
```

---

### Task 2: Dashboard 템플릿 추출 + loadTemplate 메서드

**Files:**
- Create: `packages/editor-core/src/presets/templates/dashboard.ts`
- Create: `packages/editor-core/src/presets/templates/index.ts`
- Modify: `packages/editor-core/src/stores/DocumentStore.ts`
- Modify: `packages/editor-core/src/index.ts`

- [ ] **Step 1: dashboard.ts 생성 — initDemo() 코드를 함수로 추출**

`packages/editor-core/src/presets/templates/dashboard.ts` 생성.

`DocumentStore.initDemo()` 메서드의 내용(47행~320행)을 그대로 복사하되, 함수 시그니처를 변경:

```ts
import type { DocumentStore } from "../../stores/DocumentStore"
import type { EditorElement, SizingProps } from "../../types"
import { DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING, DEFAULT_ELEMENT_STYLE } from "../../types"
import { nanoid } from "nanoid"

export function buildDashboard(store: DocumentStore): void {
  // initDemo()의 기존 내용을 그대로 복사
  // this.elements → store.elements
  // this.rootId → store.rootId
  // 나머지 add() 헬퍼와 모든 요소 생성 코드 동일
}
```

핵심: `this.` 참조를 `store.`로 변경. `add()` 헬퍼 함수는 함수 내부에 그대로 유지.

- [ ] **Step 2: templates/index.ts 생성 — 메타데이터 + 빌더 맵**

```ts
import type { DocumentStore } from "../../stores/DocumentStore"
import { buildDashboard } from "./dashboard"

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: 'dashboard' | 'form' | 'marketing' | 'content'
}

export type TemplateBuilder = (store: DocumentStore) => void

export const TEMPLATES: TemplateMetadata[] = [
  { id: 'dashboard', name: 'SaaS Dashboard', description: 'Analytics dashboard with stats, table, and team', category: 'dashboard' },
]

export const TEMPLATE_BUILDERS: Record<string, TemplateBuilder> = {
  dashboard: buildDashboard,
}
```

- [ ] **Step 3: DocumentStore에 loadTemplate() 추가 + initDemo() 대체**

`packages/editor-core/src/stores/DocumentStore.ts`:

import 추가:
```ts
import { TEMPLATE_BUILDERS } from "../presets/templates"
```

새 메서드 추가 (toSerializable() 근처, ~1000행):
```ts
loadTemplate(templateId: string) {
  const builder = TEMPLATE_BUILDERS[templateId]
  if (!builder) return
  this.elements.clear()
  this.initRoot()
  builder(this)
}
```

constructor에서 `this.initDemo()` → `this.loadTemplate('dashboard')` 로 변경.

기존 `private initDemo()` 메서드 전체 삭제 (47행~320행).

- [ ] **Step 4: index.ts에 templates export 추가**

`packages/editor-core/src/index.ts`에 추가:
```ts
export * from "./presets/templates"
```

- [ ] **Step 5: 빌드 + 수동 확인**

Run: `pnpm --filter @devom/editor-core build`
Run: `pnpm dev` → 브라우저에서 기존 Dashboard가 동일하게 렌더되는지 확인

- [ ] **Step 6: Commit**

```
refactor(editor-core): extract initDemo into template system with loadTemplate
```

---

### Task 3: Login Form 템플릿

**Files:**
- Create: `packages/editor-core/src/presets/templates/loginForm.ts`
- Modify: `packages/editor-core/src/presets/templates/index.ts`

- [ ] **Step 1: loginForm.ts 생성**

dashboard.ts와 동일한 패턴으로 `buildLoginForm(store)` 함수 작성.

구조 (Page width: 760, 단일 flex column):
- Page → flex column, 전체를 center 정렬
- Login Card (div) → flex column, card 스타일, maxWidth: 400, 중앙 정렬
  - Title text: "Sign in to your account" (fontSize: 24, fontWeight: 700)
  - Subtitle text: "Enter your email below to login" (fontSize: 14, color: #64748b)
  - sc:label + sc:input (Email)
  - sc:label + sc:input (Password, type: password)
  - Row: sc:checkbox ("Remember me") + text ("Forgot password?")
  - sc:button ("Sign in", variant: default, 전체 너비)
  - sc:separator
  - text ("Or continue with", fontSize: 12, color: #94a3b8, textAlign: center)
  - Row: sc:button ("Google", variant: outline) + sc:button ("GitHub", variant: outline)
  - text ("Don't have an account? Sign up", fontSize: 13)

- [ ] **Step 2: index.ts에 등록**

TEMPLATES 배열에 추가:
```ts
{ id: 'login-form', name: 'Login Form', description: 'Authentication form with social login', category: 'form' },
```

TEMPLATE_BUILDERS에 추가:
```ts
import { buildLoginForm } from "./loginForm"
// ...
'login-form': buildLoginForm,
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm --filter @devom/editor-core build`

- [ ] **Step 4: Commit**

```
feat(editor-core): add login form template
```

---

### Task 4: Pricing Page 템플릿

**Files:**
- Create: `packages/editor-core/src/presets/templates/pricingPage.ts`
- Modify: `packages/editor-core/src/presets/templates/index.ts`

- [ ] **Step 1: pricingPage.ts 생성**

`buildPricingPage(store)` 함수. 구조 (Page width: 760):
- Header: row, Logo text + nav texts (Features, Pricing, About)
- Hero: column center, "Simple, transparent pricing" (h1) + subtitle
- Cards Row: 3개 flex column 카드
  - Starter ($9/mo): Badge("Starter"), price text, 4줄 feature text, Button(outline)
  - Pro ($29/mo): Badge("Popular", variant: default), price text, 6줄 feature text, Button(default) — 이 카드에 border: 2px solid #6366f1
  - Enterprise ($99/mo): Badge("Enterprise"), price text, 8줄 feature text, Button(outline)
- Footer: row, copyright + links

- [ ] **Step 2: index.ts에 등록**

```ts
{ id: 'pricing', name: 'Pricing Page', description: 'Three-tier pricing with feature comparison', category: 'marketing' },
```

- [ ] **Step 3: 빌드 + Commit**

```
feat(editor-core): add pricing page template
```

---

### Task 5: Settings Page 템플릿

**Files:**
- Create: `packages/editor-core/src/presets/templates/settingsPage.ts`
- Modify: `packages/editor-core/src/presets/templates/index.ts`

- [ ] **Step 1: settingsPage.ts 생성**

`buildSettingsPage(store)` 함수. 구조 (Page width: 760):
- Header: "Settings" (h1) + "Manage your account settings" subtitle
- sc:tabs (Profile, Notifications, Appearance)
- Profile 섹션 (flex column):
  - Row: sc:avatar (fallback: "JD") + sc:button ("Change avatar", variant: outline)
  - sc:separator
  - Form rows (각각 label + input): Name, Email
  - sc:label + sc:textarea (Bio)
  - sc:separator
  - Row: sc:button ("Cancel", variant: outline) + sc:button ("Save changes")
- Notifications 섹션 (flex column):
  - 4개 Switch rows: "Email notifications", "Push notifications", "Weekly digest", "Marketing emails"

- [ ] **Step 2: index.ts에 등록**

```ts
{ id: 'settings', name: 'Settings Page', description: 'Account settings with tabs, forms and switches', category: 'form' },
```

- [ ] **Step 3: 빌드 + Commit**

```
feat(editor-core): add settings page template
```

---

### Task 6: TemplatePicker 드롭다운 + Shell 통합

**Files:**
- Modify: `apps/editor-shell/src/components/Toolbar.tsx`
- Modify: `apps/editor-shell/src/App.tsx`

- [ ] **Step 1: Toolbar에 Templates 드롭다운 추가**

`Toolbar.tsx`에:

1. Props에 추가:
```ts
onLoadTemplate?: (templateId: string) => void
```

2. State 추가:
```ts
const [showTemplates, setShowTemplates] = useState(false)
const templatesDropRef = useRef<HTMLDivElement>(null)
```

3. useEffect 추가 (showSections와 동일 패턴으로 외부 클릭 닫기)

4. Sections 드롭다운 뒤에 Templates 드롭다운 JSX 추가:

```tsx
<div ref={templatesDropRef} style={{ position: "relative" }}>
  <ToolBtn
    icon={<span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600 }}>Templates <ChevronDown size={10} /></span>}
    title="Load Template"
    onClick={() => setShowTemplates(v => !v)}
    active={showTemplates}
  />
  {showTemplates && (
    <div style={{
      position: "absolute", top: "100%", left: 0, marginTop: 4,
      background: "#fff", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      border: "1px solid #e2e8f0", padding: 4, zIndex: 200, minWidth: 200,
    }}>
      {TEMPLATES.map(t => (
        <button
          key={t.id}
          onClick={() => {
            if (confirm('Replace current document with template?')) {
              onLoadTemplate?.(t.id)
            }
            setShowTemplates(false)
          }}
          style={{
            display: "block", width: "100%", textAlign: "left", padding: "6px 10px",
            fontSize: 12, border: "none", background: "none", cursor: "pointer", borderRadius: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <div style={{ fontWeight: 500 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{t.description}</div>
        </button>
      ))}
    </div>
  )}
</div>
```

5. import 추가:
```ts
import { TEMPLATES } from "@devom/editor-core"
```

- [ ] **Step 2: Shell App.tsx에 handleLoadTemplate 추가**

```ts
const handleLoadTemplate = useCallback((templateId: string) => {
  historyStore.pushSnapshot()
  documentStore.loadTemplate(templateId)
  bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })
}, [documentStore, historyStore, bridge])
```

Toolbar에 prop 전달:
```tsx
<Toolbar ... onLoadTemplate={handleLoadTemplate} />
```

- [ ] **Step 3: 빌드 + 수동 테스트**

Run: `pnpm dev`
- Templates 드롭다운 클릭 → 4개 템플릿 표시
- 각 템플릿 클릭 → confirm 다이얼로그 → 문서 교체
- Cmd+Z → 이전 문서 복원

- [ ] **Step 4: Commit**

```
feat(editor-shell): add template picker dropdown to toolbar
```

---

## Chunk 2: JSX Importer Core

### Task 7: @babel/parser 의존성 추가

**Files:**
- Modify: `packages/editor-core/package.json`

- [ ] **Step 1: 의존성 설치**

Run: `pnpm --filter @devom/editor-core add @babel/parser`

- [ ] **Step 2: 빌드 확인**

Run: `pnpm --filter @devom/editor-core build`

- [ ] **Step 3: Commit**

```
chore(editor-core): add @babel/parser dependency for JSX importer
```

---

### Task 8: Component Map

**Files:**
- Create: `packages/editor-core/src/import/componentMap.ts`

- [ ] **Step 1: componentMap.ts 생성**

스펙의 JSX_TO_EDITOR 매핑 테이블 그대로 구현. 타입:

```ts
import type { CSSProperties } from "react"
import type { ElementType } from "../types"

export interface ComponentMapping {
  type: ElementType
  defaultStyle?: Partial<CSSProperties>
  defaultProps?: Record<string, unknown>
}

export const JSX_TO_EDITOR: Record<string, ComponentMapping> = {
  // 스펙의 전체 매핑 테이블 (shadcn atomic, composite wrappers, HTML elements)
}

export function getComponentMapping(tagName: string): ComponentMapping {
  return JSX_TO_EDITOR[tagName] ?? { type: 'div' }
}

export function isUnknownComponent(tagName: string): boolean {
  return !(tagName in JSX_TO_EDITOR)
}
```

- [ ] **Step 2: Commit**

```
feat(editor-core): add JSX-to-editor component mapping
```

---

### Task 9: Tailwind Map

**Files:**
- Create: `packages/editor-core/src/import/tailwindMap.ts`

- [ ] **Step 1: tailwindMap.ts 생성**

```ts
import type { CSSProperties } from "react"
import type { SizingProps } from "../types"

export interface TailwindResult {
  style: Partial<CSSProperties>
  layout: {
    layoutMode?: 'flex' | 'grid'
    direction?: 'row' | 'column'
    gap?: number
    alignItems?: string
    justifyContent?: string
    sizing?: Partial<SizingProps>
    padding?: { top: number; right: number; bottom: number; left: number }
  }
}

const SPACING: Record<string, number> = {
  '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10,
  '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28,
  '8': 32, '9': 36, '10': 40, '11': 44, '12': 48,
  '14': 56, '16': 64, '20': 80, '24': 96,
}

export function parseTailwindClasses(className: string): TailwindResult {
  const style: Partial<CSSProperties> = {}
  const layout: TailwindResult['layout'] = {}
  const padding = { top: 0, right: 0, bottom: 0, left: 0 }
  let hasPadding = false

  const classes = className.split(/\s+/).filter(Boolean)

  for (const cls of classes) {
    // 반응형/상태 접두사 제거
    if (cls.includes(':')) continue

    // Layout
    if (cls === 'flex') { layout.layoutMode = 'flex'; continue }
    if (cls === 'flex-col') { layout.direction = 'column'; continue }
    if (cls === 'flex-row') { layout.direction = 'row'; continue }
    if (cls === 'grid') { layout.layoutMode = 'grid'; continue }
    if (cls === 'items-center') { layout.alignItems = 'center'; continue }
    if (cls === 'items-start') { layout.alignItems = 'start'; continue }
    if (cls === 'items-end') { layout.alignItems = 'end'; continue }
    if (cls === 'items-stretch') { layout.alignItems = 'stretch'; continue }
    if (cls === 'justify-center') { layout.justifyContent = 'center'; continue }
    if (cls === 'justify-between') { layout.justifyContent = 'space-between'; continue }
    if (cls === 'justify-start') { layout.justifyContent = 'start'; continue }
    if (cls === 'justify-end') { layout.justifyContent = 'end'; continue }

    // Gap
    const gapMatch = cls.match(/^gap-(.+)$/)
    if (gapMatch && SPACING[gapMatch[1]] !== undefined) {
      layout.gap = SPACING[gapMatch[1]]; continue
    }

    // Padding
    const pMatch = cls.match(/^p-(.+)$/)
    if (pMatch && SPACING[pMatch[1]] !== undefined) {
      const v = SPACING[pMatch[1]]
      padding.top = v; padding.right = v; padding.bottom = v; padding.left = v
      hasPadding = true; continue
    }
    const pxMatch = cls.match(/^px-(.+)$/)
    if (pxMatch && SPACING[pxMatch[1]] !== undefined) {
      padding.left = SPACING[pxMatch[1]]; padding.right = SPACING[pxMatch[1]]
      hasPadding = true; continue
    }
    const pyMatch = cls.match(/^py-(.+)$/)
    if (pyMatch && SPACING[pyMatch[1]] !== undefined) {
      padding.top = SPACING[pyMatch[1]]; padding.bottom = SPACING[pyMatch[1]]
      hasPadding = true; continue
    }
    // pt/pr/pb/pl
    const dirPadMatch = cls.match(/^p([trbl])-(.+)$/)
    if (dirPadMatch && SPACING[dirPadMatch[2]] !== undefined) {
      const v = SPACING[dirPadMatch[2]]
      if (dirPadMatch[1] === 't') padding.top = v
      if (dirPadMatch[1] === 'r') padding.right = v
      if (dirPadMatch[1] === 'b') padding.bottom = v
      if (dirPadMatch[1] === 'l') padding.left = v
      hasPadding = true; continue
    }

    // Sizing
    if (cls === 'w-full') { layout.sizing = { ...layout.sizing, w: 'fill' }; continue }

    // Typography
    if (cls === 'text-xs') { style.fontSize = 12; continue }
    if (cls === 'text-sm') { style.fontSize = 14; continue }
    if (cls === 'text-base') { style.fontSize = 16; continue }
    if (cls === 'text-lg') { style.fontSize = 18; continue }
    if (cls === 'text-xl') { style.fontSize = 20; continue }
    if (cls === 'text-2xl') { style.fontSize = 24; continue }
    if (cls === 'text-3xl') { style.fontSize = 30; continue }
    if (cls === 'text-4xl') { style.fontSize = 36; continue }
    if (cls === 'font-bold') { style.fontWeight = 700; continue }
    if (cls === 'font-semibold') { style.fontWeight = 600; continue }
    if (cls === 'font-medium') { style.fontWeight = 500; continue }
    if (cls === 'text-center') { style.textAlign = 'center'; continue }
    if (cls === 'text-left') { style.textAlign = 'left'; continue }
    if (cls === 'text-right') { style.textAlign = 'right'; continue }

    // Colors (slate/gray palette)
    // 전체 색상 테이블은 구현 시 SLATE_COLORS, GRAY_COLORS 맵으로
    if (cls === 'bg-white') { style.backgroundColor = '#ffffff'; continue }
    if (cls === 'bg-black') { style.backgroundColor = '#000000'; continue }
    if (cls.startsWith('bg-slate-') || cls.startsWith('bg-gray-')) {
      const color = resolveColor(cls); if (color) { style.backgroundColor = color; continue }
    }
    if (cls.startsWith('text-slate-') || cls.startsWith('text-gray-')) {
      const color = resolveColor(cls); if (color) { style.color = color; continue }
    }

    // Borders
    if (cls === 'border') { style.border = '1px solid #e2e8f0'; continue }
    if (cls === 'rounded') { style.borderRadius = 4; continue }
    if (cls === 'rounded-md') { style.borderRadius = 6; continue }
    if (cls === 'rounded-lg') { style.borderRadius = 8; continue }
    if (cls === 'rounded-xl') { style.borderRadius = 12; continue }
    if (cls === 'rounded-2xl') { style.borderRadius = 16; continue }
    if (cls === 'rounded-full') { style.borderRadius = 9999; continue }
    if (cls === 'shadow-sm') { style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; continue }
    if (cls === 'shadow') { style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; continue }
    if (cls === 'shadow-md') { style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; continue }
    if (cls === 'shadow-lg') { style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'; continue }
  }

  if (hasPadding) layout.padding = padding

  return { style, layout }
}
```

`resolveColor()` 헬퍼: slate/gray 50~950 색상 hex 맵 (Tailwind 기본 팔레트).

- [ ] **Step 2: Commit**

```
feat(editor-core): add Tailwind class to style converter
```

---

### Task 10: JSX Importer 메인 파서

**Files:**
- Create: `packages/editor-core/src/import/jsxImporter.ts`
- Create: `packages/editor-core/src/import/index.ts`

- [ ] **Step 1: jsxImporter.ts 생성**

```ts
import { parse } from '@babel/parser'
import type { Node, JSXElement, JSXFragment, JSXText, JSXExpressionContainer } from '@babel/types'
import { getComponentMapping, isUnknownComponent } from './componentMap'
import { parseTailwindClasses } from './tailwindMap'
import { DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING } from '../types'
import type { ElementTemplate } from '../types'

const MAX_INPUT_SIZE = 50 * 1024 // 50KB

export interface ImportResult {
  elements: ElementTemplate[]
  warnings: string[]
}

export function importJSX(code: string): ImportResult {
  const warnings: string[] = []

  if (code.length > MAX_INPUT_SIZE) {
    return { elements: [], warnings: ['Input exceeds 50KB limit'] }
  }

  let ast
  try {
    ast = parse(code, {
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
      errorRecovery: true,
    })
  } catch (e) {
    return { elements: [], warnings: [`Parse error: ${(e as Error).message}`] }
  }

  const jsxRoot = findJSXRoot(ast)
  if (!jsxRoot) {
    return { elements: [], warnings: ['No JSX found in the provided code'] }
  }

  const elements = walkNode(jsxRoot, warnings)
  return { elements, warnings }
}
```

주요 함수:
- `findJSXRoot(ast)`: ReturnStatement 내부 JSX 또는 최상위 JSX를 찾음
- `walkNode(node, warnings)`: JSXElement/Fragment/Text/Expression 분기 처리
- `walkJSXElement(node, warnings)`: 태그명 추출 → componentMap → props/className 추출 → ElementTemplate 생성 → children 재귀
- `extractTextContent(children)`: JSXText + JSXExpressionContainer에서 텍스트 추출
- `extractProps(attributes, tagName)`: JSX 속성 → editor props + style

조건부/map 처리:
- `ConditionalExpression` → consequent만 walkNode
- `LogicalExpression &&` → right만 walkNode
- `CallExpression .map()` → callback의 return JSX만 walkNode (1회)

- [ ] **Step 2: import/index.ts 생성**

```ts
export { importJSX, type ImportResult } from './jsxImporter'
export { JSX_TO_EDITOR, getComponentMapping } from './componentMap'
export { parseTailwindClasses, type TailwindResult } from './tailwindMap'
```

- [ ] **Step 3: packages/editor-core/src/index.ts에 추가**

```ts
export * from "./import"
```

- [ ] **Step 4: 빌드 확인**

Run: `pnpm --filter @devom/editor-core build`

- [ ] **Step 5: Commit**

```
feat(editor-core): add JSX importer with babel parser
```

---

### Task 11: DocumentStore.importElements() 메서드

**Files:**
- Modify: `packages/editor-core/src/stores/DocumentStore.ts`

- [ ] **Step 1: importElements + insertElementTree 추가**

DocumentStore에 두 메서드 추가 (loadTemplate 근처):

```ts
importElements(templates: ElementTemplate[], targetParentId?: string): string[] {
  const parentId = targetParentId ?? this.rootId
  const parent = this.elements.get(parentId)
  if (!parent) return []

  const createdIds: string[] = []
  for (const template of templates) {
    const id = this.insertElementTree(template, parentId)
    if (id) createdIds.push(id)
  }
  return createdIds
}

private insertElementTree(template: ElementTemplate, parentId: string): string {
  const id = nanoid()
  const { children: childTemplates, ...rest } = template
  const element: EditorElement = { ...rest, id, parentId, children: [] }
  this.elements.set(id, element)

  const parent = this.elements.get(parentId)
  if (parent) parent.children.push(id)

  for (const childTemplate of childTemplates) {
    this.insertElementTree(childTemplate, id)
  }
  return id
}
```

import 추가:
```ts
import type { ElementTemplate } from "../types"
```

- [ ] **Step 2: 빌드 + Commit**

```
feat(editor-core): add importElements method for JSX import
```

---

## Chunk 3: JSX Import UI

### Task 12: ImportJSXModal 컴포넌트

**Files:**
- Create: `apps/editor-shell/src/components/ImportJSXModal.tsx`

- [ ] **Step 1: ImportJSXModal.tsx 생성**

```tsx
import { useState } from "react"
import { T } from "../theme"

interface ImportJSXModalProps {
  onImport: (code: string, mode: 'replace' | 'add') => void
  onClose: () => void
  warnings?: string[]
}

export function ImportJSXModal({ onImport, onClose, warnings }: ImportJSXModalProps) {
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'replace' | 'add'>('add')

  return (
    // backdrop 오버레이
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 520, maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Import JSX</h3>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste shadcn/ui JSX code here..."
          style={{ width: '100%', height: 200, marginTop: 12, padding: 12, fontFamily: 'monospace', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
            <input type="radio" name="mode" checked={mode === 'add'} onChange={() => setMode('add')} /> Add to current
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
            <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace document
          </label>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
          Only structure and styling are imported. Event handlers, hooks, conditional rendering, and .map() loops will be simplified.
        </div>
        {warnings && warnings.length > 0 && (
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
            {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '6px 16px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => onImport(code, mode)}
            disabled={!code.trim()}
            style={{ padding: '6px 16px', fontSize: 13, border: 'none', borderRadius: 6, background: '#3b82f6', color: '#fff', cursor: code.trim() ? 'pointer' : 'default', opacity: code.trim() ? 1 : 0.5 }}
          >Import</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```
feat(editor-shell): add ImportJSXModal component
```

---

### Task 13: Shell 통합 — Import 버튼 + 핸들러

**Files:**
- Modify: `apps/editor-shell/src/components/Toolbar.tsx`
- Modify: `apps/editor-shell/src/App.tsx`

- [ ] **Step 1: Toolbar에 Import 버튼 추가**

Toolbar props에 추가:
```ts
onImportJSX?: () => void
```

Export 버튼 옆에 Import 버튼 추가 (lucide-react의 `FileDown` 또는 `Import` 아이콘):
```tsx
import { ..., FileDown } from "lucide-react"
// ...
<ToolBtn icon={<FileDown size={S} />} title="Import JSX" onClick={() => onImportJSX?.()} />
```

- [ ] **Step 2: Shell App.tsx에 Import 핸들링 추가**

```tsx
import { importJSX } from "@devom/editor-core"
import { ImportJSXModal } from "./components/ImportJSXModal"

// state
const [showImportModal, setShowImportModal] = useState(false)
const [importWarnings, setImportWarnings] = useState<string[]>([])

// handler
const handleImportJSX = useCallback((code: string, mode: 'replace' | 'add') => {
  const result = importJSX(code)

  if (result.warnings.length > 0 && result.elements.length === 0) {
    setImportWarnings(result.warnings)
    return // 파싱 실패 — 모달 유지, 경고 표시
  }

  historyStore.pushSnapshot()

  if (mode === 'replace') {
    documentStore.elements.clear()
    documentStore.initRoot()  // private이므로 loadFromSerializable 패턴 사용 가능
  }

  documentStore.importElements(result.elements)
  bridge.send({ type: "SYNC_DOCUMENT", payload: documentStore.toSerializable() })

  setImportWarnings(result.warnings) // 부분 성공 시 경고 표시
  if (result.elements.length > 0) {
    setShowImportModal(false)
    setImportWarnings([])
  }
}, [documentStore, historyStore, bridge])
```

주의: `initRoot()`이 private이면 `loadFromSerializable`로 빈 문서를 만드는 방식 사용. 또는 `loadTemplate` + empty template 패턴.

Replace 모드 대안:
```ts
if (mode === 'replace') {
  // 빈 root만 있는 상태로 리셋
  const emptyDoc = { elements: {}, rootId: '' }
  documentStore.loadFromSerializable(emptyDoc)
  // loadFromSerializable 후 root 없음 → importElements가 root 생성 필요
}
```

더 간단한 접근: `loadTemplate` 없이 직접:
```ts
if (mode === 'replace') {
  documentStore.elements.clear()
  // initRoot는 private → DocumentStore에 public resetDocument() 추가
  documentStore.resetDocument()
}
documentStore.importElements(result.elements)
```

→ **DocumentStore에 `resetDocument()` public 메서드 추가 필요:**
```ts
resetDocument() {
  this.elements.clear()
  this.initRoot()
}
```

Toolbar에 prop 전달:
```tsx
<Toolbar ... onImportJSX={() => setShowImportModal(true)} />
```

모달 렌더:
```tsx
{showImportModal && (
  <ImportJSXModal
    onImport={handleImportJSX}
    onClose={() => { setShowImportModal(false); setImportWarnings([]) }}
    warnings={importWarnings}
  />
)}
```

- [ ] **Step 3: 빌드 + 수동 테스트**

Run: `pnpm dev`

테스트 코드:
```jsx
<div className="flex flex-col gap-4 p-6">
  <h1 className="text-2xl font-bold">Hello</h1>
  <p className="text-sm text-slate-500">Description</p>
  <Button variant="outline">Click me</Button>
</div>
```

Expected: div(flex column, gap 16, padding 24) > text("Hello", 24px bold) + text("Description", 14px) + sc:button("Click me", outline)

- [ ] **Step 4: Commit**

```
feat(editor-shell): integrate JSX importer with import modal and toolbar
```

---

### Task 14: 최종 통합 + editor-core index export 확인

**Files:**
- Modify: `packages/editor-core/src/index.ts` (필요 시)
- Modify: `packages/editor-core/src/stores/DocumentStore.ts` (resetDocument 추가)

- [ ] **Step 1: resetDocument() public 메서드 추가**

```ts
resetDocument() {
  this.elements.clear()
  this.initRoot()
}
```

- [ ] **Step 2: 전체 빌드 + 수동 테스트**

Run: `pnpm build:packages && pnpm dev`

테스트 시나리오:
1. Templates 드롭다운 → Dashboard / Login / Pricing / Settings 각각 로드
2. Cmd+Z로 이전 문서 복원
3. Import JSX → 간단한 JSX 붙여넣기 → Add to current
4. Import JSX → Replace document 모드
5. 잘못된 JSX 붙여넣기 → 에러 경고 표시

- [ ] **Step 3: Commit**

```
feat(editor): complete template system and JSX importer integration
```
