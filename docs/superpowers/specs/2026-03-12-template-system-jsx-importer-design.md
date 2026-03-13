# Template System + JSX Importer Design

## Overview

에디터에 템플릿 시스템과 JSX 임포터를 추가하여:
1. 빌트인 템플릿으로 다양한 shadcn/ui UI 예시를 즉시 로드
2. 외부 shadcn/ui JSX 코드를 붙여넣어 에디터 요소 트리로 변환

## Motivation

현재 에디터는 SaaS Dashboard 데모 하나만 제공. shadcn/ui 20개 컴포넌트를 지원하지만 다양한 UI 패턴을 체험할 방법이 없음. 템플릿 시스템으로 빌트인 예시를 제공하고, JSX 임포터로 외부 shadcn 프로젝트 코드를 가져올 수 있게 함.

## Existing Infrastructure

이미 구현된 것들:
- `DocumentStore.toSerializable()` — 전체 문서를 JSON으로 직렬화
- `DocumentStore.loadFromSerializable(data)` — JSON에서 문서 복원 (elements.clear() + 재구성)
- `exportToJSX()` — element tree → JSX 코드 (역방향 매핑의 청사진)
- `exportToJSON()` — element tree → JSON
- `sectionPresets.ts` — 섹션 프리셋 팩토리 패턴 (ID 없는 템플릿 → ID 할당 후 삽입)
- `initDemo()` — 320줄 하드코딩된 대시보드 데모

## Part 1: Template System

### Data Structure

```ts
// packages/editor-core/src/presets/templates/index.ts
interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: 'dashboard' | 'form' | 'marketing' | 'content'
}

// 각 템플릿은 DocumentStore를 받아 요소를 생성하는 빌더 함수
// (기존 initDemo() 패턴: store.addElement() 직접 호출)
type TemplateBuilder = (store: DocumentStore) => void
```

### Storage

각 템플릿을 TypeScript 빌더 함수로 구현 (현재 `initDemo()` 패턴 유지):

```
packages/editor-core/src/presets/templates/
  dashboard.ts        ← 현재 initDemo() 코드 추출
  loginForm.ts        ← 새로 추가
  pricingPage.ts      ← 새로 추가
  settingsPage.ts     ← 새로 추가
  index.ts            ← TemplateMetadata[] + builder map 내보내기
```

JSON 파일이 아닌 TypeScript 빌더를 사용하는 이유:
- 타입 안전성, IDE 자동완성
- 기존 `initDemo()` 패턴과 일관성
- `add()` 헬퍼 함수 재사용 가능

### DocumentStore Changes

```ts
// 새 메서드
loadTemplate(templateId: string): void {
  const builder = TEMPLATE_BUILDERS[templateId]
  if (!builder) return
  this.elements.clear()
  this.initRoot()
  builder(this)
}
```

`initDemo()`는 `loadTemplate('dashboard')` 호출로 대체.

### Shell UI: TemplatePicker

Toolbar에 "Templates" 드롭다운 추가 (기존 UI/Sections 드롭다운과 동일 패턴):

```
[Frame] [Text] [Image] [UI ▾] [Sections ▾] [Templates ▾] [Import] [Export] ...
```

카테고리별 그룹핑:
- Dashboard: SaaS Dashboard
- Form: Login Form, Settings
- Marketing: Pricing Page

선택 시 흐름:
1. **확인 다이얼로그** 표시: "현재 문서를 새 템플릿으로 교체합니다. 계속하시겠습니까?"
2. Shell: `historyStore.pushSnapshot()` → `documentStore.loadTemplate(id)` → `bridge.send(SYNC_DOCUMENT)`
3. Canvas: `loadFromSerializable(data)` → 리렌더

`historyStore.pushSnapshot()`을 먼저 호출하므로 Cmd+Z로 이전 문서 복원 가능.

### Built-in Templates (4개)

