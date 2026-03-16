# Devom Editor 아키텍처 (2026-03-16 현재)

> 초기 설계 문서(`docs/plans/2026-03-09-react-dom-editor-*.md`)의 후속 문서.
> 구현이 진행되면서 달라진 현재 상태를 반영한다.

## 개요

Canvas API 없이 React DOM만으로 UI 컴포넌트를 배치하고 편집하는 디자인 에디터.
Shell-Canvas iframe 분리 아키텍처를 적용하여, 실제 shadcn/ui 컴포넌트를 Canvas에서 직접 렌더링한다.

## 프로젝트 구조

```
apps/
  editor-shell/          # Shell (Vite + React, :4000)
  editor-canvas/         # Canvas iframe (Vite + React + Tailwind v3, :4001)
packages/
  editor-core/           # 공유 코어 (MobX 스토어, 타입, 프로토콜, Export/Import)
```

### 실행

```bash
pnpm editor              # Shell(4000) + Canvas(4001) 동시 실행
pnpm editor:build        # core → shell → canvas 순차 빌드
pnpm editor:deploy       # 빌드 + editor-combine.mjs로 단일 dist-editor 생성
pnpm editor:publish      # deploy + Vercel production 배포
```

## 아키텍처: Shell-Canvas 분리

```
┌─ Shell (localhost:4000) ──────────────────────────────────┐
│  Toolbar  │            iframe              │  Properties  │
│           │  ┌─ Canvas (localhost:4001) ─┐ │              │
│  Layers   │  │  요소 렌더링 + 드래그      │ │              │
│           │  │  선택 오버레이 + 스냅      │ │              │
│           │  └──────────────────────────┘  │              │
│  Export   │                                │              │
└───────────────────────────────────────────────────────────┘
              ↕ postMessage (MessageBridge)
```

### 분리 이유

- **CSS 격리**: Canvas의 Tailwind CSS + shadcn/ui 스타일이 Shell UI와 충돌하지 않음
- **관심사 분리**: 편집 UI(Shell)와 렌더링(Canvas)의 독립적 개발/배포

### 현재 한계

- 같은 localhost (same-origin) → 프로세스 격리 없음
- 직접 관리하는 shadcn/ui만 렌더링 → 보안 샌드박싱 불필요
- 상태 이중화 + 22개 메시지 프로토콜 유지 비용

## 초기화 흐름

```
Shell                              Canvas (iframe)
  │                                  │
  │  iframe 로드 완료                │
  │  bridge.setTarget(contentWindow) │
  │                                  │ React 마운트
  │                                  │ bridge.setTarget(window.parent)
  │          CANVAS_READY            │
  │←─────────────────────────────────┤
  │                                  │
  │       SYNC_DOCUMENT              │
  ├─────────────────────────────────→│ documentStore.loadFromSerializable()
  │       ZOOM_TO_FIT                │
  ├─────────────────────────────────→│ bounding box 계산 → 화면 맞춤
  │                                  │
```

단일 경로: CANVAS_READY → Shell이 SYNC_DOCUMENT + ZOOM_TO_FIT 전송.

## 데이터 모델

### EditorElement

```typescript
interface EditorElement {
  id: string // nanoid
  type: ElementType // 33개 타입
  name: string // 레이어 패널 표시 이름
  parentId: string | null // 부모 ID (null = root)
  children: string[] // 자식 ID 배열
  style: CSSProperties // React 인라인 스타일
  props: Record<string, unknown> // 컴포넌트 고유 속성 (variant, label 등)
  locked: boolean // 잠금 여부
  visible: boolean // 표시 여부

  // Auto Layout
  layoutMode: "none" | "flex" | "grid"
  layoutProps: LayoutProps // direction, gap, padding, alignItems, justifyContent, flexWrap
  sizing: { w: "fixed" | "hug" | "fill"; h: "fixed" | "hug" | "fill" }

  // Canvas/Page 모드
  canvasPosition: { left; top; width; height } | null // Canvas→Page 전환 시 좌표 보존

  // Page Mode 섹션
  role?: SectionRole // "section" | "hero" | "header" | "features" | "cta" | "footer"
  sectionProps?: SectionProps // background, maxWidth, verticalPadding
  gridProps?: GridProps // columns, gap, minColumnWidth

  // Form
  formField?: FormFieldConfig // { name, defaultValue?, validation? }
  formRole?: "submit" | "reset"
}
```

