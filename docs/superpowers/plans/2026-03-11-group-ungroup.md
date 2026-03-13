# Group/Ungroup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택한 요소들을 Cmd+G로 그룹 컨테이너로 묶고, Cmd+Shift+G로 해제하는 기능 구현

**Architecture:** Canvas에서 DOM 측정(getBoundingClientRect)으로 bounding box 계산 → GROUP_ELEMENTS_REQUEST에 elementBounds 포함하여 Shell로 전송 → DocumentStore에서 LCA 찾고 그룹 생성 → SYNC_DOCUMENT로 Canvas 반영. Ungroup은 기존 ungroupElements()를 활용하되 KEY_EVENT 대신 UNGROUP_ELEMENTS_REQUEST 메시지로 전환.

**Tech Stack:** MobX, React, postMessage (Shell-Canvas iframe 아키텍처)

---

## Chunk 1: Protocol & Core Logic

### Task 1: Add message types to protocol

**Files:**

- Modify: `packages/editor-core/src/protocol.ts`

- [ ] **Step 1: Add GROUP/UNGROUP_ELEMENTS_REQUEST to CanvasToShellMessage**

기존 `INSERT_SECTION_REQUEST` 항목 뒤에 추가:

```typescript
| { type: "GROUP_ELEMENTS_REQUEST"; payload: { ids: string[]; elementBounds: Record<string, { left: number; top: number; width: number; height: number }> } }
| { type: "UNGROUP_ELEMENTS_REQUEST"; payload: { ids: string[] } }
```

`elementBounds`는 Canvas에서 `getBoundingClientRect()` / zoom으로 계산한 문서 좌표 기준 bounds.

- [ ] **Step 2: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add packages/editor-core/src/protocol.ts
git commit -m "feat(editor-core): add GROUP/UNGROUP_ELEMENTS_REQUEST message types"
```

---

### Task 2: Add groupElements() to DocumentStore

**Files:**

- Modify: `packages/editor-core/src/stores/DocumentStore.ts`

- [ ] **Step 1: Add findLCA helper method**

DocumentStore 클래스에 private 메서드 추가. `ungroupElements()` 메서드 바로 위에 배치:

```typescript
private findLCA(ids: string[]): string | null {
  if (ids.length === 0) return null

  // Build path from each id to root
  const paths: string[][] = []
  for (const id of ids) {
    const path: string[] = []
    let current: string | null = id
    while (current) {
      path.unshift(current)
      const el = this.elements.get(current)
      if (!el) break
      current = el.parentId
    }
    paths.push(path)
  }

  // Find deepest common ancestor
  let lca = this.rootId
  const minLen = Math.min(...paths.map(p => p.length))
  for (let i = 0; i < minLen; i++) {
    const val = paths[0][i]
    if (paths.every(p => p[i] === val)) {
      lca = val
    } else {
      break
    }
  }

  return lca
}
```

- [ ] **Step 2: Add isAncestor helper method**

```typescript
private isAncestor(ancestorId: string, descendantId: string): boolean {
  let current: string | null = descendantId
  while (current) {
    const el = this.elements.get(current)
    if (!el || !el.parentId) return false
    if (el.parentId === ancestorId) return true
    current = el.parentId
  }
  return false
}
```

- [ ] **Step 3: Add groupElements() method**

Canvas에서 DOM 측정한 `elementBounds`를 파라미터로 받는다. `ungroupElements()` 메서드 바로 위에 배치:

```typescript
groupElements(ids: string[], elementBounds: Record<string, { left: number; top: number; width: number; height: number }>): string | null {
  // Filter out root, locked elements
  const validIds = ids.filter(id => {
    const el = this.elements.get(id)
    return el && !el.locked && id !== this.rootId
  })
  if (validIds.length < 2) return null

  // Check: no element should be ancestor of another
  for (const a of validIds) {
    for (const b of validIds) {
      if (a !== b && this.isAncestor(a, b)) return null
    }
  }

  // Find LCA
  const lcaId = this.findLCA(validIds)
  if (!lcaId) return null

  // Calculate bounding box from Canvas-measured element bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const id of validIds) {
    const b = elementBounds[id]
    if (!b) continue
    minX = Math.min(minX, b.left)
    minY = Math.min(minY, b.top)
    maxX = Math.max(maxX, b.left + b.width)
    maxY = Math.max(maxY, b.top + b.height)
  }

  if (!isFinite(minX)) return null

  // Create group container as child of LCA
  const groupId = nanoid()
  const lca = this.elements.get(lcaId)!

  const group: EditorElement = {
    id: groupId,
    type: 'div',
    name: `Group-${groupId.slice(0, 4)}`,
    parentId: lcaId,
    children: [],
    style: {
      position: 'absolute' as const,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    props: {},
    locked: false,
    visible: true,
    layoutMode: 'none' as const,
    layoutProps: { ...DEFAULT_LAYOUT_PROPS },
    sizing: { ...DEFAULT_SIZING },
    canvasPosition: null,
  }
  this.elements.set(groupId, group)

  // Find the earliest index among selected elements in LCA's children
  let insertIndex = lca.children.length
  for (const id of validIds) {
    const el = this.elements.get(id)
    if (el && el.parentId === lcaId) {
      const idx = lca.children.indexOf(id)
      if (idx !== -1 && idx < insertIndex) insertIndex = idx
    }
  }

  // Remove selected elements from their parents and add to group
  for (const id of validIds) {
    const el = this.elements.get(id)
    if (!el) continue

    // Remove from old parent
    const oldParent = el.parentId ? this.elements.get(el.parentId) : undefined
    if (oldParent) {
      oldParent.children = oldParent.children.filter(c => c !== id)
    }

    // Convert coordinates: use Canvas-measured bounds relative to group
    const b = elementBounds[id]
    const left = b ? b.left - minX : 0
    const top = b ? b.top - minY : 0
    el.style = {
      ...el.style,
      position: 'absolute' as const,
      left,
      top,
    }

    el.parentId = groupId
    group.children.push(id)
  }

  // Insert group into LCA's children at the computed position
  lca.children = [
    ...lca.children.slice(0, insertIndex),
    groupId,
    ...lca.children.slice(insertIndex),
  ]

  return groupId
}
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-core build`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add packages/editor-core/src/stores/DocumentStore.ts
git commit -m "feat(editor-core): add groupElements() with LCA and Canvas-measured bounds"
```

