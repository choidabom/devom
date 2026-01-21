# after()로 논블로킹 작업 처리

<BilingualContent>
<template #ko>

## 개요

Next.js의 `after()`를 사용하여 응답을 보낸 후 실행할 작업을 예약하세요. 로깅, 애널리틱스 등의 부수 효과가 응답을 차단하지 않습니다.

### 영향도

- **우선순위**: MEDIUM
- **성능 영향**: 더 빠른 응답 시간

## 문제점

로깅이나 애널리틱스 같은 부수 효과를 await하면 응답이 지연됩니다.

### 잘못된 예시 (응답 차단)

```tsx
import { logUserAction } from "@/app/utils"

export async function POST(request: Request) {
  // 변경 수행
  await updateDatabase(request)

  // 로깅이 응답을 차단
  const userAgent = request.headers.get("user-agent") || "unknown"
  await logUserAction({ userAgent })

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
```

### 올바른 예시 (논블로킹)

```tsx
import { after } from "next/server"
import { headers, cookies } from "next/headers"
import { logUserAction } from "@/app/utils"

export async function POST(request: Request) {
  // 변경 수행
  await updateDatabase(request)

  // 응답 전송 후 로깅
  after(async () => {
    const userAgent = (await headers()).get("user-agent") || "unknown"
    const sessionCookie = (await cookies()).get("session-id")?.value || "anonymous"

    logUserAction({ sessionCookie, userAgent })
  })

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
```

응답이 즉시 전송되고 로깅은 백그라운드에서 실행됩니다.

## 일반적인 사용 사례

- **애널리틱스 추적**: 사용자 행동 기록
- **감사 로깅**: 보안 감사 로그
- **알림 전송**: 이메일, 슬랙 등
- **캐시 무효화**: 캐시 업데이트
- **정리 작업**: 임시 파일 삭제

## 핵심 포인트

- **응답 우선**: 사용자에게 빠른 응답 제공
- **백그라운드 실행**: 부수 효과는 나중에 처리
- **실패 안전**: 응답 실패/리다이렉트 시에도 실행
- **광범위한 지원**: Server Actions, Route Handlers, Server Components

## 주의사항

- `after()` 내부 작업은 에러가 발생해도 응답에 영향 없음
- 중요한 작업은 `after()` 사용 금지
- 타임아웃 존재 (플랫폼마다 다름)

## 참고

[Next.js after() API](https://nextjs.org/docs/app/api-reference/functions/after)

</template>
<template #en>

## Overview

Use Next.js's `after()` to schedule work that should execute after a response is sent. This prevents logging, analytics, and other side effects from blocking the response.

### Impact

- **Priority**: MEDIUM
- **Performance**: faster response times

## Problem

When you await side effects like logging or analytics, the response gets delayed.

### Incorrect (blocks response)

```tsx
import { logUserAction } from "@/app/utils"

export async function POST(request: Request) {
  // Perform mutation
  await updateDatabase(request)

  // Logging blocks the response
  const userAgent = request.headers.get("user-agent") || "unknown"
  await logUserAction({ userAgent })

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
```

### Correct (non-blocking)

```tsx
import { after } from "next/server"
import { headers, cookies } from "next/headers"
import { logUserAction } from "@/app/utils"

export async function POST(request: Request) {
  // Perform mutation
  await updateDatabase(request)

  // Log after response is sent
  after(async () => {
    const userAgent = (await headers()).get("user-agent") || "unknown"
    const sessionCookie = (await cookies()).get("session-id")?.value || "anonymous"

    logUserAction({ sessionCookie, userAgent })
  })

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
```

The response is sent immediately while logging happens in the background.

## Common Use Cases

- **Analytics tracking**: Record user behavior
- **Audit logging**: Security audit logs
- **Sending notifications**: Email, Slack, etc.
- **Cache invalidation**: Update caches
- **Cleanup tasks**: Delete temporary files

## Key Points

- **Response first**: Provide fast response to user
- **Background execution**: Handle side effects later
- **Fail-safe**: Runs even if response fails or redirects
- **Broad support**: Server Actions, Route Handlers, Server Components

## Cautions

- Errors in `after()` don't affect response
- Don't use `after()` for critical operations
- Timeout exists (varies by platform)

## Reference

[Next.js after() API](https://nextjs.org/docs/app/api-reference/functions/after)

</template>
</BilingualContent>

---

**Tags**: server, async, logging, analytics, side-effects
