# Left Panel Chat Split Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LeftPanel을 Layers + Chat 두 개의 독립 패널로 세로 분할하고, 리사이즈 가능한 스플리터를 추가한다.

**Architecture:** 기존 `LeftPanel` 컴포넌트의 최상위 레이아웃을 flex column으로 변경하여 Layers 패널, Splitter, ChatPanel 3개 영역으로 분할. 스플리터는 기존 `App.tsx`의 `setPointerCapture` 패턴을 세로 방향으로 적용. ChatPanel은 UI 껍데기만 구현 (AI 연동 없음).

**Tech Stack:** React 19, MobX, Lucide React, 기존 테마 시스템 (T)

**Spec:** `docs/superpowers/specs/2026-03-16-left-panel-chat-split-design.md`

---

## Chunk 1: Layout Split + Splitter + ChatPanel

### Task 1: LeftPanel 레이아웃을 Layers + Splitter + Chat으로 분할

**Files:**
- Modify: `apps/editor-shell/src/components/LeftPanel.tsx:1-5` (imports)
- Modify: `apps/editor-shell/src/components/LeftPanel.tsx:36-222` (LeftPanel 컴포넌트)

- [ ] **Step 1: import에 Send 아이콘 추가**

```tsx
// 기존 lucide-react import에 Send 추가
import { Lock, Unlock, Square, Columns3, Type, LayoutGrid, ImageIcon, MousePointerClick, TextCursorInput, ChevronRight, LayoutList, Send } from "lucide-react"
```

- [ ] **Step 2: LeftPanel 컴포넌트에 containerRef와 layersHeight 상태 추가**

`LeftPanel` 함수 내부, 기존 state 선언 아래에 추가:

```tsx
const containerRef = useRef<HTMLDivElement>(null)
const [layersHeight, setLayersHeight] = useState(0)
const [isDraggingSplitter, setIsDraggingSplitter] = useState(false)

useEffect(() => {
  if (!containerRef.current) return
  const totalHeight = containerRef.current.clientHeight
  setLayersHeight((totalHeight - 8) * 0.6)
}, [])
```

- [ ] **Step 3: LeftPanel의 return JSX를 Layers + Splitter + Chat 구조로 변경**

기존 `return (...)` 전체를 다음으로 교체:

```tsx
return (
  <div
    ref={containerRef}
    style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 0,
    }}
  >
    {/* Layers Panel */}
    <div
      style={{
        height: layersHeight || "60%",
        background: T.panel,
        borderRadius: T.panelRadius,
        boxShadow: T.panelShadow,
        border: `1px solid ${T.panelBorder}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "14px 16px 10px", fontSize: 13, fontWeight: 600, color: T.text }}>Layers</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 8px" }}>
        <LayerTree
          elementId={documentStore.rootId}
          depth={0}
          collapsedIds={collapsedIds}
          onToggleCollapse={toggleCollapse}
          drag={drag}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>

    {/* Splitter */}
    <div
      style={{
        height: 8,
        cursor: "row-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        setIsDraggingSplitter(true)
        const startY = e.clientY
        const startH = layersHeight
        const containerH = containerRef.current?.clientHeight ?? 0
        const handle = e.currentTarget as HTMLElement
        handle.style.background = `${T.accent}4d`

        const onMove = (ev: PointerEvent) => {
          const newHeight = startH + ev.clientY - startY
          setLayersHeight(Math.max(100, Math.min(containerH - 108, newHeight)))
        }
        const onUp = () => {
          handle.style.background = ""
          setIsDraggingSplitter(false)
          handle.removeEventListener("pointermove", onMove)
          handle.removeEventListener("pointerup", onUp)
          handle.removeEventListener("pointercancel", onUp)
        }
        handle.addEventListener("pointermove", onMove)
        handle.addEventListener("pointerup", onUp)
        handle.addEventListener("pointercancel", onUp)
      }}
      onPointerEnter={(e) => {
        if (!isDraggingSplitter) (e.currentTarget as HTMLElement).style.background = T.hover
      }}
      onPointerLeave={(e) => {
        if (!isDraggingSplitter) (e.currentTarget as HTMLElement).style.background = ""
      }}
    />

    {/* Chat Panel */}
    <ChatPanel />
  </div>
)
```

- [ ] **Step 4: ChatPanel 컴포넌트 작성**

`LeftPanel.tsx` 파일 하단 (`LayerTree` 컴포넌트 아래)에 추가:

```tsx
function ChatPanel() {
  const [input, setInput] = useState("")

  return (
    <div
      style={{
        flex: 1,
        background: T.panel,
        borderRadius: T.panelRadius,
        boxShadow: T.panelShadow,
        border: `1px solid ${T.panelBorder}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", fontSize: 13, fontWeight: 600, color: T.text }}>Chat</div>

      {/* Message area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
        }}
      >
        <span style={{ fontSize: 13, color: T.textMuted }}>Ask anything about your design</span>
      </div>

      {/* Input area */}
      <div style={{ padding: 8, display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter" && input.trim()) {
              setInput("")
            }
          }}
          placeholder="Message..."
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: 13,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 8,
            background: T.inputBg,
            color: T.text,
            outline: "none",
          }}
        />
        <button
          onClick={() => {
            if (input.trim()) setInput("")
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            border: "none",
            borderRadius: 8,
            background: input.trim() ? T.accent : T.inputBg,
            color: input.trim() ? "#fff" : T.textMuted,
            cursor: input.trim() ? "pointer" : "default",
            transition: "background 0.15s, color 0.15s",
            flexShrink: 0,
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 개발 서버에서 확인**

Run: `pnpm dev` (이미 실행 중이면 브라우저에서 HMR 확인)

확인 항목:
1. Layers 패널과 Chat 패널이 독립 카드 스타일로 세로 분할됨
2. 8px gap이 두 패널 사이에 보임
3. gap에 마우스 올리면 `row-resize` 커서 표시
4. 드래그로 비율 조절 가능, 최소 100px 제한 동작
5. ChatPanel에 "Chat" 헤더, placeholder 텍스트, 입력창 표시
6. 입력창에 텍스트 입력 시 에디터 단축키 간섭 없음
7. Enter 입력 시 입력값 클리어
8. Send 버튼이 입력값 유무에 따라 색상 변경

- [ ] **Step 6: 커밋**

```bash
git add apps/editor-shell/src/components/LeftPanel.tsx
git commit -m "feat(editor): split left panel into Layers and Chat with resizable splitter"
```
