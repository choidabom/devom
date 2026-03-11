# Group/Ungroup & Image Upload Design Spec

## Overview

에디터에 두 가지 기능을 추가한다:
1. **Group/Ungroup** — 선택한 요소들을 컨테이너로 묶기/풀기
2. **Image Upload** — 기존 `image` 타입에 파일 업로드 기능 추가

---

## 1. Group/Ungroup

### 데이터 모델

- 별도 타입 없이 기존 `div` 컨테이너를 그룹으로 사용
- 생성된 그룹: `layoutMode: 'none'`, `name: 'Group-{id.slice(0,4)}'`

### Group 동작 (Cmd+G)

1. 선택된 요소 2개 이상인지 확인, locked 요소 제외
2. Bounding box 계산:
   - Canvas iframe에서 각 요소의 `getBoundingClientRect()` 호출
   - 현재 zoom 값으로 나누어 문서 좌표로 변환
   - 모든 요소의 min(left, top), max(right, bottom) → bounding box
3. LCA(Lowest Common Ancestor) 계산:
   - 각 요소에서 root까지의 경로(parentId chain) 구축
   - 모든 경로에서 공통으로 나타나는 가장 깊은 조상 선택
   - LCA가 root인 경우 허용 (root 아래에 그룹 생성)
   - 선택된 요소가 다른 요소의 조상인 경우 그룹핑 차단
4. LCA의 자식으로 새 `div` 요소 생성 — 위치/크기 = bounding box
5. 선택된 요소들을 원래 부모에서 분리, 새 컨테이너의 children으로 이동
6. 각 자식의 좌표를 컨테이너 기준 상대좌표로 변환:
   - 절대 좌표 요소: `left -= container.left`, `top -= container.top`
   - flex/grid 자식: `getBoundingClientRect()` 기준 delta 계산 후 `position: absolute`로 전환
7. 선택을 새 그룹 컨테이너로 변경
8. `historyStore.pushSnapshot()` 호출

### Ungroup 동작 (Cmd+Shift+G)

- 기존 `ungroupElements()` 활용
- 자식들의 좌표를 부모 기준으로 재계산 (컨테이너 좌표 더하기)
- `historyStore.pushSnapshot()` 호출

### 메시지 프로토콜

```
Canvas → Shell: GROUP_ELEMENTS_REQUEST { ids: string[] }
Shell 처리:
  1. documentStore.groupElements(ids) 실행
  2. historyStore.pushSnapshot()
  3. SYNC_DOCUMENT → Canvas
  4. selectionStore.select(newGroupId)
  5. SELECT_ELEMENT { ids: [newGroupId] } → Canvas

Canvas → Shell: UNGROUP_ELEMENTS_REQUEST { ids: string[] }
Shell 처리:
  1. documentStore.ungroupElements(ids) 실행 → newSelection 반환
  2. historyStore.pushSnapshot()
  3. SYNC_DOCUMENT → Canvas
  4. selectionStore.setIds(newSelection)
  5. SELECT_ELEMENT { ids: newSelection } → Canvas
```

### 키보드 단축키

- `Cmd+G`: Group (Canvas에서 감지 → Shell로 REQUEST)
- `Cmd+Shift+G`: Ungroup (Canvas에서 감지 → Shell로 REQUEST)

### Export

- 그룹 컨테이너는 일반 `<div>`로 export (특별한 구분 없음)

### 제약 조건

- root 요소는 그룹에 포함 불가
- 선택 요소가 1개 이하면 Group 무시
- locked 요소는 그룹/언그룹 대상에서 제외
- 선택된 요소가 다른 선택 요소의 조상이면 그룹핑 차단

---

## 2. Image Upload

### 현재 상태

`image` 타입이 이미 존재:
- `types.ts`: `ElementType`에 `"image"` 포함
- `DocumentStore.getDefaultProps()`: `{ src: "", alt: "Image" }` 반환
- `ElementRenderer`: `<img>` 렌더링 (src 없으면 placeholder 표시)
- `DEFAULT_ELEMENT_STYLE.image`: `{ height: 200, objectFit: "cover" }`
- `jsxExport`: `"image"` → `"img"` 태그 매핑

### 추가할 기능: 파일 업로드

#### Toolbar UI

- Toolbar "UI" 드롭다운에 **Image** 항목 추가 (Media 카테고리)
- 클릭 시 숨겨진 `<input type="file" accept="image/*">` 트리거
- 업로드 흐름:
  1. 파일 선택 다이얼로그 열림
  2. `file.size > 5MB` 체크 → 초과 시 alert 표시, 중단
  3. `FileReader.readAsDataURL(file)` 실행
  4. `ADD_ELEMENT_REQUEST { type: "image", props: { src: dataUrl, alt: file.name } }` → Shell 전송

#### PropertiesPanel (image 선택 시)

- src: 이미지 미리보기 썸네일 + "변경" 버튼 (파일 재선택)
- alt: 텍스트 입력
- objectFit: select (cover / contain / fill / none)

### 제약 사항

- base64이므로 최대 5MB 파일 크기 제한
- 새로고침 시 소실 (현재 persistence 없으므로 동일)
- children 없음 (void element)

---

## 영향 범위

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/editor-core/src/stores/DocumentStore.ts` | `groupElements()` 추가 |
| `packages/editor-core/src/protocol.ts` | `GROUP_ELEMENTS_REQUEST`, `UNGROUP_ELEMENTS_REQUEST` 메시지 추가 |
| `apps/editor-shell/src/App.tsx` | Group/Ungroup 메시지 핸들러, Image 업로드 핸들러 |
| `apps/editor-shell/src/components/Toolbar.tsx` | Image 항목 추가 |
| `apps/editor-canvas/src/App.tsx` | Group/Ungroup 키보드 단축키 → REQUEST 전송 |
| `apps/editor-shell/src/components/PropertiesPanel.tsx` | image 속성 UI (src 변경, alt, objectFit) |
