# Promise.all()로 독립적인 작업 병렬 처리

<BilingualContent>
<template #ko>

## 개요

상호 의존성이 없는 비동기 작업은 `Promise.all()`을 사용하여 동시에 실행하세요.

### 영향도

- **우선순위**: CRITICAL
- **성능 개선**: 2-10배

### 잘못된 예시 (순차 실행, 3번의 왕복)

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

이 코드는 각 작업이 순차적으로 실행되어 총 3번의 네트워크 왕복이 발생합니다.

### 올바른 예시 (병렬 실행, 1번의 왕복)

```typescript
const [user, posts, comments] = await Promise.all([fetchUser(), fetchPosts(), fetchComments()])
```

모든 작업이 동시에 시작되어 가장 느린 작업만큼의 시간만 소요됩니다.

### 핵심 포인트

- 서로 독립적인 비동기 작업은 병렬로 실행
- `Promise.all()`로 여러 Promise를 동시에 처리
- 네트워크 요청 횟수를 줄여 전체 응답 시간 단축

</template>
<template #en>

## Overview

When async operations have no interdependencies, execute them concurrently using `Promise.all()`.

### Impact

- **Priority**: CRITICAL
- **Performance**: 2-10× improvement

### Incorrect (sequential execution, 3 round trips)

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

This code executes each task sequentially, resulting in 3 network round trips.

### Correct (parallel execution, 1 round trip)

```typescript
const [user, posts, comments] = await Promise.all([fetchUser(), fetchPosts(), fetchComments()])
```

All operations start simultaneously, taking only as long as the slowest operation.

### Key Points

- Execute independent async operations in parallel
- Use `Promise.all()` to handle multiple Promises concurrently
- Reduce network round trips to minimize total response time

</template>
</BilingualContent>

---

**Tags**: async, parallelization, promises, waterfalls
