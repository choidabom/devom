# React DOM 기반 UI 편집기 설계

## 개요

Canvas API 없이 React DOM만으로 UI 컴포넌트를 배치하고 편집하는 디자인 에디터.
토스의 데우스(Deus)에서 영감을 받아 쉘-캔버스 분리 아키텍처를 적용한다.

## 핵심 결정 사항

| 항목        | 결정                               | 근거                                       |
| ----------- | ---------------------------------- | ------------------------------------------ |
| 렌더링      | React DOM (Canvas API 미사용)      | 실제 웹 컴포넌트와 동일한 결과물           |
| 아키텍처    | 쉘-캔버스 cross-origin 분리        | 캔버스 부하가 쉘 UI에 영향 없도록          |
| 상태 관리   | MobX                               | Fine-grained reactivity로 속성 단위 리렌더 |
| 빌드 도구   | Vite (쉘, 캔버스 모두)             | 가볍고 빠른 빌드, SSR 불필요               |
| 드래그      | 네이티브 pointer events            | 외부 라이브러리 없이 세밀한 제어           |
| 스타일링    | inline style (React CSSProperties) | 에디터 특성상 동적 스타일이 핵심           |
| 데이터 구조 | Flat Map + parentId/children       | O(1) 접근, 이동/재배치 용이                |

## 프로젝트 구조

```
apps/
  editor-shell/          # 쉘 (Vite + React, :4000)
  editor-canvas/         # 캔버스 (Vite + React, :4001)
packages/
  editor-core/           # 공유 코어 (MobX 스토어, 타입, 프로토콜)
```

## 아키텍처

### 쉘-캔버스 분리

```
┌─ Shell (localhost:4000) ──────────────────────────┐
│  Toolbar | Layers | Properties                     │
│  ┌─ Canvas iframe (localhost:4001) ──────────────┐ │
│  │ Cross-origin isolated (별도 프로세스)           │ │
│  │ DOM 요소 렌더링 + 드래그/리사이즈              │ │
│  └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
          ↕ MessageChannel (postMessage)
```

브라우저가 다른 탑 레벨 도메인의 iframe을 별도 프로세스로 격리하는 메커니즘을 활용한다.
캔버스에서 무거운 렌더링이 일어나도 쉘의 UI 반응성이 유지된다.

### 통신 프로토콜

```typescript
// editor-core/protocol.ts

// 쉘 → 캔버스
type ShellToCanvas =
  | { type: "ADD_ELEMENT"; payload: ElementDef }
  | { type: "UPDATE_STYLE"; payload: { id: string; style: Partial<CSSProperties> } }
  | { type: "SELECT_ELEMENT"; payload: { id: string } }
  | { type: "DELETE_ELEMENT"; payload: { id: string } }
  | { type: "MOVE_ELEMENT"; payload: { id: string; parentId: string; index: number } }

// 캔버스 → 쉘
type CanvasToShell =
  | { type: "ELEMENT_SELECTED"; payload: { id: string; bounds: DOMRect } }
  | { type: "ELEMENT_MOVED"; payload: { id: string; x: number; y: number } }
  | { type: "ELEMENT_RESIZED"; payload: { id: string; width: number; height: number } }
  | { type: "TREE_UPDATED"; payload: ElementTree }
```

## 데이터 모델

```typescript
type ElementType = "div" | "text" | "image" | "button" | "input" | "flex" | "grid"

interface EditorElement {
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

interface EditorDocument {
  id: string
  name: string
  rootId: string
  elements: Map<string, EditorElement>
  viewport: { width: number; height: number }
}
```

## MobX 스토어

```
DocumentStore      # 문서 트리 (요소 CRUD, source of truth)
SelectionStore     # 선택 상태 (selectedIds, hoveredId)
HistoryStore       # Undo/Redo (스냅샷 스택)
ViewportStore      # 줌, 패닝
ClipboardStore     # 복사/붙여넣기
```

### 스토어 동기화

- 쉘의 DocumentStore가 source of truth
- 캔버스의 DocumentStore는 미러 (postMessage로 동기화)
- 캔버스에서 발생한 이벤트 → 쉘로 전송 → 쉘이 스토어 업데이트 → 캔버스로 반영

## UI 구성

### 쉘

- **Toolbar**: 요소 추가 버튼, undo/redo, export
- **Layers Panel**: 요소 트리 시각화, 드래그로 순서 변경, 가시성/잠금 토글
- **Properties Panel**: 선택된 요소의 레이아웃, 스타일, 고유 속성 편집

### 캔버스

- DOM 기반 요소 렌더링
- 선택 UI (테두리 + 리사이즈 핸들)
- 드래그 & 드롭 이동
- 줌 (Ctrl+스크롤) & 패닝 (Space+드래그)
- 정렬 스냅 가이드

## 내보내기

- **JSON**: EditorDocument 그대로 직렬화
- **React JSX**: 코드 생성
- **HTML**: 정적 HTML 생성

## 기술 스택

### editor-core

- mobx, mobx-react-lite, nanoid, typescript

### editor-shell

- react, react-dom (catalog:react)
- mobx, mobx-react-lite
- @devom/editor-core (workspace:\*)
- @radix-ui/react-\* (속성 패널 UI)
- vite, @vitejs/plugin-react

### editor-canvas

- react, react-dom (catalog:react)
- mobx, mobx-react-lite
- @devom/editor-core (workspace:\*)
- vite, @vitejs/plugin-react

## 개발 환경

```bash
# 코어 빌드 워치 + 쉘/캔버스 dev server 동시 실행
turbo run dev --filter=@devom/editor-shell --filter=@devom/editor-canvas
```

## MVP 기능 범위

1. 요소 배치 (드래그 & 드롭으로 캔버스에 추가)
2. 스타일 편집 (크기, 위치, 색상, 여백, 테두리 등)
3. 계층 구조 (레이어 패널, 부모-자식, 순서 변경)
4. 내보내기 (JSON, JSX, HTML)
5. Undo/Redo
6. 줌 & 패닝
