# Left Panel Chat Split Design

## 개요

좌측 패널을 Layers + Chat 두 개의 독립 패널로 세로 분할한다. Chat은 향후 AI 연동(구조 탐색 + 컴포넌트 조작)을 위한 영역 확보가 목적이며, 현재는 UI 껍데기만 구현한다.

## 배경

레이어 패널이 디자이너 이외의 사용자(PM, 개발자, 비기술 직군)에게 직관적이지 않다는 피드백이 있었다. 레이어 UI 자체를 개선하는 대신, Chat 영역을 추가하여 자연어로 구조를 이해하고 조작할 수 있는 경로를 만든다.

## 레이아웃 구조

```
┌─────────────────────┐
│   Layers            │  ← 독립 패널 (border + radius + shadow)
│   (기존 LayerTree)  │
│                     │
└─────────────────────┘
        8px gap           ← 드래그 가능 (row-resize 커서)
┌─────────────────────┐
│   Chat              │  ← 독립 패널 (동일 스타일)
│   (placeholder)     │
│   [입력창]          │
└─────────────────────┘
```

- 두 패널은 **분리된 독립 카드**로 렌더링 (각각 border, borderRadius, boxShadow 적용)
- 패널 사이 **8px gap**이 스플리터 역할
- Shell 전체 레이아웃 (LeftPanel 외부 크기)은 변경 없음

## 스플리터 동작

### DOM 구조

LeftPanel 최상위를 `flex-direction: column`으로 변경:

```tsx
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
  <div style={{ height: layersHeight }}>  {/* Layers 패널 */}
  <div style={{ height: 8, cursor: 'row-resize' }}>  {/* Splitter (투명 핸들) */}
  <div style={{ flex: 1 }}>  {/* Chat 패널 */}
</div>
```

### 상태 관리

```tsx
const containerRef = useRef<HTMLDivElement>(null)
const [layersHeight, setLayersHeight] = useState(0)

useEffect(() => {
  if (!containerRef.current) return
  const totalHeight = containerRef.current.clientHeight
  setLayersHeight((totalHeight - 8) * 0.6)
}, [])
```

- `containerRef` — 최상위 flex 컨테이너에 부착, 전체 높이 측정용
- `layersHeight` — Layers 패널의 **픽셀 높이** (Chat은 `flex: 1`로 나머지 차지)
- 초기값: `(totalHeight - 8) * 0.6` (8px = splitter 높이)
- 세션 간 persist 하지 않음 (localStorage 불필요)

### 드래그 동작

- `setPointerCapture` + `pointermove`/`pointerup` 패턴 (기존 ExportPanel과 동일)
- `pointermove`에서 실시간 clamp: `Math.max(100, Math.min(containerHeight - 108, newHeight))`
  - 108 = Chat 최소 100px + splitter 8px
- 최소 높이: Layers 100px, Chat 100px
- Splitter hover: `background: T.hover`, active(드래그 중): `background: T.accent` + opacity 0.3
- `pointercancel` 핸들링 포함

### 키보드 접근성

- Chat 입력창 포커스 시 일반 키 이벤트 `stopPropagation` (에디터 단축키 충돌 방지, 기존 Canvas input 패턴과 동일)

## ChatPanel 구성

```
┌─────────────────────┐
│ Chat                │  ← 헤더 (Layers와 동일 스타일)
├─────────────────────┤
│                     │
│  "Ask anything      │  ← 빈 메시지 영역 (flex:1, overflowY:auto)
│   about your        │     중앙 정렬 placeholder 텍스트
│   design"           │
│                     │
├─────────────────────┤
│ [메시지 입력...]  ➤ │  ← 하단 고정 입력창 + send 버튼
└─────────────────────┘
```

### 헤더

- "Chat" 텍스트
- 기존 Layers 헤더와 동일 스타일: `padding: 14px 16px 10px`, `fontSize: 13`, `fontWeight: 600`

### 메시지 영역

- 비어있는 상태, 중앙에 안내 텍스트 "Ask anything about your design"
- `flex: 1`, `overflowY: auto`, flex centering (수직+수평 중앙)
- 텍스트 스타일: `fontSize: 13`, `color: T.textMuted`

### 입력창

- 하단 고정, `padding: 8px`
- `<input type="text">` — border, borderRadius 적용, 배경 `T.panel`
- Send 버튼: Lucide `Send` 아이콘 (기존 Toolbar 아이콘 패턴과 동일)
- Enter 키로 전송, `stopPropagation`으로 에디터 단축키 충돌 방지
- 현재는 전송 시 동작 없음 (입력값 클리어만)

## 변경 파일

| 파일                                             | 변경 내용                                                    |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `apps/editor-shell/src/components/LeftPanel.tsx` | 최상위 레이아웃 분할, 스플리터 로직, ChatPanel 컴포넌트 추가 |

## 변경하지 않는 것

- Shell 전체 레이아웃 (LeftPanel 외부 크기)
- LayerTree 컴포넌트 내부 로직
- Canvas, 메시지 프로토콜 등 다른 영역

## 향후 확장

- AI 백엔드 연동 시 ChatPanel에 메시지 표시/전송 기능 추가
- 구조 탐색: "Header 안에 뭐가 있어?", "이 버튼은 어디에 속해?"
- 컴포넌트 조작: "로그인 폼 만들어줘", "이 카드 색상 바꿔줘"
