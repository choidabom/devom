# 필요한 시점까지 await 지연

<BilingualContent>
<template #ko>

## 개요

`await` 작업을 실제로 사용되는 분기로 이동하여 불필요한 코드 경로의 차단을 방지하세요.

### 영향도

- **우선순위**: HIGH
- **성능 영향**: 사용하지 않는 코드 경로의 차단 방지

## 문제점

모든 분기에서 필요하지 않은 비동기 작업을 함수 시작 부분에서 await하면, 해당 데이터를 사용하지 않는 경로에서도 불필요하게 대기하게 됩니다.

### 잘못된 예시 (모든 분기가 차단됨)

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    // 즉시 반환하지만 userData를 기다림
    return { skipped: true }
  }

  // 이 분기만 userData 사용
  return processUserData(userData)
}
```

`skipProcessing`이 true일 때도 불필요하게 `fetchUserData`를 기다립니다.

### 올바른 예시 (필요할 때만 차단)

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // 기다리지 않고 즉시 반환
    return { skipped: true }
  }

  // 필요할 때만 fetch
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

### 추가 예시 (조기 반환 최적화)

```typescript
// 잘못된 예: 항상 권한을 가져옴
async function updateResource(resourceId: string, userId: string) {
  const permissions = await fetchPermissions(userId)
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: "Not found" }
  }

  if (!permissions.canEdit) {
    return { error: "Forbidden" }
  }

  return await updateResourceData(resource, permissions)
}

// 올바른 예: 필요할 때만 가져옴
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: "Not found" }
  }

  const permissions = await fetchPermissions(userId)

  if (!permissions.canEdit) {
    return { error: "Forbidden" }
  }

  return await updateResourceData(resource, permissions)
}
```

## 핵심 포인트

- await는 실제로 필요한 위치에서만 사용
- 조기 반환(early return) 패턴 활용
- 자주 실행되는 분기에서 특히 효과적
- 비용이 큰 작업일수록 최적화 효과 증가

## 적용 시나리오

- 조건부 로직이 있는 함수
- 권한 체크가 필요한 작업
- 에러 핸들링이 많은 함수
- 캐시 히트 시 조기 반환하는 경우

</template>
<template #en>

## Overview

Move `await` operations into the branches where they're actually used to avoid blocking code paths that don't need them.

### Impact

- **Priority**: HIGH
- **Performance**: avoids blocking unused code paths

## Problem

When you await async operations at the beginning of a function that aren't needed in all branches, you unnecessarily block code paths that don't use that data.

### Incorrect (blocks both branches)

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    // Returns immediately but still waited for userData
    return { skipped: true }
  }

  // Only this branch uses userData
  return processUserData(userData)
}
```

When `skipProcessing` is true, we unnecessarily wait for `fetchUserData`.

### Correct (only blocks when needed)

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // Returns immediately without waiting
    return { skipped: true }
  }

  // Fetch only when needed
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

### Another Example (early return optimization)

```typescript
// Incorrect: always fetches permissions
async function updateResource(resourceId: string, userId: string) {
  const permissions = await fetchPermissions(userId)
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: "Not found" }
  }

  if (!permissions.canEdit) {
    return { error: "Forbidden" }
  }

  return await updateResourceData(resource, permissions)
}

// Correct: fetches only when needed
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: "Not found" }
  }

  const permissions = await fetchPermissions(userId)

  if (!permissions.canEdit) {
    return { error: "Forbidden" }
  }

  return await updateResourceData(resource, permissions)
}
```

## Key Points

- Only await where actually needed
- Leverage early return patterns
- Especially effective in frequently-taken branches
- Greater optimization effect for expensive operations

## Use Cases

- Functions with conditional logic
- Operations requiring permission checks
- Functions with extensive error handling
- Early returns on cache hits

</template>
</BilingualContent>

---

**Tags**: async, await, conditional, optimization