#### 1. dashboard (현재 initDemo 추출)
- Header (Logo, Search, Buttons, Avatar)
- Tabs Navigation
- Stats Row (4 metric cards: Badge, Progress)
- Content Row (Table + Activity list)
- Alert Row
- Footer

#### 2. loginForm
- 중앙 정렬 카드
- Logo/Title
- Email Input + Label
- Password Input + Label
- "Remember me" Checkbox
- Login Button
- Separator ("or")
- Social login buttons (outline)
- "Sign up" 링크 텍스트

#### 3. pricingPage
- Header (Logo, Nav links)
- Hero 섹션 (Title, Subtitle, Toggle annual/monthly)
- 3-column 가격 카드:
  - 각 카드: Plan name (Badge), Price (text), Feature list (text), CTA Button
  - 중간 카드: "Popular" Badge, primary Button
- Footer

#### 4. settingsPage
- Header (Title, Subtitle)
- Tabs (Profile, Notifications, Appearance)
- Profile 탭 내용:
  - Avatar + "Change" Button
  - Name Input + Label
  - Email Input + Label
  - Bio Textarea + Label
  - Save Button
- Notification 탭:
  - Switch + Label 여러 행
- Separator, secondary text

## Part 2: JSX Importer

### Goal

shadcn/ui JSX 코드 스니펫을 붙여넣으면 에디터 요소 트리로 변환.
100% 재현이 아닌 "80% 구조 임포트 → 에디터에서 조정" 접근.

JSX import는 lossy 변환이며 export와의 round-trip을 보장하지 않음. 무손실 직렬화는 JSON export/import(toSerializable/loadFromSerializable) 사용.

### Element Template Type

JSX 임포터와 `importElements()` 메서드에서 사용하는 중간 표현:

```ts
// packages/editor-core/src/types.ts
type ElementTemplate = Omit<EditorElement, 'id' | 'parentId' | 'children'> & {
  children: ElementTemplate[]  // 중첩 가능 (ID 없는 트리)
}
```

`EditorElement.children`은 `string[]` (ID 배열)이지만, `ElementTemplate.children`은 `ElementTemplate[]` (중첩 객체). ID 할당과 평탄화는 `importElements()` 에서 수행.

### Component Mapping

```ts
// packages/editor-core/src/import/componentMap.ts
const JSX_TO_EDITOR: Record<string, {
  type: ElementType
  defaultStyle?: Partial<CSSProperties>
  defaultProps?: Record<string, unknown>
}> = {
  // shadcn/ui atomic components → editor types (1:1 매핑)
  'Button':      { type: 'sc:button' },
  'Input':       { type: 'sc:input' },
  'Badge':       { type: 'sc:badge' },
  'Checkbox':    { type: 'sc:checkbox' },
  'Switch':      { type: 'sc:switch' },
  'Label':       { type: 'sc:label' },
  'Textarea':    { type: 'sc:textarea' },
  'Avatar':      { type: 'sc:avatar' },
  'Separator':   { type: 'sc:separator' },
  'Progress':    { type: 'sc:progress' },
  'Skeleton':    { type: 'sc:skeleton' },
  'Slider':      { type: 'sc:slider' },
  'Tabs':        { type: 'sc:tabs' },
  'Alert':       { type: 'sc:alert' },
  'Toggle':      { type: 'sc:toggle' },
  'Select':      { type: 'sc:select' },
  'Table':       { type: 'sc:table' },
  'Accordion':   { type: 'sc:accordion' },
  'RadioGroup':  { type: 'sc:radio-group' },

  // shadcn composite wrapper components → div containers
  // Card, Alert 등의 서브컴포넌트는 div/text로 분해하여 구조 유지
  'Card':            { type: 'div', defaultStyle: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 } },
  'CardHeader':      { type: 'div' },
  'CardContent':     { type: 'div' },
  'CardFooter':      { type: 'div' },
  'CardTitle':       { type: 'text', defaultStyle: { fontSize: 18, fontWeight: 600 } },
  'CardDescription': { type: 'text', defaultStyle: { fontSize: 14, color: '#64748b' } },
  'AlertTitle':      { type: 'text', defaultStyle: { fontSize: 16, fontWeight: 600 } },
  'AlertDescription':{ type: 'text', defaultStyle: { fontSize: 14, color: '#64748b' } },

  // HTML elements
  'div':       { type: 'div' },
  'section':   { type: 'div' },
  'main':      { type: 'div' },
  'header':    { type: 'div' },
  'footer':    { type: 'div' },
  'nav':       { type: 'div' },
  'aside':     { type: 'div' },
  'article':   { type: 'div' },
  'form':      { type: 'div' },
  'span':      { type: 'text' },
  'p':         { type: 'text' },
  'h1':        { type: 'text', defaultStyle: { fontSize: 36, fontWeight: 700 } },
  'h2':        { type: 'text', defaultStyle: { fontSize: 30, fontWeight: 600 } },
  'h3':        { type: 'text', defaultStyle: { fontSize: 24, fontWeight: 600 } },
  'h4':        { type: 'text', defaultStyle: { fontSize: 20, fontWeight: 600 } },
  'h5':        { type: 'text', defaultStyle: { fontSize: 18, fontWeight: 600 } },
  'h6':        { type: 'text', defaultStyle: { fontSize: 16, fontWeight: 600 } },
  'img':       { type: 'image' },
}
```

