# Page Mode Web Builder Design

## Overview

Page mode를 "진짜 웹 페이지 빌더"로 강화한다. 기존 auto layout 인프라(flex, sizing, reorder/reparent)를 확장하여 섹션 기반 페이지 구성, grid 레이아웃, 섹션 프리셋을 지원한다.

## Approach

**단일 트리 + 섹션 확장 (Approach B)**

- 하나의 요소 트리를 Canvas/Page 두 가지 뷰로 렌더링
- Page mode에서 섹션 기반으로 웹 페이지를 직접 빌드
- Canvas mode는 자유배치 디자인/조정 용도로 유지
- 새로운 데이터 모델 없이 기존 인프라 90% 재활용

## Data Model Changes

### EditorElement 확장

```typescript
interface EditorElement {
  // ... existing fields ...

  // 섹션 역할 식별 (page mode에서 의미)
  role?: 'section' | 'hero' | 'features' | 'cta' | 'footer' | 'header'

  // 섹션 전용 속성
  sectionProps?: {
    backgroundColor?: string    // 섹션 배경색
    backgroundImage?: string    // 섹션 배경 이미지 URL
    maxWidth?: number           // 내부 콘텐츠 최대 너비 (예: 1200px)
    verticalPadding?: number    // 섹션 상하 패딩
  }

  // Grid 레이아웃 속성
  gridProps?: {
    columns: number             // 컬럼 수 (2, 3, 4 등)
    gap: number                 // grid gap (px)
    minColumnWidth?: number     // auto-fit 시 최소 컬럼 너비
  }
}
```

### layoutMode 확장

```typescript
// 기존: 'none' | 'flex'
// 변경: 'none' | 'flex' | 'grid'
type LayoutMode = 'none' | 'flex' | 'grid'
```

## Page Visual

### Canvas 렌더링 (Page mode)

- 캔버스 배경: `#e8e8ec` (이미 적용)
- Root 요소: `box-shadow: 0 2px 12px rgba(0,0,0,0.12)` + `border-radius: 2px`
- 회색 배경 위에 흰색 페이지가 떠 있는 문서 스타일

### 섹션 렌더링

- `role`이 있는 요소는 `sectionProps.backgroundColor`를 배경에 적용
- `sectionProps.maxWidth` 설정 시 내부 콘텐츠를 `max-width` + `margin: 0 auto`로 중앙 정렬
- `sectionProps.verticalPadding`을 상하 패딩에 적용
- 섹션 자체는 항상 full-width (sizing.width: 'fill')

## Grid Layout

### CSS 매핑

```typescript
// gridProps → CSS
{
  display: 'grid',
  gridTemplateColumns: `repeat(${gridProps.columns}, 1fr)`,
  gap: `${gridProps.gap}px`,
}

// minColumnWidth가 있으면 auto-fit 사용
{
  gridTemplateColumns: `repeat(auto-fit, minmax(${gridProps.minColumnWidth}px, 1fr))`,
}
```

### Properties Panel

- Layout mode 선택: none / flex / grid
- Grid 선택 시: columns, gap 설정 UI 노출
- 자식 요소는 grid cell에 자연 흐름으로 배치 (명시적 row/col 지정 없음)

## Section Presets

Toolbar "Add" 드롭다운에 **Sections** 카테고리 추가:

| 프리셋 | 구조 | 기본 스타일 |
|--------|------|-------------|
| Empty Section | flex-column 빈 컨테이너 | padding: 40px, fill-width |
| Hero | heading + subtext + CTA button | 큰 패딩, 중앙 정렬, 그라데이션 배경 |
| Features | grid 3-column + card 3개 | 배경 #f8fafc, gap 24px |
| CTA | heading + button | 배경색, 중앙 정렬 |
| Header | flex-row: logo + nav links | border-bottom, 작은 패딩 |
| Footer | flex-row: 링크 텍스트들 | 어두운 배경 (#1e293b) |

### 프리셋 동작

- 프리셋 선택 → 미리 구성된 요소 트리가 root에 추가
- 추가 후 모든 요소는 자유롭게 편집/삭제/이동 가능
- 프리셋 = 편의 기능, 구조적 제약 없음

## Page Mode UI

### 섹션 간 삽입 버튼

- 섹션과 섹션 사이 호버 시 `+ 섹션 추가` 버튼 표시
- 클릭 → 프리셋 선택 팝오버
- root의 맨 아래에도 항상 `+ 섹션 추가` 표시

### Properties Panel 확장

섹션 선택 시 추가 UI:
- **Section** 탭: 배경색 picker, maxWidth 입력, verticalPadding 슬라이더
- **Layout** 탭: 기존 flex 설정 + grid 설정 (layoutMode에 따라)

## Page Structure Example

```
root (flex column, page width: 1280|768|375)
  ├── section[header] (fill-width, flex row, border-bottom)
  │     ├── div (logo)
  │     └── text (nav links)
  ├── section[hero] (fill-width, flex column, gradient bg, padding 80px)
  │     ├── text (heading, large)
  │     ├── text (subtext)
  │     └── button (CTA)
  ├── section[features] (fill-width, grid 3-col, bg #f8fafc)
  │     ├── card 1
  │     ├── card 2
  │     └── card 3
  ├── section[cta] (fill-width, flex column, bg primary)
  │     ├── text (heading)
  │     └── button
  └── section[footer] (fill-width, flex row, bg #1e293b)
        ├── text (links)
        └── text (copyright)
```

## Canvas Mode Interaction

- Canvas mode에서 섹션은 일반 컨테이너로 보임
- `canvasPosition` 필드로 절대좌표 보존/복원 (기존 메커니즘)
- 섹션의 `role`, `sectionProps`는 Canvas mode에서도 유지됨

## Implementation Scope

1. **데이터 모델**: `role`, `sectionProps`, `gridProps` 필드 추가 (types.ts)
2. **페이지 비주얼**: root에 shadow/border-radius 적용 (ElementRenderer)
3. **Grid 레이아웃**: `layoutMode: 'grid'` + `getContainerStyles` 확장
4. **섹션 렌더링**: sectionProps 기반 배경색/패딩/maxWidth 적용
5. **섹션 프리셋**: 6개 프리셋 팩토리 함수 (DocumentStore)
6. **Toolbar UI**: Sections 카테고리 추가
7. **섹션 삽입 UI**: 섹션 간 `+` 버튼 (Canvas iframe)
8. **Properties Panel**: sectionProps 편집 UI + grid 설정 UI
