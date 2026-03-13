# React DOM 에디터: 암묵지와 프로젝트 구성 과정

## 1. 왜 Canvas API가 아닌 React DOM인가?

### 일반적인 오해

대부분의 디자인 에디터(Figma, Excalidraw 등)는 Canvas API나 WebGL을 사용한다.
"에디터 = Canvas"라는 공식이 당연하게 여겨지지만, **목적에 따라 DOM이 더 나은 선택**이다.

### Canvas vs DOM 트레이드오프

| 관점 | Canvas API | React DOM |
|------|-----------|-----------|
| 렌더링 성능 | 수만 개 요소에 유리 | 수천 개까지 실용적 |
| 텍스트 렌더링 | 직접 구현 필요 (줄바꿈, 커서 등) | 브라우저가 처리 |
| 이벤트 처리 | hitTest 직접 구현 | DOM 이벤트 자연스럽게 사용 |
| 접근성 | 별도 구현 필요 | 기본 제공 |
| CSS 호환 | 없음 (직접 그리기) | **그대로 적용** |
| 결과물 = 코드 | 변환 과정 필요 | **디자인 = 실제 코드** |

데우스가 DOM을 선택한 핵심 이유: **디자인한 것이 곧 실제 제품 코드**가 되어야 하기 때문이다.
Canvas로 그린 사각형은 CSS `div`와 다르지만, DOM으로 만든 `div`는 그 자체가 코드다.

## 2. Cross-Origin Isolation: 단순 iframe으로는 안 된다

### 브라우저의 프로세스 모델

이 부분이 데우스 개발에서 가장 중요한 발견 중 하나였다.

```
같은 사이트 (Same-Site):
  shell.editor.com + canvas.editor.com
  → 브라우저가 같은 프로세스에 배치할 수 있음
  → 메인 스레드 공유 → 성능 격리 실패

다른 사이트 (Cross-Site):
  editor-shell.com + editor-canvas.io
  → 브라우저가 반드시 다른 프로세스에 배치
  → 메인 스레드 완전 독립 → 진정한 성능 격리
```

### Same-Site vs Cross-Site 판단 기준

브라우저는 **eTLD+1** (effective Top-Level Domain + 1) 기준으로 판단한다:

```
editor.example.com  → eTLD+1 = example.com
canvas.example.com  → eTLD+1 = example.com
→ Same-Site! 같은 프로세스 가능

editor.example.com  → eTLD+1 = example.com
canvas.example.io   → eTLD+1 = example.io
→ Cross-Site! 반드시 다른 프로세스
```

### 개발 환경에서의 구현

localhost에서는 포트가 달라도 Same-Site다:
```
localhost:4000 + localhost:4001 → Same-Site (localhost)
```

개발 중 진정한 격리를 테스트하려면:
- `/etc/hosts`에 서로 다른 도메인 매핑
- 또는 `127.0.0.1 shell.editor.local` + `127.0.0.1 canvas.editor.test`

**다만 MVP 단계에서는 same-origin iframe으로 시작해도 무방하다.**
성능 격리는 요소가 수백 개 이상일 때 체감되므로, 기능 개발이 우선이다.

### COOP/COEP 헤더

Cross-Origin Isolation을 활성화하려면 HTTP 헤더도 설정해야 한다:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

이 헤더가 설정되면 `SharedArrayBuffer` 같은 고성능 API도 사용 가능해진다.

## 3. MobX Fine-Grained Reactivity: React만으로는 왜 안 되는가

### React의 기본 리렌더링 모델

React는 **컴포넌트 단위**로 리렌더한다:

```tsx
// 문제: element[42].style.width만 바꿨는데
// 모든 요소가 리렌더될 수 있음

function Canvas({ elements }) {
  return elements.map(el => <Element key={el.id} data={el} />)
}

// setState로 elements 배열 참조가 바뀌면
// React는 모든 <Element>에 대해 reconciliation 수행
```

