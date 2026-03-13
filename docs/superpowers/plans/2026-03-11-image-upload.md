# Image Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 image 타입에 로컬 파일 업로드 기능을 추가하여 Toolbar에서 이미지를 선택하고, PropertiesPanel에서 속성을 편집할 수 있게 한다

**Architecture:** Toolbar의 Image 버튼 클릭 시 file input 트리거 → FileReader로 base64 변환 → handleAddElement로 Shell에서 처리. PropertiesPanel에 image 전용 속성 UI 추가.

**Tech Stack:** React, FileReader API, MobX, postMessage

---

## Chunk 1: Toolbar Image Upload

### Task 1: Add file upload to Toolbar Image button

**Files:**
- Modify: `apps/editor-shell/src/components/Toolbar.tsx`
- Modify: `apps/editor-shell/src/App.tsx`
- Modify: `packages/editor-core/src/stores/DocumentStore.ts`

- [ ] **Step 1: Update DocumentStore.addElement to accept initial props**

`packages/editor-core/src/stores/DocumentStore.ts`의 `addElement` (line 253):

```typescript
// 기존 시그니처
addElement(type: ElementType, parentId?: string): string

// 변경
addElement(type: ElementType, parentId?: string, initialProps?: Record<string, unknown>): string
```

메서드 내부에서 props 생성 라인 (line ~266):
```typescript
// 기존
props: this.getDefaultProps(type),

// 변경
props: { ...this.getDefaultProps(type), ...(initialProps ?? {}) },
```

리턴 타입은 `string` 유지 (null이 아님).

- [ ] **Step 2: Update Shell App's handleAddElement to accept props**

`apps/editor-shell/src/App.tsx`의 `handleAddElement` (line ~134):

```typescript
// 기존
const handleAddElement = useCallback((type: ElementType) => {
  historyStore.pushSnapshot()
  const id = documentStore.addElement(type)
  if (id) {
    selectionStore.select(id)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [id] } })
  }
}, [syncToCanvas])

// 변경
const handleAddElement = useCallback((type: ElementType, props?: Record<string, unknown>) => {
  historyStore.pushSnapshot()
  const id = documentStore.addElement(type, undefined, props)
  if (id) {
    selectionStore.select(id)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [id] } })
  }
}, [syncToCanvas])
```

- [ ] **Step 3: Add hidden file input ref and handler to Toolbar**

Toolbar 컴포넌트 내부, 기존 state 선언들 아래에 추가. `useRef`, `useCallback` import 확인 (없으면 추가):

```typescript
const fileInputRef = useRef<HTMLInputElement>(null)

const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    alert('Image file size must be under 5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    onAdd("image", { src: dataUrl, alt: file.name })
  }
  reader.readAsDataURL(file)

  // Reset input so same file can be re-selected
  e.target.value = ''
}, [onAdd])
```

- [ ] **Step 4: Update onAdd prop type and Image button**

Toolbar의 `onAdd` prop 타입 수정 (line ~25):
```typescript
// 기존
onAdd: (type: ElementType) => void

// 변경
onAdd: (type: ElementType, props?: Record<string, unknown>) => void
```

기존 Image 버튼 (line ~99):
```typescript
// 기존
<ToolBtn icon={<ImageIcon size={S} />} title="Image" onClick={() => onAdd("image")} />

// 변경
<ToolBtn icon={<ImageIcon size={S} />} title="Image" onClick={() => fileInputRef.current?.click()} />
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  style={{ display: 'none' }}
  onChange={handleImageUpload}
/>
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build && pnpm --filter @devom/editor-shell build`
Expected: SUCCESS

- [ ] **Step 6: Manual test**

Run: `pnpm dev`

테스트:
1. Toolbar의 Image 아이콘 클릭 → 파일 선택 다이얼로그 열림
2. 이미지 파일 선택 → Canvas에 이미지 요소 추가됨 (200x200, 이미지 표시)
3. 5MB 초과 파일 선택 → alert 표시, 요소 추가 안 됨
4. 같은 파일 다시 선택 → 정상 동작 (input reset)