### ElementType (33개)

- **기본**: `div`, `text`, `image`, `video`, `button`, `input`, `form`, `flex`, `grid`
- **shadcn/ui (20개)**: `sc:button`, `sc:card`, `sc:input`, `sc:badge`, `sc:checkbox`, `sc:switch`, `sc:label`, `sc:textarea`, `sc:avatar`, `sc:separator`, `sc:progress`, `sc:skeleton`, `sc:slider`, `sc:tabs`, `sc:alert`, `sc:toggle`, `sc:select`, `sc:table`, `sc:accordion`, `sc:radio-group`

데이터 구조: Flat Map (`ObservableMap<id, EditorElement>`) + `parentId`/`children` 양방향 참조.

## MobX 스토어

| 스토어             | 위치                         | 역할                                          |
| ------------------ | ---------------------------- | --------------------------------------------- |
| **DocumentStore**  | Shell (원본) + Canvas (미러) | 요소 CRUD, 레이아웃, 폼, 그룹, 템플릿, 직렬화 |
| **SelectionStore** | Shell만                      | selectedIds, hoveredId 관리                   |
| **HistoryStore**   | Shell만                      | Undo/Redo 스택 (JSON 스냅샷, 최대 50개)       |

- Shell의 DocumentStore가 **Source of Truth**
- Canvas의 DocumentStore는 SYNC_DOCUMENT로 동기화받는 미러
- ViewportStore → Canvas의 `useCanvasViewport` 훅으로 대체

## 메시지 프로토콜

### Shell → Canvas (10종)

| 메시지                                                | 용도                          |
| ----------------------------------------------------- | ----------------------------- |
| `SYNC_DOCUMENT`                                       | 전체 문서 상태 동기화         |
| `ADD_ELEMENT`                                         | 단일 요소 추가                |
| `DELETE_ELEMENT`                                      | 요소 삭제                     |
| `UPDATE_STYLE` / `UPDATE_PROPS`                       | 스타일/속성 변경              |
| `SELECT_ELEMENT`                                      | 선택 동기화 (ids[])           |
| `SET_MODE`                                            | Edit/Interact 모드 전환       |
| `SET_CANVAS_MODE` / `SET_PAGE_VIEWPORT`               | Canvas/Page 모드, 뷰포트 너비 |
| `ZOOM_TO_FIT` / `ZOOM_IN` / `ZOOM_OUT` / `ZOOM_RESET` | 줌 제어                       |
| `DND_DROP`                                            | 툴바 DnD 드롭 좌표            |

### Canvas → Shell (12종)

| 메시지                                                | 용도                               |
| ----------------------------------------------------- | ---------------------------------- |
| `CANVAS_READY`                                        | 초기화 완료                        |
| `ELEMENT_CLICKED`                                     | 요소 클릭 (id + bounds + shiftKey) |
| `ELEMENT_MOVED` / `ELEMENTS_MOVED`                    | 드래그 완료 (단일/배치)            |
| `ELEMENT_RESIZED`                                     | 리사이즈 완료                      |
| `CANVAS_CLICKED`                                      | 빈 영역 클릭 (선택 해제)           |
| `MARQUEE_SELECT`                                      | 범위 선택 (ids[])                  |
| `KEY_EVENT`                                           | 키보드 이벤트 포워딩               |
| `REORDER_CHILD` / `REPARENT_ELEMENT`                  | Auto-layout 순서/부모 변경         |
| `GROUP_ELEMENTS_REQUEST` / `UNGROUP_ELEMENTS_REQUEST` | 그룹화 요청                        |
| `DND_CREATE_ELEMENT`                                  | 드롭된 요소 생성 요청              |
| `ZOOM_CHANGED`                                        | 줌 변경 알림                       |
| `FORM_SUBMIT_RESULT`                                  | 폼 제출 데이터                     |