`React.memo`와 `useMemo`로 최적화할 수 있지만, 에디터처럼
실시간으로 수많은 속성이 변하는 환경에서는 개발자가 수동으로
모든 의존성을 관리해야 하는 인지 부하가 크다.

### MobX의 자동 추적

```tsx
// MobX는 "어떤 observable을 읽었는가"를 자동 추적한다
const ElementRenderer = observer(({ id }) => {
  const store = useDocumentStore()
  const el = store.elements.get(id)

  // MobX가 추적:
  // - store.elements.get(id) → 이 id의 요소 존재 여부
  // - el.style → 이 요소의 스타일 객체
  // - el.children → 이 요소의 자식 목록

  // el.style.width가 바뀌면 → 이 컴포넌트만 리렌더
  // 다른 요소의 style이 바뀌면 → 이 컴포넌트는 무시

  return <div style={el.style}>...</div>
})
```

이것이 "Fine-Grained Reactivity"의 핵심이다.
SolidJS의 Signal, Svelte의 반응성과 유사한 개념을
React 안에서 MobX로 달성하는 것이다.

### MobX가 "올드하다"는 인식에 대해

최근 프론트엔드에서 MobX는 주류에서 밀렸다.
Zustand, Jotai, Redux Toolkit이 더 많이 쓰인다.
하지만 **에디터/CAD/게임 같은 고빈도 상태 변경 도메인**에서는
MobX의 Proxy 기반 자동 추적이 여전히 최고의 선택이다.

일반 웹앱: 사용자 인터랙션 → API 호출 → 상태 변경 (초당 1-2회)
에디터: 마우스 드래그 → 위치/크기 변경 (초당 60회, 매 프레임)

후자에서는 MobX의 fine-grained 업데이트가 압도적으로 유리하다.

## 4. postMessage 통신의 함정들

### 직렬화 비용

`postMessage`는 데이터를 **구조화된 복제(Structured Clone)**로 전달한다.
이는 JSON.stringify/parse보다 빠르지만, 여전히 비용이 있다.

```typescript
// ❌ 나쁜 예: 매 프레임마다 전체 문서를 전송
onDrag(({ x, y }) => {
  postMessage({ type: 'UPDATE', payload: entireDocument })
})

// ✅ 좋은 예: 변경된 속성만 전송 (delta)
onDrag(({ x, y }) => {
  postMessage({
    type: 'ELEMENT_MOVED',
    payload: { id: 'el-42', x, y }  // 최소 데이터
  })
})
```

### 드래그 중 동기화 전략

드래그는 매 프레임(16ms) 발생한다. 이때의 전략:

1. **캔버스에서 즉시 반영** (낙관적 업데이트): 드래그 중에는 캔버스가 자체적으로 위치 업데이트
2. **쉘에는 throttle**: 속성 패널의 x, y 값은 100ms 간격으로 업데이트
3. **드래그 끝에 확정**: `pointerup` 시 최종 위치를 쉘로 전송, 히스토리에 기록

```
드래그 시작 → 캔버스: 매 프레임 위치 업데이트 (로컬)
           → 쉘: 100ms마다 속성 패널 갱신 (throttled)
드래그 끝   → 쉘: 최종 위치 확정, undo 스택에 push
```

## 5. Flat Map 구조의 이유

### 중첩 트리 vs Flat Map

```typescript
// ❌ 중첩 트리 - 깊은 요소 접근이 O(n), 이동이 복잡
const tree = {
  id: 'root',
  children: [{
    id: 'flex',
    children: [{
      id: 'button1',  // 이걸 찾으려면 트리 순회 필요
      children: []
    }]
  }]
}

// ✅ Flat Map - 임의 접근 O(1), 이동은 배열 splice
const elements = new Map([
  ['root', { id: 'root', parentId: null, children: ['flex'] }],
  ['flex', { id: 'flex', parentId: 'root', children: ['button1'] }],
  ['button1', { id: 'button1', parentId: 'flex', children: [] }],
])

// button1을 root로 이동:
// 1. flex.children에서 'button1' 제거
// 2. root.children에 'button1' 추가
// 3. button1.parentId를 'root'로 변경
```