---

## Chunk 2: Canvas & Shell Integration

### Task 3: Add Cmd+G / Cmd+Shift+G handlers in Canvas

**Files:**

- Modify: `apps/editor-canvas/src/App.tsx`

- [ ] **Step 1: Add explicit Cmd+G handler in Canvas onKeyDown**

Canvas의 `onKeyDown` 핸들러 (line ~126)에서, 기존 zoom 처리 (`Cmd+=/-/0`) 블록과 `KEY_EVENT` forward 사이에 추가. `e.preventDefault()` + `return`으로 KEY_EVENT 전송을 건너뛴다:

```typescript
// Group: Cmd+G (must come BEFORE generic KEY_EVENT forwarding)
if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.code === "KeyG") {
  e.preventDefault()
  if (selectedIds.length < 2) return

  // Calculate element bounds via DOM measurement
  const z = viewport.zoom
  const elementBounds: Record<string, { left: number; top: number; width: number; height: number }> = {}
  for (const id of selectedIds) {
    const dom = document.querySelector(`[data-element-id="${id}"]`)
    if (!dom) continue
    const rect = dom.getBoundingClientRect()
    // Convert to document coordinates relative to root
    const rootDom = document.querySelector(`[data-element-id="${documentStore.rootId}"]`)
    if (!rootDom) continue
    const rootRect = rootDom.getBoundingClientRect()
    elementBounds[id] = {
      left: (rect.left - rootRect.left) / z,
      top: (rect.top - rootRect.top) / z,
      width: rect.width / z,
      height: rect.height / z,
    }
  }
  bridge.send({
    type: "GROUP_ELEMENTS_REQUEST",
    payload: { ids: selectedIds, elementBounds },
  })
  return
}

// Ungroup: Cmd+Shift+G
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyG") {
  e.preventDefault()
  bridge.send({
    type: "UNGROUP_ELEMENTS_REQUEST",
    payload: { ids: selectedIds },
  })
  return
}
```

