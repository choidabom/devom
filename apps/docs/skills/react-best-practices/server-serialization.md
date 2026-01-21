# RSC 경계에서 직렬화 최소화

<BilingualContent>
<template #ko>

## 개요

React Server/Client 경계는 모든 객체 속성을 문자열로 직렬화하여 HTML 응답과 후속 RSC 요청에 포함합니다. 이 직렬화된 데이터는 페이지 크기와 로드 시간에 직접 영향을 주므로 **크기가 매우 중요합니다**. 클라이언트가 실제로 사용하는 필드만 전달하세요.

### 영향도

- **우선순위**: HIGH
- **성능 영향**: 데이터 전송 크기 감소

## 문제점

서버에서 가져온 전체 객체를 클라이언트 컴포넌트에 전달하면, 사용하지 않는 필드까지 모두 직렬화됩니다.

### 잘못된 예시 (50개 필드 모두 직렬화)

```tsx
async function Page() {
  const user = await fetchUser() // 50개 필드
  return <Profile user={user} />
}

;("use client")
function Profile({ user }: { user: User }) {
  return <div>{user.name}</div> // 1개 필드만 사용
}
```

### 올바른 예시 (1개 필드만 직렬화)

```tsx
async function Page() {
  const user = await fetchUser()
  return <Profile name={user.name} />
}

;("use client")
function Profile({ name }: { name: string }) {
  return <div>{name}</div>
}
```

## 핵심 포인트

- **필요한 필드만 추출**: 클라이언트가 사용할 필드만 props로 전달
- **페이지 크기 감소**: 직렬화 데이터가 HTML에 포함되어 전송됨
- **타입 안전성**: 명시적 props로 의도 명확화
- **성능 직결**: 데이터 크기가 로드 시간에 직접 영향

## 최적화 전략

### 구조 분해 사용

```tsx
const { name, email } = await fetchUser()
return <Profile name={name} email={email} />
```

### 객체 매핑

```tsx
const users = await fetchUsers()
const userNames = users.map((u) => ({ id: u.id, name: u.name }))
return <UserList users={userNames} />
```

### 계산된 값 전달

```tsx
const user = await fetchUser()
const displayName = `${user.firstName} ${user.lastName}`
return <Profile displayName={displayName} />
```

## 실제 영향

- 50개 필드 객체 (약 10KB) → 2개 필드 (약 200B)
- **98% 감소**
- 초기 HTML 크기 감소
- 하이드레이션 데이터 감소

</template>
<template #en>

## Overview

The React Server/Client boundary serializes all object properties into strings and embeds them in the HTML response and subsequent RSC requests. This serialized data directly impacts page weight and load time, so **size matters a lot**. Only pass fields that the client actually uses.

### Impact

- **Priority**: HIGH
- **Performance**: reduces data transfer size

## Problem

When you pass entire objects fetched from the server to client components, all unused fields get serialized.

### Incorrect (serializes all 50 fields)

```tsx
async function Page() {
  const user = await fetchUser() // 50 fields
  return <Profile user={user} />
}

;("use client")
function Profile({ user }: { user: User }) {
  return <div>{user.name}</div> // uses 1 field
}
```

### Correct (serializes only 1 field)

```tsx
async function Page() {
  const user = await fetchUser()
  return <Profile name={user.name} />
}

;("use client")
function Profile({ name }: { name: string }) {
  return <div>{name}</div>
}
```

## Key Points

- **Extract only needed fields**: Pass only fields client will use as props
- **Reduce page size**: Serialized data is included in HTML
- **Type safety**: Explicit props clarify intent
- **Direct performance impact**: Data size directly affects load time

## Optimization Strategies

### Use Destructuring

```tsx
const { name, email } = await fetchUser()
return <Profile name={name} email={email} />
```

### Object Mapping

```tsx
const users = await fetchUsers()
const userNames = users.map((u) => ({ id: u.id, name: u.name }))
return <UserList users={userNames} />
```

### Pass Computed Values

```tsx
const user = await fetchUser()
const displayName = `${user.firstName} ${user.lastName}`
return <Profile displayName={displayName} />
```

## Real Impact

- 50-field object (~10KB) → 2 fields (~200B)
- **98% reduction**
- Reduced initial HTML size
- Reduced hydration data

</template>
</BilingualContent>

---

**Tags**: server, rsc, serialization, props