### 핵심 원칙: 단방향 데이터 흐름

Canvas는 **요청만 보내고**, Shell이 documentStore를 수정한 뒤 SYNC_DOCUMENT로 확정된 상태를 전송한다.

```
사용자 조작 (Canvas) → 요청 메시지 → Shell 처리 → SYNC_DOCUMENT → Canvas 반영
```

## Shell 구성

### 파일 구조

```
apps/editor-shell/src/
  App.tsx                           # 메인 레이아웃, iframe 관리
  stores.ts                         # 스토어 싱글톤 (documentStore, selectionStore, historyStore, bridge)
  hooks/
    useShellMessages.ts             # Canvas→Shell 메시지 수신 처리
    useClipboard.ts                 # Copy/Cut/Paste/Duplicate
    useEditorKeyboard.ts            # Shell 키보드 단축키
  components/
    Toolbar.tsx                     # 상단 도구 모음
    LeftPanel.tsx                   # 레이어 트리 + DnD
    PropertiesPanel.tsx             # 속성 편집 패널
    ExportPanel.tsx                 # 내보내기 사이드 패널
    ExportModal.tsx                 # PDF export (html2canvas + jsPDF)
    ImportModal.tsx                 # JSX import 모달
    LayoutGuide.tsx                 # 인터랙티브 아키텍처 가이드
```

### 주요 컴포넌트

| 컴포넌트            | 역할                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Toolbar**         | 요소 추가 (Frame, Text, Image, UI 드롭다운 20개, Sections, Templates, Forms), DnD, Undo/Redo, 정렬, 모드 전환 |
| **LeftPanel**       | 레이어 트리뷰, HTML5 DnD 순서/부모 변경, Lock/Unlock, 선택 시 자동 스크롤 + 확장                              |
| **PropertiesPanel** | 스타일 편집, Layout (none/flex/grid), Sizing (Fixed/Hug/Fill), ColorPicker, 컴포넌트 props                    |
| **ExportPanel**     | HTML/JSX/JSON/PDF/Form Code 5개 탭, 리사이즈(320-900px), 신택스 하이라이팅, 다운로드                          |

## Canvas 구성

### 파일 구조

```
apps/editor-canvas/src/
  App.tsx                           # 캔버스 루트, 뷰포트, 마키 선택
  hooks/
    useCanvasMessages.ts            # Shell→Canvas 메시지 수신 처리
    useCanvasViewport.ts            # zoom/pan 상태, Cmd+Wheel, Space+드래그
    useFormRuntime.ts               # Interact 모드 폼 런타임
  components/
    ElementRenderer.tsx             # 재귀적 요소 렌더러 + 드래그
    SelectionOverlay.tsx            # 선택 아웃라인 + 리사이즈 핸들
    SnapGuides.tsx                  # 드래그 중 정렬 가이드라인
    ContextMenu.tsx                 # 우클릭 메뉴
    ViewportBar.tsx                 # Page mode 너비 프리셋
    InsertionIndicator.tsx          # Auto-layout 드롭 위치 표시
    SectionInsertButton.tsx         # 섹션 간 + 버튼
    componentRegistry.tsx           # ElementType → React 렌더 함수 (32개)
    ui/                             # shadcn/ui 20개 컴포넌트 (Tailwind v3 호환)
  utils/
    snap.ts                         # calcSnap() — 5px 임계값 정렬
    autoLayoutDrag.ts               # findDropTarget(), insertion indicator 계산
```

### 주요 컴포넌트

| 컴포넌트              | 역할                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **ElementRenderer**   | 재귀적 트리 렌더링, 절대위치 드래그(setPointerCapture + DOM transform), Auto-layout reorder |
| **SelectionOverlay**  | 선택 아웃라인 + 8방향 리사이즈, getBoundingClientRect + ResizeObserver                      |
| **SnapGuides**        | 드래그 중 X/Y 스냅 라인 (엣지/중심 정렬)                                                    |
| **componentRegistry** | ElementType → React 렌더 함수 매핑, Interact 모드에서 폼 컨텍스트 연동                      |