**Composite component 전략**: Card, Alert 등의 서브컴포넌트(CardHeader, CardTitle 등)는 각각 독립적인 div/text 요소로 변환. 에디터의 요소 트리가 평면적 구조이므로 JSX의 중첩 구조를 그대로 유지하되, 각 서브컴포넌트를 에디터 기본 타입으로 매핑. `sc:card` 타입(title/description props를 사용하는 단일 요소)은 이 context에서 사용하지 않음 — 외부 JSX는 일반적으로 Card > CardHeader > CardTitle 중첩 구조를 사용하므로 이를 div > div > text 구조로 보존하는 것이 원본에 더 가까움.

**매핑에 없는 컴포넌트**: `div`로 fallback 처리하고 `warnings`에 "Unknown component: <ComponentName>" 추가.

### Tailwind → Style Conversion

핵심 유틸리티 클래스만 변환 (전체 Tailwind가 아닌 ~80개):

```ts
// packages/editor-core/src/import/tailwindMap.ts

// 두 가지 출력: CSSProperties 스타일 + layout 힌트
interface TailwindResult {
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
```

**Tailwind spacing scale** (1 unit = 4px):
```ts
const SPACING: Record<string, number> = {
  '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10,
  '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28,
  '8': 32, '9': 36, '10': 40, '11': 44, '12': 48,
  '14': 56, '16': 64, '20': 80, '24': 96,
}
```

**변환 결과 → EditorElement 머지 방법:**

```ts
const tw = parseTailwindClasses(className)
const element: ElementTemplate = {
  type: mappedType,
  name: generateName(tagName),
  style: {
    position: 'relative',
    ...mapping.defaultStyle,
    ...tw.style,        // backgroundColor, fontSize 등
  },
  props: extractedProps,
  locked: false,
  visible: true,
  // layout 힌트 → 에디터 필드로 매핑
  layoutMode: tw.layout.layoutMode ?? 'none',
  layoutProps: {
    ...DEFAULT_LAYOUT_PROPS,
    direction: tw.layout.direction ?? 'column',
    gap: tw.layout.gap ?? DEFAULT_LAYOUT_PROPS.gap,
    alignItems: tw.layout.alignItems ?? DEFAULT_LAYOUT_PROPS.alignItems,
    justifyContent: tw.layout.justifyContent ?? DEFAULT_LAYOUT_PROPS.justifyContent,
    paddingTop: tw.layout.padding?.top ?? 0,
    paddingRight: tw.layout.padding?.right ?? 0,
    paddingBottom: tw.layout.padding?.bottom ?? 0,
    paddingLeft: tw.layout.padding?.left ?? 0,
  },
  sizing: { ...DEFAULT_SIZING, ...tw.layout.sizing },
  canvasPosition: null,
  children: [],  // walkJSX에서 재귀적으로 채움
}
```

