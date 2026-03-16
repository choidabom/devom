# Image Upload Design Spec

## Overview

기존 `image` 타입에 로컬 파일 업로드 기능을 추가한다.

## 현재 상태

`image` 타입이 이미 존재:

- `types.ts`: `ElementType`에 `"image"` 포함
- `DocumentStore.getDefaultProps()`: `{ src: "", alt: "Image" }` 반환
- `ElementRenderer`: `<img>` 렌더링 (src 없으면 placeholder 표시)
- `DEFAULT_ELEMENT_STYLE.image`: `{ height: 200, objectFit: "cover" }`
- `jsxExport`: `"image"` → `"img"` 태그 매핑

## 추가할 기능: 파일 업로드

### Toolbar UI

- Toolbar "UI" 드롭다운에 **Image** 항목 추가 (Media 카테고리)
- 클릭 시 숨겨진 `<input type="file" accept="image/*">` 트리거
- 업로드 흐름:
  1. 파일 선택 다이얼로그 열림
  2. `file.size > 5MB` 체크 → 초과 시 alert 표시, 중단
  3. `FileReader.readAsDataURL(file)` 실행
  4. `ADD_ELEMENT_REQUEST { type: "image", props: { src: dataUrl, alt: file.name } }` → Shell 전송

### PropertiesPanel (image 선택 시)

- src: 이미지 미리보기 썸네일 + "변경" 버튼 (파일 재선택)
- alt: 텍스트 입력
- objectFit: select (cover / contain / fill / none)

## 제약 사항

- base64이므로 최대 5MB 파일 크기 제한
- 새로고침 시 소실 (현재 persistence 없으므로 동일)
- children 없음 (void element)

## 수정 파일

| 파일                                                   | 변경 내용                                |
| ------------------------------------------------------ | ---------------------------------------- |
| `apps/editor-shell/src/App.tsx`                        | Image 업로드 메시지 핸들러               |
| `apps/editor-shell/src/components/Toolbar.tsx`         | Image 항목 추가 (Media 카테고리)         |
| `apps/editor-shell/src/components/PropertiesPanel.tsx` | image 속성 UI (src 변경, alt, objectFit) |