## editor-core 구성

### 파일 구조

```
packages/editor-core/src/
  types.ts                          # EditorElement, ElementType, LayoutProps, SizingProps
  protocol.ts                       # ShellToCanvas / CanvasToShell 메시지 유니온 타입
  stores/
    DocumentStore.ts                # 핵심 상태 (ObservableMap, CRUD, 레이아웃, 폼, 그룹, 직렬화)
    SelectionStore.ts               # 선택 상태 (selectedIds, toggle, hover)
    HistoryStore.ts                 # Undo/Redo (JSON 스냅샷, 최대 50개)
    helpers/
      cloneHelpers.ts              # collectSubtree, cloneTree (복사/붙여넣기)
      groupHelpers.ts              # findLCA, groupElements, ungroupElements
  bridge/
    MessageBridge.ts                # postMessage 래퍼 (origin 필터, 에러 격리)
  export/
    htmlExport.ts                   # 독립 HTML 생성
    jsxExport.ts                    # React JSX + shadcn imports
    jsonExport.ts                   # JSON 직렬화
    formCodeExport.ts               # react-hook-form + zod 코드 생성
    convertToPageLayout.ts          # Canvas→Page 레이아웃 변환
  import/
    jsxImporter.ts                  # @babel/parser → ElementTemplate 변환
    componentMap.ts                 # JSX 태그 → ElementType 매핑
    tailwindMap.ts                  # Tailwind 클래스 → 인라인 스타일
  presets/
    sectionPresets.ts               # 6개 섹션 프리셋 팩토리
    formPresets.ts                  # 3개 폼 프리셋 (Signup, Contact, Feedback)
    templates/                      # 10개 템플릿 빌더
  utils/
    layoutStyles.ts                 # getContainerStyles, getChildSizingStyles, getSectionStyles
```

## 주요 데이터 흐름

### 요소 생성

```
1. [Shell] Toolbar 클릭
2. [Shell] historyStore.pushSnapshot()
3. [Shell] documentStore.addElement(type)
4. [Shell] selectionStore.select(newId)
5. [Shell] bridge.send(SYNC_DOCUMENT) + bridge.send(SELECT_ELEMENT)
6. [Canvas] documentStore.loadFromSerializable() → ElementRenderer 재렌더링
```

### 드래그 이동

```
1. [Canvas] pointerDown → setPointerCapture
2. [Canvas] pointerMove → DOM style.transform 직접 조작 (성능, 매 프레임)
3. [Canvas] calcSnap() → SnapGuides 표시
4. [Canvas] pointerUp → bridge.send(ELEMENTS_MOVED)
5. [Shell]  historyStore.pushSnapshot() → documentStore.updateStyle()
6. [Shell]  bridge.send(SYNC_DOCUMENT) → Canvas 상태 확정
```

### Undo/Redo

```
1. [Canvas] Cmd+Z → bridge.send(KEY_EVENT)
2. [Shell]  historyStore.undo() → 스냅샷 복원
3. [Shell]  selectionStore.clear()
4. [Shell]  bridge.send(SYNC_DOCUMENT) → Canvas 재렌더링
```

## Canvas/Page 모드

|               | Canvas Mode                               | Page Mode                             |
| ------------- | ----------------------------------------- | ------------------------------------- |
| 배치          | 자유로운 절대 좌표                        | 섹션 기반 흐름(flex column)           |
| Root          | `overflow: visible`, `layoutMode: "none"` | `layoutMode: "flex"`, 고정 너비       |
| 요소 position | `absolute` (left/top)                     | `relative` (flow)                     |
| 뷰포트        | 무한 캔버스 + zoom/pan                    | Desktop(1280)/Tablet(768)/Mobile(375) |

전환 시 `canvasPosition` 필드에 절대좌표를 저장/복원하여 양방향 이동 가능.

## 키보드 단축키