이 패턴은 Figma, Framer 등 대부분의 에디터가 내부적으로 사용하는 방식이다.
DB의 adjacency list 패턴과 동일한 원리다.

## 6. Undo/Redo 구현 전략

### Snapshot vs Command 패턴

| 방식 | 장점 | 단점 |
|------|------|------|
| Snapshot (전체 상태 저장) | 구현 간단, 버그 적음 | 메모리 사용 큼 |
| Command (변경 명령 저장) | 메모리 효율적 | 역연산 정의 필요, 복잡 |

**MVP에서는 Snapshot 방식을 추천한다.**

```typescript
class HistoryStore {
  undoStack: EditorDocument[] = []
  redoStack: EditorDocument[] = []

  pushSnapshot(doc: EditorDocument) {
    this.undoStack.push(structuredClone(doc))
    this.redoStack = []  // redo 초기화
  }

  undo() {
    const prev = this.undoStack.pop()
    if (prev) {
      this.redoStack.push(currentDoc)
      restore(prev)
    }
  }
}
```

성능 이슈가 생기면 나중에 Immer의 patch나 Command 패턴으로 전환한다.

## 7. 프로젝트 구성 과정 (의사결정 흐름)

### Step 1: 편집 대상 결정

"무엇을 편집하는가?"가 에디터의 모든 결정을 좌우한다.

- 이미지/그래픽 → Canvas API/WebGL 필수
- UI 레이아웃 → **DOM 기반이 최적** (CSS 호환, 코드 = 디자인)
- 문서/콘텐츠 → ContentEditable 또는 블록 에디터

→ **UI 컴포넌트 레이아웃** 선택 → DOM 기반 확정

### Step 2: 아키텍처 선택

성능 격리가 필요한가?

- 요소 100개 이하 → 단일 프로세스로 충분
- 수천 개 요소 → 쉘-캔버스 분리 필요
- 학습/도전 목적 → **쉘-캔버스 분리** 선택

→ 데우스 방식의 cross-origin isolation 적용

### Step 3: 상태 관리 선택

에디터에 필요한 상태 관리 특성:

1. 속성 단위 세밀한 업데이트 (fine-grained)
2. 초당 60회 위치 변경에 대응
3. 프로세스 간 동기화 가능한 구조

→ MobX 선택 (React 생태계에서 유일한 진정한 fine-grained reactivity)

### Step 4: 데이터 모델 설계

편집기의 데이터 모델은 DB 스키마와 같다. 한번 정하면 바꾸기 어렵다.

- Flat Map: 성능과 조작 용이성
- CSSProperties 직접 사용: 변환 레이어 없이 바로 렌더링
- parentId + children 양방향: 트리 순회와 부모 탐색 모두 O(1)

### Step 5: 빌드 도구 및 패키지 구조

- 쉘/캔버스 모두 SPA → Vite 선택 (Next.js의 SSR 불필요)
- 공유 코어를 별도 패키지로 → 타입 안정성 + 빌드 독립성
- pnpm workspace + catalog → 의존성 버전 통일

### Step 6: MVP 범위 확정

"무엇을 만들지" 못지않게 "무엇을 안 만들지"가 중요하다.

MVP에 포함:
- 요소 배치, 스타일 편집, 계층 구조, 내보내기, undo/redo

MVP에서 제외 (추후):
- 실시간 협업 (CRDT/OT)
- 컴포넌트 라이브러리 연동
- AI 기반 레이아웃 제안
- 프로토타이핑 (인터랙션 정의)
- 스트리밍 파싱 (대규모 문서)
