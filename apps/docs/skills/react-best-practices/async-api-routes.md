# API 라우트에서 워터폴 체인 방지

<BilingualContent>
<template #ko>

## 개요

API 라우트와 Server Actions에서 독립적인 작업은 await하지 않고 즉시 시작하세요.

### 영향도

- **우선순위**: CRITICAL
- **성능 개선**: 2-10배

## 문제점

API 라우트에서 독립적인 작업들을 순차적으로 await하면 불필요한 대기 시간이 발생합니다.

### 잘못된 예시 (config이 auth를 기다리고, data가 둘 다 기다림)

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

`config`는 `auth`와 독립적인데도 순차적으로 실행됩니다.

### 올바른 예시 (auth와 config이 즉시 시작)

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([configPromise, fetchData(session.user.id)])
  return Response.json({ data, config })
}
```

## 핵심 포인트

- Promise를 즉시 생성하되, await는 나중에
- 독립적인 작업들을 먼저 시작
- 의존성이 있는 작업은 필요한 시점에 await
- `Promise.all()`로 최종 결과 수집

## 고급 패턴

복잡한 의존성 체인이 있다면 `better-all` 라이브러리 사용을 고려하세요. (Dependency-Based Parallelization 참고)

</template>
<template #en>

## Overview

In API routes and Server Actions, start independent operations immediately, even if you don't await them yet.

### Impact

- **Priority**: CRITICAL
- **Performance**: 2-10× improvement

## Problem

When you sequentially await independent operations in API routes, unnecessary wait time occurs.

### Incorrect (config waits for auth, data waits for both)

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

`config` is independent of `auth` but executes sequentially.

### Correct (auth and config start immediately)

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([configPromise, fetchData(session.user.id)])
  return Response.json({ data, config })
}
```

## Key Points

- Create Promises immediately, await later
- Start independent operations first
- Await dependent operations when needed
- Collect final results with `Promise.all()`

## Advanced Pattern

For complex dependency chains, consider using the `better-all` library. (See Dependency-Based Parallelization)

</template>
</BilingualContent>

---

**Tags**: api-routes, server-actions, waterfalls, parallelization