- [ ] **Step 7: Commit**

```bash
git add packages/editor-core/src/stores/DocumentStore.ts apps/editor-shell/src/App.tsx apps/editor-shell/src/components/Toolbar.tsx
git commit -m "feat(editor): add image file upload via Toolbar"
```

---

## Chunk 2: PropertiesPanel Image UI

### Task 2: Add image properties to PropertiesPanel

**Files:**
- Modify: `apps/editor-shell/src/components/PropertiesPanel.tsx`

- [ ] **Step 1: Read current PropertiesPanel structure**

먼저 `PropertiesPanel.tsx`를 읽어서 기존 패턴 확인. 핵심 콜백:
- `updateStyle(key: string, value: string)` — line 15, `historyStore.pushSnapshot()` + 선택된 모든 요소에 스타일 적용
- `updateProp(key: string, value: string)` — line 24, `historyStore.pushSnapshot()` + 선택된 모든 요소에 props 적용

이 함수들은 element ID를 받지 않고, `selectionStore.selectedElements` 전체에 적용한다.

- [ ] **Step 2: Add image section to PropertiesPanel**

단일 요소 선택 && `type === "image"` 일 때 표시되는 섹션 추가. 기존 props 섹션 패턴과 동일한 위치에 배치:

```typescript
{/* Image Properties */}
{!isMulti && element.type === "image" && (() => {
  const src = String(element.props.src ?? '')
  const alt = String(element.props.alt ?? '')
  const objectFit = String(element.style.objectFit ?? 'cover')

  return (
    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.panelBorder}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Image</div>

      {/* Thumbnail preview */}
      {src && (
        <div style={{ marginBottom: 8, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.panelBorder}` }}>
          <img src={src} alt={alt} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Change image button */}
      <button
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) {
              alert('Image file size must be under 5MB')
              return
            }
            const reader = new FileReader()
            reader.onload = () => {
              updateProp('src', reader.result as string)
            }
            reader.readAsDataURL(file)
          }
          input.click()
        }}
        style={{
          width: '100%', padding: '4px 8px', fontSize: 11, border: `1px solid ${T.panelBorder}`,
          borderRadius: 4, background: T.panel, cursor: 'pointer', marginBottom: 8,
        }}
      >
        Change Image
      </button>

      {/* Alt text */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Alt Text</div>
        <input
          value={alt}
          onChange={e => updateProp('alt', e.target.value)}
          style={{
            width: '100%', padding: '4px 6px', fontSize: 11, border: `1px solid ${T.panelBorder}`,
            borderRadius: 4, background: T.bg, color: T.text, boxSizing: 'border-box',
          }}
          placeholder="Describe the image"
        />
      </div>

      {/* Object Fit */}
      <div>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Object Fit</div>
        <select
          value={objectFit}
          onChange={e => updateStyle('objectFit', e.target.value)}
          style={{
            width: '100%', padding: '4px 6px', fontSize: 11, border: `1px solid ${T.panelBorder}`,
            borderRadius: 4, background: T.bg, color: T.text,
          }}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
  )
})()}
```

**주의:** `updateProp('src', ...)`, `updateProp('alt', ...)`, `updateStyle('objectFit', ...)` 사용 — element ID 불필요 (함수 내부에서 선택된 요소 전체에 적용).

- [ ] **Step 3: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-shell build`
Expected: SUCCESS

- [ ] **Step 4: Manual test**

테스트:
1. 이미지 요소 선택 → PropertiesPanel에 썸네일, Change Image 버튼, Alt, Object Fit 표시
2. "Change Image" 클릭 → 파일 선택 → 이미지 교체
3. Alt text 수정 → props 업데이트 (export 시 alt 반영 확인)
4. Object Fit 변경 → 이미지 표시 방식 변경

- [ ] **Step 5: Commit**

```bash
git add apps/editor-shell/src/components/PropertiesPanel.tsx
git commit -m "feat(editor-shell): add image properties UI to PropertiesPanel"
```
