# Group/Ungroup & Image Upload Design Spec

## Overview

에디터에 두 가지 기능을 추가한다:
1. **Group/Ungroup** — 선택한 요소들을 컨테이너로 묶기/풀기
2. **Image Upload** — 로컬 이미지 파일을 base64로 변환하여 Canvas에 추가

---

## 1. Group/Ungroup

### 데이터 모델

- 별도 타입 없이 기존 `div` 컨테이너를 그룹으로 사용
- 생성된 그룹: `layoutMode: 'none'`, `name: 'Group'`

### Group 동작 (Cmd+G)

1. 선택된 요소들의 bounding box 계산 (left, top, width, height)
2. 새 `div` 요소 생성 — 위치/크기 = bounding box
3. 선택된 요소들을 새 컨테이너의 children으로 이동
4. 각 자식의 좌표를 컨테이너 기준 상대좌표로 변환 (`left -= container.left`, `top -= container.top`)
5. 선택을 새 그룹 컨테이너로 변경

### Ungroup 동작 (Cmd+Shift+G)

- 기존 `ungroupElements()` 활용
- 자식들의 좌표를 부모 기준으로 재계산 (컨테이너 좌표 더하기)

### 다른 부모에 속한 요소 그룹핑

- 다른 부모에 속한 요소들도 그룹핑 허용
- 공통 조상(Lowest Common Ancestor)을 찾아서 해당 레벨에 그룹 컨테이너 생성
- 선택된 요소들을 원래 부모에서 분리 후 새 그룹의 children으로 이동
- 각 요소의 절대 좌표를 계산한 뒤 그룹 컨테이너 기준 상대좌표로 변환

### 메시지 프로토콜

- Canvas → Shell: `GROUP_ELEMENTS_REQUEST { ids: string[] }`
- Canvas → Shell: `UNGROUP_ELEMENTS_REQUEST { ids: string[] }`
- Shell → Canvas: 기존 `SYNC_DOCUMENT`로 결과 반영

### 키보드 단축키

- `Cmd+G`: Group
- `Cmd+Shift+G`: Ungroup

### 제약 조건

- root 요소는 그룹에 포함 불가
- 선택 요소가 1개 이하면 Group 무시
- locked 요소는 그룹/언그룹 대상에서 제외

---

## 2. Image Upload

### 데이터 모델

- `ElementType`에 `'img'` 추가
- `props.src`: base64 data URL (string)
- `props.alt`: 대체 텍스트 (string, 기본값 빈 문자열)
- 기본 스타일: `width: 200`, `height: 'auto'`, `objectFit: 'cover'`

### 추가 UI

- Toolbar "UI" 드롭다운에 **Image** 항목 추가 (Media 카테고리)
- 클릭 시 `<input type="file" accept="image/*">` 다이얼로그 실행
- FileReader로 base64 변환 → `ADD_ELEMENT_REQUEST`에 `props.src` 포함

### ElementRenderer

- `type === 'img'`일 때 `<img src={props.src} alt={props.alt} />` 렌더링
- 리사이즈/드래그 가능 (기존 요소와 동일)
- children 없음 (void element)

### PropertiesPanel

- src: 이미지 미리보기 썸네일 + "변경" 버튼 (파일 재선택)
- alt: 텍스트 입력
- objectFit: select (cover / contain / fill / none)

### Export

- JSX: `<img src="..." alt="..." style={{...}} />`
- HTML: `<img src="..." alt="..." style="..." />`

### 제약 사항

- base64이므로 최대 5MB 파일 크기 제한
- 새로고침 시 소실 (현재 persistence 없으므로 동일)

---

## 영향 범위

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/editor-core/src/types.ts` | `ElementType`에 `'img'` 추가 |
| `packages/editor-core/src/stores/DocumentStore.ts` | `groupElements()`, `addElement()` img 지원 |
| `packages/editor-core/src/protocol.ts` | `GROUP_ELEMENTS_REQUEST`, `UNGROUP_ELEMENTS_REQUEST` 메시지 추가 |
| `packages/editor-core/src/presets/defaultStyles.ts` | img 기본 스타일 추가 |
| `apps/editor-shell/src/App.tsx` | 메시지 핸들러 추가, 키보드 단축키 |
| `apps/editor-shell/src/components/Toolbar.tsx` | Image 항목 추가, Group/Ungroup 버튼 |
| `apps/editor-canvas/src/App.tsx` | 메시지 핸들러, 키보드 단축키 |
| `apps/editor-canvas/src/components/ElementRenderer.tsx` | img 렌더링 |
| `apps/editor-shell/src/components/PropertiesPanel.tsx` | img 속성 UI |
| `apps/editor-shell/src/utils/exportUtils.ts` | img export 지원 |
