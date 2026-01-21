# 사용자 의도 기반 프리로드

<BilingualContent>
<template #ko>

## 개요

무거운 번들을 필요하기 전에 프리로드하여 체감 지연 시간을 줄이세요.

### 영향도

- **우선순위**: MEDIUM
- **성능 영향**: 체감 지연 시간 감소

## 사용 예시

### hover/focus 시 프리로드

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    if (typeof window !== "undefined") {
      void import("./monaco-editor")
    }
  }

  return (
    <button onMouseEnter={preload} onFocus={preload} onClick={onClick}>
      Open Editor
    </button>
  )
}
```

사용자가 버튼에 마우스를 올리면 에디터를 미리 로드합니다. 클릭할 때는 이미 준비되어 있습니다.

### feature flag 활성화 시 프리로드

```tsx
function FlagsProvider({ children, flags }: Props) {
  useEffect(() => {
    if (flags.editorEnabled && typeof window !== "undefined") {
      void import("./monaco-editor").then((mod) => mod.init())
    }
  }, [flags.editorEnabled])

  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
}
```

## 핵심 포인트

- **사용자 의도 파악**: hover, focus 등의 신호 활용
- **타이밍**: 실제 사용 전에 로드 시작
- **SSR 최적화**: `typeof window !== 'undefined'` 체크 필수
- **void**: Promise를 무시하여 fire-and-forget 패턴

## 프리로드 트리거

- **onMouseEnter**: 마우스 hover
- **onFocus**: 키보드 포커스
- **feature flag**: 기능 활성화
- **route change**: 다음 페이지 예상
- **idle time**: 브라우저 유휴 시간

## 주의사항

- 프리로드가 너무 공격적이면 불필요한 대역폭 사용
- 모바일에서는 hover가 없으므로 다른 신호 필요
- 네트워크 상태 고려 (slow 3G 등)

## 체감 성능 개선

사용자가 버튼을 클릭하면:

- **프리로드 없이**: 로딩 표시 → 대기 → 콘텐츠
- **프리로드 사용**: 즉시 콘텐츠 표시

</template>
<template #en>

## Overview

Preload heavy bundles before they're needed to reduce perceived latency.

### Impact

- **Priority**: MEDIUM
- **Performance**: reduces perceived latency

## Usage Examples

### Preload on hover/focus

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    if (typeof window !== "undefined") {
      void import("./monaco-editor")
    }
  }

  return (
    <button onMouseEnter={preload} onFocus={preload} onClick={onClick}>
      Open Editor
    </button>
  )
}
```

When user hovers over the button, the editor preloads. By click time, it's already ready.

### Preload when feature flag enabled

```tsx
function FlagsProvider({ children, flags }: Props) {
  useEffect(() => {
    if (flags.editorEnabled && typeof window !== "undefined") {
      void import("./monaco-editor").then((mod) => mod.init())
    }
  }, [flags.editorEnabled])

  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
}
```

## Key Points

- **Detect user intent**: Leverage signals like hover, focus
- **Timing**: Start loading before actual use
- **SSR optimization**: `typeof window !== 'undefined'` check required
- **void**: Ignore Promise for fire-and-forget pattern

## Preload Triggers

- **onMouseEnter**: Mouse hover
- **onFocus**: Keyboard focus
- **feature flag**: Feature activation
- **route change**: Anticipate next page
- **idle time**: Browser idle time

## Cautions

- Too aggressive preloading wastes bandwidth
- Mobile has no hover, need alternative signals
- Consider network conditions (slow 3G, etc.)

## Perceived Performance Improvement

When user clicks button:

- **Without preload**: Loading indicator → wait → content
- **With preload**: Instant content display

</template>
</BilingualContent>

---

**Tags**: bundle, preload, user-intent, hover
