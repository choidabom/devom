# 요청 간 LRU 캐싱

<BilingualContent>
<template #ko>

## 개요

`React.cache()`는 단일 요청 내에서만 작동합니다. 순차적인 요청 간 데이터 공유(사용자가 버튼 A 클릭 후 B 클릭)에는 LRU 캐시를 사용하세요.

### 영향도

- **우선순위**: HIGH
- **성능 영향**: 요청 간 캐싱

## 구현 예시

```typescript
import { LRUCache } from "lru-cache"

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5분
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}

// 요청 1: DB 쿼리, 결과 캐싱
// 요청 2: 캐시 히트, DB 쿼리 없음
```

## 핵심 포인트

- **요청 간 공유**: 여러 요청에서 캐시 공유
- **TTL 설정**: 적절한 만료 시간 설정
- **메모리 관리**: max 옵션으로 메모리 사용 제한
- **순차적 액션**: 사용자의 연속된 동작에 효과적

## 플랫폼별 고려사항

### Vercel Fluid Compute

LRU 캐싱이 특히 효과적입니다. 여러 동시 요청이 같은 함수 인스턴스와 캐시를 공유하므로 Redis 없이도 요청 간 캐시가 유지됩니다.

### 전통적인 서버리스

각 호출이 격리되어 실행되므로, 프로세스 간 캐싱을 위해 Redis 사용을 고려하세요.

## 사용 시나리오

- 사용자의 연속된 액션
- 단기간 내 동일 데이터 재요청
- API 요청 최적화
- 데이터베이스 부하 감소

## 참고

라이브러리: [node-lru-cache](https://github.com/isaacs/node-lru-cache)

</template>
<template #en>

## Overview

`React.cache()` only works within one request. For data shared across sequential requests (user clicks button A then button B), use an LRU cache.

### Impact

- **Priority**: HIGH
- **Performance**: caches across requests

## Implementation Example

```typescript
import { LRUCache } from "lru-cache"

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}

// Request 1: DB query, result cached
// Request 2: cache hit, no DB query
```

## Key Points

- **Cross-request sharing**: Cache shared across multiple requests
- **TTL configuration**: Set appropriate expiration time
- **Memory management**: Limit memory usage with max option
- **Sequential actions**: Effective for user's consecutive actions

## Platform Considerations

### Vercel Fluid Compute

LRU caching is especially effective. Multiple concurrent requests can share the same function instance and cache, so cache persists across requests without Redis.

### Traditional Serverless

Each invocation runs in isolation, so consider Redis for cross-process caching.

## Use Cases

- User's sequential actions
- Re-requesting same data within short period
- API request optimization
- Database load reduction

## Reference

Library: [node-lru-cache](https://github.com/isaacs/node-lru-cache)

</template>
</BilingualContent>

---

**Tags**: server, cache, lru, cross-request
