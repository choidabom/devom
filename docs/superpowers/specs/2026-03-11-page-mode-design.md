# Page Mode Design Spec

## Overview

Canvas Mode(현재 absolute positioning)와 Page Mode(flow layout)를 같은 요소 트리에서 토글 방식으로 전환하는 기능.

## Design Decisions

| 결정 사항 | 선택 | 근거 |
|---|---|---|
| 배치 방식 | 현재 Auto Layout 확장 | 기존 flex 인프라(layoutMode, layoutProps, sizing, reorder/reparent) 재활용 |
| 뷰포트 제어 | 고정 프리셋 3종 | Desktop(1280), Tablet(768), Mobile(375). 브레이크포인트 시스템은 과도 |
| 모드 전환 | 같은 트리, 스타일만 토글 | canvasPosition에 absolute 좌표 보존, 복원 가능 |
| UI 배치 | Toolbar 토글 + 캔버스 상단 바 | 모드 토글은 글로벌 → Toolbar, 프리셋은 조건부 → 캔버스 상단 |

## Mode Comparison

| | Canvas Mode | Page Mode |
|---|---|---|
| Root layoutMode | `none` | `flex` (column) |
| 자식 position | `absolute` (left/top) | `relative` (flow) |
| 뷰포트 | 고정 1280×720, zoom/pan | 프리셋 너비, 높이 auto |
| 새 요소 기본값 | absolute positioning | flow (sizing.w: fill, sizing.h: hug) |
| 배경 | `#ffffff` 고정 프레임 | 센터 정렬된 페이지 컨테이너 |

## Implementation Details

### 1. Data Model Changes

**DocumentStore:**
- `canvasMode: 'canvas' | 'page'` 필드 추가
- `pageViewport: 1280 | 768 | 375` 프리셋 너비 필드 추가

**EditorElement:**
- `canvasPosition: { left: number; top: number } | null` 필드 추가
- Canvas Mode의 absolute 좌표를 보존하는 용도

### 2. Mode Toggle Logic

**Canvas → Page 전환:**
1. 각 직계 자식의 현재 `style.left/top`을 `canvasPosition`에 저장
2. 자식들의 `style.position`을 `relative`로, `left/top` 제거
3. Root의 `layoutMode`를 `flex`로, `layoutProps.direction`을 `column`으로
4. Root 스타일: `width: pageViewport`, `height: 'auto'`, `minHeight: '100vh'`

**Page → Canvas 복원:**
1. Root의 `layoutMode`를 `none`으로
2. 자식들의 `canvasPosition`에서 `left/top` 복원, `position: absolute`로
3. Root 스타일: `width/height`를 원래 viewport 값으로

### 3. UI Components

**Toolbar 토글 버튼:**
- Edit/Interact 토글 왼쪽, ToolSep으로 구분
- Canvas 아이콘 / Page 아이콘 전환

**캔버스 상단 Viewport Bar (Page Mode에서만):**
- 3개 프리셋 버튼: `Desktop (1280)` | `Tablet (768)` | `Mobile (375)`
- 캔버스 상단 중앙에 표시
- 선택된 프리셋이 하이라이트

### 4. Page Mode Rendering

- Root: `display: flex`, `flexDirection: column`, `width: pageViewport`, `height: auto`
- 캔버스 배경에서 페이지가 가운데 정렬 (좌우 회색 여백)
- 새로 추가되는 요소: `position: relative`, `sizing.w: 'fill'` 기본값

### 5. Affected Files

| 파일 | 변경 내용 |
|---|---|
| `packages/editor-core/src/types.ts` | `canvasPosition` 필드, `canvasMode` 타입 |
| `packages/editor-core/src/stores/DocumentStore.ts` | 모드 전환 로직, 좌표 저장/복원 |
| `packages/editor-core/src/protocol.ts` | `SET_CANVAS_MODE`, `SET_PAGE_VIEWPORT` 메시지 |
| `apps/editor-shell/src/components/Toolbar.tsx` | Canvas/Page 토글 버튼 |
| `apps/editor-shell/src/App.tsx` | 모드 상태 관리, 메시지 전송 |
| `apps/editor-canvas/src/App.tsx` | 상단 바 UI, 렌더링 분기 |
| `apps/editor-canvas/src/components/ElementRenderer.tsx` | Page Mode position 처리 |

**변경 없는 파일:** SelectionOverlay, SnapGuides, shadcn 컴포넌트, Export 로직