변환 대상 (핵심):
- **Layout**: `flex`, `flex-col`, `flex-row`, `grid`, `grid-cols-*`
- **Spacing**: `p-*`, `px-*`, `py-*`, `pt/pr/pb/pl-*`, `gap-*`
- **Sizing**: `w-full`, `w-auto`, `h-auto`, `max-w-*`
- **Typography**: `text-sm/base/lg/xl/2xl/3xl`, `font-bold/semibold/medium`, `text-center/left/right`
- **Colors**: `bg-white`, `bg-slate-*`, `bg-gray-*`, `text-slate-*`, `text-gray-*` (리터럴 색상만)
- **Borders**: `border`, `border-*`, `rounded-*`, `shadow-*`
- **Display**: `hidden`, `block`, `inline-flex`

변환하지 않는 것:
- 반응형 접두사 (`sm:`, `md:`, `lg:`) → 무시 (strip)
- 상태 접두사 (`hover:`, `focus:`, `active:`) → 무시 (strip)
- 임의값 (`[300px]`) → 무시
- 테마 색상 (`bg-primary`, `bg-muted`) → 무시 (CSS 변수 기반이라 리터럴 값 추출 불가)
- `space-x-*`, `space-y-*` → 무시 (자식에 margin 적용하는 방식이라 gap으로 대체 불가)
- 알 수 없는 클래스 → 무시

### Parsing Pipeline

```ts
// packages/editor-core/src/import/jsxImporter.ts
import { parse } from '@babel/parser'

interface ImportResult {
  elements: ElementTemplate[]  // 중첩 트리
  warnings: string[]           // 변환 못한 항목 경고
}

function importJSX(code: string): ImportResult {
  const warnings: string[] = []

  // 1. Babel로 AST 파싱 (에러 처리)
  let ast
  try {
    ast = parse(code, {
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
      errorRecovery: true,  // 부분 파싱 허용
    })
  } catch (e) {
    return { elements: [], warnings: [`Parse error: ${(e as Error).message}`] }
  }

  // 2. JSX 루트 찾기 (return 문 내부 또는 최상위 JSX)
  const jsxRoot = findJSXRoot(ast)
  if (!jsxRoot) {
    return { elements: [], warnings: ['No JSX found in the provided code'] }
  }

  // 3. AST 재귀 순회 → ElementTemplate[] 생성
  const elements = walkJSXElement(jsxRoot, warnings)

  return { elements, warnings }
}
```

**입력 크기 제한**: 50KB 초과 시 경고 + 파싱 거부 (대형 파일은 UI 블로킹 우려).

**AST 순회 규칙:**
- `JSXElement` → componentMap에서 타입 결정 → ElementTemplate 생성
- `JSXText` → `trim() === ''`이면 무시, 내용 있으면 부모 text 요소의 `content` prop으로
- `JSXExpressionContainer` → `StringLiteral`이면 텍스트, `TemplateLiteral` 이면 raw 텍스트, 그 외 무시
- `JSXFragment` → children을 그대로 상위로 올림 (불필요한 div 래핑 방지)
- 조건부 (`? :`) → consequent(true branch)만 취함
- 논리 AND (`&&`) → right operand만 취함
- `.map()` → callback body의 return JSX만 취함 (1회)
- 함수/훅 선언 → 건너뜀
- import 문 → 건너뜀

