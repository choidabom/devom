# 전략적 Suspense 경계 설정

<BilingualContent>
<template #ko>

## 개요

async 컴포넌트에서 JSX를 반환하기 전에 데이터를 await하는 대신, Suspense 경계를 사용하여 래퍼 UI를 먼저 보여주세요.

### 영향도

- **우선순위**: HIGH
- **성능 영향**: 더 빠른 초기 페인트

## 문제점

페이지 전체를 async로 만들고 데이터를 await하면, 데이터가 필요 없는 UI까지 차단됩니다.

### 잘못된 예시 (래퍼가 데이터 페칭에 차단됨)

```tsx
async function Page() {
  const data = await fetchData() // 전체 페이지 차단

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <DataDisplay data={data} />
      </div>
      <div>Footer</div>
    </div>
  )
}
```

데이터가 필요한 부분은 중간 섹션뿐인데 전체 레이아웃이 대기합니다.

### 올바른 예시 (래퍼는 즉시 표시, 데이터는 스트리밍)

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // 이 컴포넌트만 차단
  return <div>{data.content}</div>
}
```

Sidebar, Header, Footer는 즉시 렌더링되고, DataDisplay만 데이터를 기다립니다.

### 대안 (여러 컴포넌트에서 Promise 공유)

```tsx
function Page() {
  // fetch를 즉시 시작하되 await하지 않음
  const dataPromise = fetchData()

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay dataPromise={dataPromise} />
        <DataSummary dataPromise={dataPromise} />
      </Suspense>
      <div>Footer</div>
    </div>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // Promise 언래핑
  return <div>{data.content}</div>
}

function DataSummary({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // 같은 Promise 재사용
  return <div>{data.summary}</div>
}
```

두 컴포넌트가 같은 Promise를 공유하므로 fetch는 한 번만 발생합니다. 레이아웃은 즉시 렌더링되고 두 컴포넌트가 함께 대기합니다.

## 사용하지 말아야 할 경우

- **레이아웃 결정에 필수적인 데이터** (위치에 영향)
- **SEO 중요 콘텐츠** (above the fold)
- **작고 빠른 쿼리** (suspense 오버헤드가 아까운 경우)
- **레이아웃 시프트를 피하고 싶을 때** (로딩 → 콘텐츠 점프)

## 트레이드오프

**빠른 초기 페인트 vs 레이아웃 시프트 가능성**

UX 우선순위에 따라 선택하세요.

</template>
<template #en>

## Overview

Instead of awaiting data in async components before returning JSX, use Suspense boundaries to show the wrapper UI faster while data loads.

### Impact

- **Priority**: HIGH
- **Performance**: faster initial paint

## Problem

When you make the entire page async and await data, even UI that doesn't need data gets blocked.

### Incorrect (wrapper blocked by data fetching)

```tsx
async function Page() {
  const data = await fetchData() // Blocks entire page

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <DataDisplay data={data} />
      </div>
      <div>Footer</div>
    </div>
  )
}
```

The entire layout waits for data even though only the middle section needs it.

### Correct (wrapper shows immediately, data streams in)

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // Only blocks this component
  return <div>{data.content}</div>
}
```

Sidebar, Header, and Footer render immediately. Only DataDisplay waits for data.

### Alternative (share promise across components)

```tsx
function Page() {
  // Start fetch immediately, but don't await
  const dataPromise = fetchData()

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay dataPromise={dataPromise} />
        <DataSummary dataPromise={dataPromise} />
      </Suspense>
      <div>Footer</div>
    </div>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // Unwraps the promise
  return <div>{data.content}</div>
}

function DataSummary({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // Reuses the same promise
  return <div>{data.summary}</div>
}
```

Both components share the same promise, so only one fetch occurs. Layout renders immediately while both components wait together.

## When NOT to Use

- **Critical data for layout decisions** (affects positioning)
- **SEO-critical content** (above the fold)
- **Small, fast queries** (suspense overhead not worth it)
- **Avoid layout shift** (loading → content jump)

## Trade-off

**Faster initial paint vs potential layout shift**

Choose based on your UX priorities.

</template>
</BilingualContent>

---

**Tags**: async, suspense, streaming, layout-shift
