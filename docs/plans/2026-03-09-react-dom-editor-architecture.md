# React DOM 에디터: 프로젝트 구조와 아키텍처

## 패키지 구성

```
apps/
  editor-shell/     # 에디터 UI (툴바, 레이어, 속성 패널) — port 4000
  editor-canvas/    # 캔버스 렌더러 (iframe 내부) — port 4001
packages/
  editor-core/      # 공유 코어 (타입, 프로토콜, 스토어, 브릿지, 내보내기)
```

Shell이 Canvas를 iframe으로 embed하는 구조다.
두 앱은 `editor-core`를 공유하되, 각각 독립된 MobX 스토어 인스턴스를 갖는다.

## 실행 방법

```bash
pnpm editor          # shell(4000) + canvas(4001) 동시 실행
pnpm editor:build    # core 빌드 후 shell, canvas 빌드
```

## editor-core — 공유 패키지

Vite 라이브러리 모드로 빌드. ESM 단일 번들 + `.d.ts` 생성.

### 파일 구조

```
src/
  index.ts                    # 전체 re-export
  types.ts                    # EditorElement, ElementType, DEFAULT_ELEMENT_STYLE
  protocol.ts                 # 메시지 타입 (ShellToCanvas / CanvasToShell)
  stores/
    index.ts
    DocumentStore.ts           # 문서 상태 (요소 CRUD, 직렬화)
    SelectionStore.ts          # 선택 상태
    HistoryStore.ts            # Undo/Redo (스냅샷 기반)
    ViewportStore.ts           # 줌/팬 (현재 미사용)
  bridge/
    index.ts
    MessageBridge.ts           # postMessage 래퍼 (origin 검증, 에러 격리)
  export/
    index.ts
    jsonExport.ts              # JSON 직렬화
    jsxExport.ts               # React JSX 코드 생성
    htmlExport.ts              # 독립 HTML 페이지 생성
```

### 핵심 타입: `EditorElement`

```typescript
interface EditorElement {
  id: string // nanoid
  type: ElementType // "div" | "text" | "image" | "button" | "input" | "flex" | "grid"
  name: string // 레이어 패널에 표시 (예: "div-a3f2")
  parentId: string | null
  children: string[] // 자식 ID 배열
  style: CSSProperties // React CSSProperties 그대로 사용
  props: Record<string, unknown> // 타입별 속성 (content, src, placeholder 등)
  locked: boolean // root는 항상 true
  visible: boolean
}
```

Flat Map(`Map<id, EditorElement>`) + `parentId`/`children` 양방향 참조.
임의 접근 O(1), 이동은 양쪽 `children` 배열 splice.

### 메시지 프로토콜

Shell과 Canvas는 `postMessage`로 통신한다. 모든 메시지는 `WrappedMessage` 봉투로 감싸진다.

**Shell → Canvas:**

| 메시지           | 용도             |
| ---------------- | ---------------- |
| `SYNC_DOCUMENT`  | 전체 문서 동기화 |
| `ADD_ELEMENT`    | 요소 추가        |
| `DELETE_ELEMENT` | 요소 삭제        |
| `UPDATE_STYLE`   | 스타일 변경      |
| `UPDATE_PROPS`   | 속성 변경        |
| `SELECT_ELEMENT` | 선택 상태 동기화 |

**Canvas → Shell:**

| 메시지            | 용도                      |
| ----------------- | ------------------------- |
| `CANVAS_READY`    | 초기화 완료 신호          |
| `ELEMENT_CLICKED` | 요소 클릭 (bounds 포함)   |
| `ELEMENT_MOVED`   | 드래그 완료 (최종 좌표)   |
| `ELEMENT_RESIZED` | 리사이즈 완료 (최종 크기) |
| `CANVAS_CLICKED`  | 빈 영역 클릭 (선택 해제)  |

### 스토어

| 스토어           | 역할              | 비고                         |
| ---------------- | ----------------- | ---------------------------- |
| `DocumentStore`  | 요소 CRUD, 직렬화 | `observable.map` 사용        |
| `SelectionStore` | 선택/호버 추적    | DocumentStore 주입           |
| `HistoryStore`   | undo/redo 스택    | `structuredClone`, 최대 50개 |
| `ViewportStore`  | 줌(0.1~5x), 팬    | 아직 UI 미연결               |

## editor-shell — 에디터 UI

### 파일 구조

```
src/
  main.tsx          # React root
  stores.ts         # 스토어 인스턴스 생성 + MessageBridge 초기화
  App.tsx           # 메인 컴포넌트 (382줄)
```

### UI 레이아웃

```
┌─────────────────────────────────────────────────┐
│ Toolbar: [div] [T] [img] [btn] [input] | [flex] │
│          [grid] | [↶] [↷] | [Export] [✕]        │
├────────┬─────────────────────────┬──────────────┤
│ Layers │      Canvas (iframe)    │  Properties  │
│ 200px  │      (editor-canvas)    │    260px     │
│        │                         │              │
│  □ Root│                         │  Layout      │
│    □ A │                         │   x: 100     │
│    □ B │                         │   y: 200     │
│        │                         │              │
│        │                         │  Appearance  │
│        │                         │   bg: #fff   │
└────────┴─────────────────────────┴──────────────┘
```