**Props 추출:**
- `variant`, `size`, `placeholder`, `label`, `disabled` → 그대로 전달
- `className` → tailwindMap으로 스타일 + 레이아웃 변환
- `style` (인라인 JSX 객체) → CSSProperties로 직접 사용
- `children` (텍스트) → text 타입의 `content` prop 또는 button의 `label` prop
- `src`, `alt` → image 타입의 props
- 이벤트 핸들러 (`onClick` 등) → 무시

### DocumentStore: importElements

```ts
// 새 메서드
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

  // 재귀: 자식 ElementTemplate → EditorElement 변환
  for (const childTemplate of childTemplates) {
    this.insertElementTree(childTemplate, id)
  }

  return id
}
```

### Shell UI: ImportJSXModal

Toolbar에 "Import" 버튼 → 모달:

```
┌─ Import JSX ──────────────────────────────┐
│                                            │
│  Paste shadcn/ui JSX code:                 │
│  ┌──────────────────────────────────────┐  │
│  │ <div className="flex flex-col p-4">  │  │
│  │   <h1>Hello</h1>                     │  │
│  │   <Button variant="outline">Click</Button>│
│  │ </div>                               │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ○ Replace document  ● Add to current      │
│                                            │
│  ⓘ Only structure and styling are imported.│
│    These will be ignored:                  │
│    - onClick, onChange event handlers       │
│    - useState, useEffect hooks             │
│    - Conditional rendering (first branch)  │
│    - .map() loops (first item only)        │
│                                            │
│                    [Cancel]  [Import]       │
└────────────────────────────────────────────┘
```

두 가지 모드:
- **Replace document**: 확인 다이얼로그 → 현재 문서 클리어 후 임포트
- **Add to current**: 현재 선택된 요소의 자식으로 추가 (선택 없으면 root에 추가, 잠긴 요소면 root fallback)

Import 후 warnings가 있으면 모달에 경고 목록 표시.

## Message Protocol

기존 프로토콜로 충분. 새 메시지 타입 불필요:
- Template 로드: Shell에서 `documentStore.loadTemplate()` → `SYNC_DOCUMENT` 전송
- JSX 임포트: Shell에서 `documentStore.importElements()` → `SYNC_DOCUMENT` 전송

## Dependencies

- `@babel/parser` ^7.26 — JSX/TypeScript 파싱 (`packages/editor-core`에 추가)
  - 런타임에 parser만 사용, 다른 babel 패키지 불필요

## File Structure

```
packages/editor-core/src/
  types.ts                ← ElementTemplate 타입 추가
  presets/
    templates/
      dashboard.ts          ← initDemo() 코드 추출
      loginForm.ts
      pricingPage.ts
      settingsPage.ts
      index.ts              ← TemplateMetadata[] + TEMPLATE_BUILDERS
    sectionPresets.ts       ← 기존 유지
  import/
    jsxImporter.ts          ← parse + walkJSX + importJSX()
    componentMap.ts         ← JSX_TO_EDITOR 매핑
    tailwindMap.ts          ← parseTailwindClasses()
    index.ts                ← re-export

apps/editor-shell/src/components/
  TemplatePicker.tsx        ← Templates 드롭다운
  ImportJSXModal.tsx        ← JSX 붙여넣기 모달
```

## Implementation Order

1. **Template system** (Part 1): ElementTemplate 타입, loadTemplate, initDemo 추출, 빌트인 4개, TemplatePicker UI
2. **JSX Importer core** (Part 2): componentMap, tailwindMap, jsxImporter, importElements()
3. **JSX Importer UI** (Part 3): ImportJSXModal 컴포넌트, Shell 통합

## Out of Scope

- Save as Template (사용자 템플릿 저장) → 향후 기능
- 템플릿 썸네일/미리보기 이미지 → 향후 기능
- Tailwind 반응형/상태 클래스 변환
- Tailwind 테마 색상 (bg-primary 등) 변환
- React 훅/로직 변환
- 매핑에 없는 외부 컴포넌트 라이브러리 지원
- Export→Import round-trip 보장 (무손실은 JSON export 사용)
