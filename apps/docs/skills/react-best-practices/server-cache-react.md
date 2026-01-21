# React.cache()로 요청별 중복 제거

<BilingualContent>
<template #ko>

## 개요

서버 사이드 요청 중복 제거를 위해 `React.cache()`를 사용하세요. 인증과 데이터베이스 쿼리에 특히 유용합니다.

### 영향도

- **우선순위**: MEDIUM
- **성능 영향**: 요청 내에서 중복 제거

## 사용법

```typescript
import { cache } from "react"

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id },
  })
})
```

단일 요청 내에서 `getCurrentUser()`를 여러 번 호출해도 쿼리는 한 번만 실행됩니다.

## 작동 원리

`React.cache()`는 React 서버 컴포넌트에서 제공하는 캐싱 메커니즘으로, **요청별(per-request)** 메모이제이션을 제공합니다.

### 일반적인 시나리오

```typescript
// Layout에서 호출
async function Layout() {
  const user = await getCurrentUser() // 1번째 호출
  return <div>...</div>
}

// Page에서 호출
async function Page() {
  const user = await getCurrentUser() // 캐시에서 반환 (DB 호출 X)
  return <div>...</div>
}

// 다른 컴포넌트에서 호출
async function Sidebar() {
  const user = await getCurrentUser() // 캐시에서 반환 (DB 호출 X)
  return <div>...</div>
}
```

세 컴포넌트가 모두 `getCurrentUser()`를 호출하지만, 실제 DB 쿼리는 한 번만 실행됩니다.

## 핵심 포인트

- **요청 범위**: 캐시는 단일 HTTP 요청 내에서만 유지
- **자동 클리어**: 다음 요청에서는 새로 실행
- **타입 안전**: TypeScript 완벽 지원
- **서버 전용**: 클라이언트 컴포넌트에서는 사용 불가

## 적용 대상

- 인증 함수 (`getCurrentUser`, `getSession` 등)
- 공통 데이터베이스 쿼리
- 여러 컴포넌트에서 호출되는 함수
- 변경되지 않는 설정 데이터

## 주의사항

- 요청 간(cross-request) 캐싱이 필요하면 LRU 캐시 사용
- 민감한 데이터는 적절한 권한 체크와 함께 사용
- 캐시는 함수 레벨에서 작동 (인자가 다르면 별도 캐시)

</template>
<template #en>

## Overview

Use `React.cache()` for server-side request deduplication. Authentication and database queries benefit most.

### Impact

- **Priority**: MEDIUM
- **Performance**: deduplicates within request

## Usage

```typescript
import { cache } from "react"

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id },
  })
})
```

Within a single request, multiple calls to `getCurrentUser()` execute the query only once.

## How It Works

`React.cache()` is a caching mechanism provided by React Server Components that offers **per-request** memoization.

### Common Scenario

```typescript
// Called in Layout
async function Layout() {
  const user = await getCurrentUser() // 1st call
  return <div>...</div>
}

// Called in Page
async function Page() {
  const user = await getCurrentUser() // Returned from cache (no DB call)
  return <div>...</div>
}

// Called in another component
async function Sidebar() {
  const user = await getCurrentUser() // Returned from cache (no DB call)
  return <div>...</div>
}
```

All three components call `getCurrentUser()`, but the actual DB query executes only once.

## Key Points

- **Request scope**: Cache persists only within a single HTTP request
- **Auto clear**: Re-executes on next request
- **Type safe**: Full TypeScript support
- **Server only**: Cannot be used in client components

## Common Use Cases

- Authentication functions (`getCurrentUser`, `getSession`, etc.)
- Common database queries
- Functions called from multiple components
- Static configuration data

## Cautions

- Use LRU cache for cross-request caching needs
- Use with proper permission checks for sensitive data
- Cache works at function level (different args = separate cache)

</template>
</BilingualContent>

---

**Tags**: server, cache, react-cache, deduplication
