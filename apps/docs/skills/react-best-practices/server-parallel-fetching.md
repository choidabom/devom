# 컴포넌트 구성으로 병렬 데이터 페칭

<BilingualContent>
<template #ko>

## 개요

React Server Components는 트리 내에서 순차적으로 실행됩니다. 구성(composition)으로 재구성하여 데이터 페칭을 병렬화하세요.

### 영향도

- **우선순위**: CRITICAL
- **성능 영향**: 서버 사이드 워터폴 제거

## 문제점

부모 컴포넌트에서 데이터를 await하면, 자식 컴포넌트의 데이터 페칭이 차단됩니다.

### 잘못된 예시 (Sidebar가 Page의 fetch 완료를 기다림)

```tsx
export default async function Page() {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      <Sidebar />
    </div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}
```

### 올바른 예시 (둘 다 동시에 fetch)

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}</div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <div>
      <Header />
      <Sidebar />
    </div>
  )
}
```

## 작동 원리

React는 동일 레벨의 async 컴포넌트들을 **병렬로 시작**합니다.

### children prop 활용

```tsx
async function Layout({ children }: { children: ReactNode }) {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      {children}
    </div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <Layout>
      <Sidebar />
    </Layout>
  )
}
```

`Layout`과 `Sidebar`의 fetch가 동시에 시작됩니다.

## 핵심 포인트

- **컴포넌트 분리**: 데이터 페칭을 별도 컴포넌트로 분리
- **병렬 실행**: 같은 레벨의 async 컴포넌트는 병렬 실행
- **구성 활용**: children, props를 활용한 컴포넌트 구성
- **워터폴 제거**: 순차 실행을 병렬 실행으로 전환

## 성능 개선

```
잘못된 방식:
Header    ████████
           ↓
Sidebar           ████████
Total: 16초

올바른 방식:
Header    ████████
Sidebar   ████████
Total: 8초 (50% 감소)
```

</template>
<template #en>

## Overview

React Server Components execute sequentially within a tree. Restructure with composition to parallelize data fetching.

### Impact

- **Priority**: CRITICAL
- **Performance**: eliminates server-side waterfalls

## Problem

When parent component awaits data, child component data fetching gets blocked.

### Incorrect (Sidebar waits for Page's fetch to complete)

```tsx
export default async function Page() {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      <Sidebar />
    </div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}
```

### Correct (both fetch simultaneously)

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}</div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <div>
      <Header />
      <Sidebar />
    </div>
  )
}
```

## How It Works

React **starts parallel execution** for async components at the same level.

### Using children prop

```tsx
async function Layout({ children }: { children: ReactNode }) {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      {children}
    </div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <Layout>
      <Sidebar />
    </Layout>
  )
}
```

`Layout` and `Sidebar` fetches start simultaneously.

## Key Points

- **Split components**: Separate data fetching into components
- **Parallel execution**: Same-level async components run in parallel
- **Use composition**: Leverage children, props for component composition
- **Eliminate waterfalls**: Convert sequential to parallel execution

## Performance Improvement

```
Incorrect approach:
Header    ████████
           ↓
Sidebar           ████████
Total: 16s

Correct approach:
Header    ████████
Sidebar   ████████
Total: 8s (50% reduction)
```

</template>
</BilingualContent>

---

**Tags**: server, rsc, parallel-fetching, composition
