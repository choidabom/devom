# SWR로 자동 중복 제거

<BilingualContent>
<template #ko>

## 개요

SWR은 컴포넌트 인스턴스 간 요청 중복 제거, 캐싱, 재검증을 자동으로 처리합니다.

### 영향도

- **우선순위**: MEDIUM-HIGH
- **성능**: 자동 중복 제거

## 예시

### 기본 사용

```tsx
import useSWR from "swr"

function UserList() {
  const { data: users } = useSWR("/api/users", fetcher)
}
```

### 불변 데이터

```tsx
import { useImmutableSWR } from "@/lib/swr"

function StaticContent() {
  const { data } = useImmutableSWR("/api/config", fetcher)
}
```

### Mutation

```tsx
import { useSWRMutation } from "swr/mutation"

function UpdateButton() {
  const { trigger } = useSWRMutation("/api/user", updateUser)
  return <button onClick={() => trigger()}>Update</button>
}
```

[SWR 문서](https://swr.vercel.app)

</template>
<template #en>

## Overview

SWR enables request deduplication, caching, and revalidation across component instances.

### Impact

- **Priority**: MEDIUM-HIGH
- **Performance**: automatic deduplication

## Examples

### Basic Usage

```tsx
import useSWR from "swr"

function UserList() {
  const { data: users } = useSWR("/api/users", fetcher)
}
```

### Immutable Data

```tsx
import { useImmutableSWR } from "@/lib/swr"

function StaticContent() {
  const { data } = useImmutableSWR("/api/config", fetcher)
}
```

### Mutations

```tsx
import { useSWRMutation } from "swr/mutation"

function UpdateButton() {
  const { trigger } = useSWRMutation("/api/user", updateUser)
  return <button onClick={() => trigger()}>Update</button>
}
```

[SWR Docs](https://swr.vercel.app)

</template>
</BilingualContent>

---

**Tags**: client, swr, deduplication, data-fetching