**배치 위치:** 기존 `"KeyG"` 포함된 `e.preventDefault()` 블록 (line ~165) 바로 앞. 이 새 코드가 `return`하므로, 기존 KEY_EVENT forward는 실행되지 않는다.

- [ ] **Step 2: Remove KeyG from generic KEY_EVENT forward**

기존 코드 (line ~165):

```typescript
if ((e.metaKey || e.ctrlKey) && ["KeyZ", "KeyC", "KeyV", "KeyD", "KeyG"].includes(e.code)) {
```

`"KeyG"` 제거 (이제 위에서 직접 처리):

```typescript
if ((e.metaKey || e.ctrlKey) && ["KeyZ", "KeyC", "KeyV", "KeyD"].includes(e.code)) {
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-canvas build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add apps/editor-canvas/src/App.tsx
git commit -m "feat(editor-canvas): add Cmd+G/Cmd+Shift+G handlers with DOM bounds calculation"
```

---

### Task 4: Handle GROUP/UNGROUP_ELEMENTS_REQUEST in Shell

**Files:**

- Modify: `apps/editor-shell/src/App.tsx`

- [ ] **Step 1: Add GROUP_ELEMENTS_REQUEST / UNGROUP_ELEMENTS_REQUEST handlers**

Shell의 message handler (line ~68의 switch 블록), 기존 `INSERT_SECTION_REQUEST` case 아래에 추가:

```typescript
case "GROUP_ELEMENTS_REQUEST": {
  const groupId = documentStore.groupElements(msg.payload.ids, msg.payload.elementBounds)
  if (groupId) {
    historyStore.pushSnapshot()
    selectionStore.select(groupId)
    syncToCanvas()
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: [groupId] } })
  }
  break
}
case "UNGROUP_ELEMENTS_REQUEST": {
  const ids = msg.payload.ids.filter(id => {
    const el = documentStore.getElement(id)
    return el && !el.locked && el.id !== documentStore.rootId
  })
  if (ids.length === 0) break
  historyStore.pushSnapshot()
  const newSelection = documentStore.ungroupElements(ids)
  selectionStore.setIds(newSelection)
  syncToCanvas()
  if (newSelection.length > 0) {
    bridge.send({ type: "SELECT_ELEMENT", payload: { ids: newSelection } })
  }
  break
}
```

- [ ] **Step 2: Remove Cmd+Shift+G from KEY_EVENT handler**

기존 KEY_EVENT handler (line ~85):

```typescript
if ((k.metaKey || k.ctrlKey) && k.shiftKey && k.code === "KeyG") handleUngroup()
```

이 줄 삭제. Ungroup은 이제 `UNGROUP_ELEMENTS_REQUEST` 메시지로 처리.

`handleUngroup` 콜백도 삭제 가능하나, Toolbar 버튼에서 사용할 수 있으므로 유지.

- [ ] **Step 3: Verify build**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm --filter @devom/editor-shell build`
Expected: SUCCESS

- [ ] **Step 4: Manual test**

Run: `cd /Users/dabom-choi/StudySource/devom && pnpm dev`

테스트 시나리오:

1. Canvas에서 요소 2개 이상 생성 (Frame + Text 등)
2. Shift+Click으로 다중 선택
3. Cmd+G → 요소들이 Group 컨테이너로 묶임, LeftPanel에 `Group-xxxx` 표시
4. 그룹 선택 후 Cmd+Shift+G → 그룹 해제, 자식 요소들이 원래 레벨로 복원
5. Undo (Cmd+Z) → 그룹 상태로 복원
6. Redo (Cmd+Shift+Z) → 다시 해제
7. flex 컨테이너 안의 요소를 포함하여 그룹핑 → 좌표가 정확한지 확인

- [ ] **Step 5: Commit**

```bash
git add apps/editor-shell/src/App.tsx
git commit -m "feat(editor-shell): handle GROUP/UNGROUP_ELEMENTS_REQUEST messages"
```
