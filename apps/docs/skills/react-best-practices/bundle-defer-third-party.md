# 비필수 서드파티 라이브러리 지연 로딩

<BilingualContent>
<template #ko>

## 개요

애널리틱스, 로깅, 에러 트래킹은 사용자 인터랙션을 차단하지 않습니다. 하이드레이션 이후에 로딩하세요.

### 영향도

- **우선순위**: MEDIUM
- **성능 영향**: 하이드레이션 후 로딩

## 문제점

애널리틱스나 로깅 같은 도구는 사용자와 직접 상호작용하지 않지만, 일반 import로 불러오면 초기 번들에 포함되어 로딩 시간을 증가시킵니다.

### 잘못된 예시 (초기 번들에 포함)

```tsx
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 올바른 예시 (하이드레이션 후 로딩)

```tsx
import dynamic from "next/dynamic"

const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), { ssr: false })

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 핵심 포인트

- 비필수 서드파티 라이브러리는 동적 임포트로 지연
- `{ ssr: false }` 옵션으로 서버 렌더링 제외
- 사용자 경험에 즉시 영향을 주지 않는 도구에 적용
- 초기 번들 크기 감소

## 적용 대상

- 애널리틱스 도구 (Google Analytics, Vercel Analytics 등)
- 에러 트래킹 (Sentry, Rollbar 등)
- 로깅 서비스
- A/B 테스팅 도구
- 채팅 위젯

## 주의사항

필수 기능(예: 인증, 결제)은 지연 로딩하지 마세요. 사용자 경험을 해칠 수 있습니다.

</template>
<template #en>

## Overview

Analytics, logging, and error tracking don't block user interaction. Load them after hydration.

### Impact

- **Priority**: MEDIUM
- **Performance**: loads after hydration

## Problem

Tools like analytics or logging don't directly interact with users, but when loaded with regular imports, they're included in the initial bundle and increase load time.

### Incorrect (blocks initial bundle)

```tsx
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Correct (loads after hydration)

```tsx
import dynamic from "next/dynamic"

const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), { ssr: false })

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Key Points

- Defer non-essential third-party libraries with dynamic imports
- Exclude from server rendering with `{ ssr: false }`
- Apply to tools that don't immediately affect user experience
- Reduces initial bundle size

## Common Use Cases

- Analytics tools (Google Analytics, Vercel Analytics, etc.)
- Error tracking (Sentry, Rollbar, etc.)
- Logging services
- A/B testing tools
- Chat widgets

## Caution

Don't defer critical features (e.g., authentication, payments). It may harm user experience.

</template>
</BilingualContent>

---

**Tags**: bundle, third-party, analytics, defer
