# 메모이제이션된 컴포넌트로 추출

<BilingualContent>
<template #ko>

## 개요

비용이 큰 작업을 메모이제이션된 컴포넌트로 추출하여 계산 전 조기 반환을 활성화하세요.

### 영향도

- **우선순위**: MEDIUM
- **성능 영향**: 조기 반환 활성화

## 문제점

`useMemo` 내부의 비용이 큰 계산은 조건문보다 먼저 실행됩니다.

### 잘못된 예시 (로딩 중에도 avatar 계산)

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}
```

### 올바른 예시 (로딩 중에는 계산 건너뜀)

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return (
    <div>
      <UserAvatar user={user} />
    </div>
  )
}
```

## 작동 원리

1. `loading`이 true면 `<Skeleton />` 반환
2. `UserAvatar` 컴포넌트는 렌더링되지 않음
3. 비용이 큰 계산 완전히 건너뜀

## 핵심 포인트

- **조기 반환**: 불필요한 계산 전에 반환
- **컴포넌트 분리**: 비용이 큰 로직을 별도 컴포넌트로
- **memo() 사용**: props가 같으면 재렌더링 건너뜀
- **useMemo 내부**: 컴포넌트 내 세부 계산에만 사용

## React Compiler 참고

프로젝트에 [React Compiler](https://react.dev/learn/react-compiler)가 활성화되어 있다면, `memo()`와 `useMemo()`를 수동으로 사용할 필요가 없습니다. 컴파일러가 자동으로 리렌더링을 최적화합니다.

## 적용 시나리오

- 비용이 큰 계산이 있는 컴포넌트
- 조건부 렌더링이 있는 경우
- 복잡한 데이터 변환
- 무거운 SVG나 Canvas 렌더링

</template>
<template #en>

## Overview

Extract expensive work into memoized components to enable early returns before computation.

### Impact

- **Priority**: MEDIUM
- **Performance**: enables early returns

## Problem

Expensive computations inside `useMemo` execute before conditionals.

### Incorrect (computes avatar even when loading)

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}
```

### Correct (skips computation when loading)

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return (
    <div>
      <UserAvatar user={user} />
    </div>
  )
}
```

## How It Works

1. If `loading` is true, return `<Skeleton />`
2. `UserAvatar` component doesn't render
3. Expensive computation completely skipped

## Key Points

- **Early return**: Return before unnecessary computation
- **Component separation**: Extract expensive logic to separate component
- **Use memo()**: Skip re-render if props are same
- **useMemo inside**: Only for detailed computations within component

## React Compiler Note

If your project has [React Compiler](https://react.dev/learn/react-compiler) enabled, manual memoization with `memo()` and `useMemo()` is not necessary. The compiler automatically optimizes re-renders.

## Use Cases

- Components with expensive computations
- Conditional rendering scenarios
- Complex data transformations
- Heavy SVG or Canvas rendering

</template>
</BilingualContent>

---

**Tags**: rerender, memo, useMemo, optimization