| 단축키                                | 동작                           | 처리 위치                               |
| ------------------------------------- | ------------------------------ | --------------------------------------- |
| `Delete` / `Backspace`                | 선택 요소 삭제                 | Shell (KEY_EVENT 수신)                  |
| `Cmd+Z` / `Cmd+Shift+Z`               | Undo / Redo                    | Shell                                   |
| `Cmd+C` / `Cmd+X` / `Cmd+V` / `Cmd+D` | Copy / Cut / Paste / Duplicate | Shell                                   |
| `Cmd+G` / `Cmd+Shift+G`               | Group / Ungroup                | Canvas → Shell (REQUEST 메시지)         |
| `Cmd+1`                               | Zoom to Fit                    | Shell (패널 정보 포함 ZOOM_TO_FIT 전송) |
| `Cmd+\`                               | 패널 토글                      | Shell                                   |
| `V` / `Escape`                        | Edit 모드                      | Shell                                   |
| `P`                                   | Interact 모드                  | Shell                                   |

IME 호환: `e.code` 사용 (한글/일본어 입력 중에도 단축키 동작).

## 내보내기/가져오기

### Export

| 포맷          | 설명                                               |
| ------------- | -------------------------------------------------- |
| **HTML**      | 독립 HTML 페이지, 인라인 CSS, XSS 방지 (isSafeUrl) |
| **JSX**       | React 컴포넌트 + shadcn/ui imports                 |
| **JSON**      | EditorDocument 직렬화                              |
| **PDF**       | html2canvas → jsPDF 파이프라인                     |
| **Form Code** | react-hook-form + zod 스키마 코드 생성             |

Canvas 모드에서도 `convertToPageLayout()`으로 flex column 레이아웃 변환 후 export.

### Import

`importJSX()`: @babel/parser로 JSX 파싱 → `componentMap`으로 태그→ElementType 매핑 → ElementTemplate 생성.
`effectiveType` 패턴으로 text-only div를 "text" 타입으로 변환 (export→import 라운드트립 호환).

## 템플릿 & 프리셋

- **10개 템플릿**: Blank, Dashboard, Login Form, Pricing, Settings, Product Detail, Food Product, Product Content, Galaxy Z Flip7, Galaxy Z Fold7
- **6개 섹션 프리셋**: Empty, Header, Hero, Features, CTA, Footer
- **3개 폼 프리셋**: Signup, Contact, Feedback

기본 템플릿: `food-product` (localStorage `devom-editor-template` 키로 마지막 선택 저장/복원).

## 보안

- **Origin 검증**: MessageBridge가 `event.origin`을 `allowedOrigin`과 비교
- **메시지 소스 검증**: `EDITOR_MESSAGE_SOURCE = "devom-editor"` 필드 확인
- **XSS 방지**: `isSafeUrl()` — `javascript:`, `vbscript:` 차단, `data:` URI는 안전한 이미지 포맷만 허용
- **Export 이스케이프**: `escapeAttr()`/`escapeHTML()`로 사용자 입력 처리

## 환경 변수

| 앱     | 변수                 | 기본값                                                          | 용도                              |
| ------ | -------------------- | --------------------------------------------------------------- | --------------------------------- |
| Shell  | `VITE_CANVAS_ORIGIN` | `http://localhost:4001` (dev) / `window.location.origin` (prod) | Canvas iframe src + bridge origin |
| Canvas | `VITE_SHELL_ORIGIN`  | `http://localhost:4000` (dev) / `window.location.origin` (prod) | MessageBridge origin              |

프로덕션 배포 시 `editor-combine.mjs`가 Shell(/) + Canvas(/canvas/) 를 단일 dist로 합침 → 같은 origin.

## 관련 문서

- `docs/plans/2026-03-09-react-dom-editor-design.md` — 초기 설계 (MVP 시점)
- `docs/plans/2026-03-09-react-dom-editor-architecture.md` — 초기 아키텍처 (MVP 시점)
- `docs/plans/2026-03-09-react-dom-editor-tacit-knowledge.md` — 설계 배경과 트레이드오프 (대부분 유효)
- `docs/superpowers/specs/` — 기능별 설계 스펙 (9개)
- `docs/superpowers/plans/` — 기능별 구현 계획 (9개)
- `editor-architecture.html` — 인터랙티브 아키텍처 다이어그램 (한국어)