### 컴포넌트 구성

| 컴포넌트          | 역할                                        |
| ----------------- | ------------------------------------------- |
| `App`             | 메인 레이아웃, 메시지 핸들링, 키보드 단축키 |
| `ToolButton`      | 툴바 버튼                                   |
| `LayerTree`       | 재귀적 레이어 계층 표시 (observer)          |
| `PropertiesPanel` | 선택된 요소의 스타일 편집 (observer)        |
| `ExportModal`     | JSON/JSX/HTML 내보내기 모달 (observer)      |

### 키보드 단축키

| 단축키                 | 동작           |
| ---------------------- | -------------- |
| `Delete` / `Backspace` | 선택 요소 삭제 |
| `Cmd+Z`                | Undo           |
| `Cmd+Shift+Z`          | Redo           |

## editor-canvas — 캔버스 렌더러

### 파일 구조

```
src/
  main.tsx          # React root
  App.tsx           # 캔버스 컴포넌트 (345줄)
```

Canvas는 자체 `DocumentStore`와 `MessageBridge`를 갖는다.
Shell에서 전송된 문서 데이터를 받아 로컬 스토어에 반영한다.

### 컴포넌트 구성

| 컴포넌트            | 역할                                  |
| ------------------- | ------------------------------------- |
| `App`               | 메시지 수신, 캔버스 루트              |
| `ElementRenderer`   | 재귀적 DOM 렌더링 + 드래그 (observer) |
| `SelectionOverlay`  | 8방향 리사이즈 핸들 (observer)        |
| `getElementContent` | 요소 타입별 내용 렌더링               |

### 드래그 & 리사이즈

Pointer Capture API 사용:

1. `pointerdown` → `setPointerCapture` → 로컬 스토어 즉시 업데이트 (낙관적)
2. `pointermove` → 매 프레임 위치/크기 갱신
3. `pointerup` → `releasePointerCapture` → Shell에 최종 값 전송

Cleanup ref 패턴으로 컴포넌트 unmount 시 리스너 정리.

## 데이터 흐름

### 초기화 시퀀스

```
Shell                         Canvas (iframe)
  │                              │
  │  iframe load                 │
  ├─────────────────────────────→│
  │                              │ bridge.setTarget(window.parent)
  │         CANVAS_READY         │
  │←─────────────────────────────┤
  │                              │
  │       SYNC_DOCUMENT          │
  ├─────────────────────────────→│ documentStore.loadFromSerializable()
  │                              │
```

iframe load 시 100ms 후 `SYNC_DOCUMENT` 재전송 (race condition 방지).

### 요소 추가 흐름

```
Shell                         Canvas
  │ user clicks [div]            │
  │ pushSnapshot()               │
  │ documentStore.addElement()   │
  │       ADD_ELEMENT            │
  ├─────────────────────────────→│ addElementFromRemote()
  │                              │ MobX → 자동 렌더링
```

### 드래그 흐름

```
Shell                         Canvas
  │                              │ user drags element
  │                              │ → 매 프레임 로컬 업데이트 (no message)
  │                              │
  │                              │ pointerup
  │       ELEMENT_MOVED          │
  │←─────────────────────────────┤
  │ pushSnapshot()               │
  │ updateStyle()                │
  │       SYNC_DOCUMENT          │
  ├─────────────────────────────→│
```

### 속성 편집 흐름

```
Shell                         Canvas
  │ user edits property          │
  │ pushSnapshot()               │
  │ updateStyle()                │
  │       UPDATE_STYLE           │
  ├─────────────────────────────→│ updateStyle()
  │                              │ MobX → 자동 렌더링
```

## 환경 변수

| 앱     | 변수                 | 기본값                  | 용도                                     |
| ------ | -------------------- | ----------------------- | ---------------------------------------- |
| Shell  | `VITE_CANVAS_ORIGIN` | `http://localhost:4001` | Canvas iframe src + MessageBridge origin |
| Canvas | `VITE_SHELL_ORIGIN`  | `http://localhost:4000` | MessageBridge origin                     |

## 보안

- **Origin 검증**: `MessageBridge`가 `event.origin`을 `allowedOrigin`과 비교
- **메시지 소스 검증**: `isEditorMessage()`가 `EDITOR_MESSAGE_SOURCE` 필드 확인
- **XSS 방지**: 내보내기 시 `escapeAttr`/`escapeHTML`로 사용자 입력 이스케이프
- **핸들러 격리**: `forEach` 내부 try-catch로 한 핸들러의 에러가 다른 핸들러에 영향 방지

## 관련 문서

- [설계 문서](./2026-03-09-react-dom-editor-design.md) — 전체 설계 스펙
- [암묵지](./2026-03-09-react-dom-editor-tacit-knowledge.md) — 의사결정 배경과 트레이드오프
- [구현 계획](./2026-03-09-react-dom-editor-implementation.md) — 태스크별 구현 계획
