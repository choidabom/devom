# Transitions로 비긴급 업데이트 처리

<BilingualContent>
<template #ko>

## 개요

빈번하지만 긴급하지 않은 상태 업데이트를 transition으로 표시하여 UI 반응성을 유지하세요.

### 영향도

- **우선순위**: MEDIUM
- **성능**: UI 반응성 유지

## 예시

### 잘못된 방식 (스크롤마다 UI 차단)

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
}
```

### 올바른 방식 (논블로킹 업데이트)

```tsx
import { startTransition } from "react"

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => {
      startTransition(() => setScrollY(window.scrollY))
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
}
```

</template>
<template #en>

## Overview

Mark frequent, non-urgent state updates as transitions to maintain UI responsiveness.

### Impact

- **Priority**: MEDIUM
- **Performance**: maintains UI responsiveness

## Examples

### Incorrect (blocks UI on every scroll)

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
}
```

### Correct (non-blocking updates)

```tsx
import { startTransition } from "react"

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => {
      startTransition(() => setScrollY(window.scrollY))
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
}
```

</template>
</BilingualContent>

---

**Tags**: rerender, transitions, startTransition, performance
