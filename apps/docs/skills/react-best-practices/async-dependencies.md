# 의존성 기반 병렬 처리

<BilingualContent>
<template #ko>

## 개요

부분적인 의존성이 있는 작업들은 `better-all`을 사용하여 병렬성을 극대화하세요. 각 작업을 가능한 가장 빠른 시점에 자동으로 시작합니다.

### 영향도

- **우선순위**: CRITICAL
- **성능 개선**: 2-10배

## 문제점

일부 작업만 의존성이 있는 경우, `Promise.all()`만으로는 최적화가 어렵습니다.

### 잘못된 예시 (profile이 config를 불필요하게 기다림)

```typescript
const [user, config] = await Promise.all([fetchUser(), fetchConfig()])
const profile = await fetchProfile(user.id)
```

`profile`은 `user`만 필요한데 `config`까지 기다립니다.

### 올바른 예시 (config과 profile이 병렬 실행)

```typescript
import { all } from "better-all"

const { user, config, profile } = await all({
  async user() {
    return fetchUser()
  },
  async config() {
    return fetchConfig()
  },
  async profile() {
    return fetchProfile((await this.$.user).id)
  },
})
```

## 작동 원리

`better-all`은 각 작업의 의존성을 분석하여:

1. `user`와 `config`는 즉시 병렬 실행
2. `profile`은 `user`가 완료되면 즉시 시작
3. `config`와 `profile`이 동시에 실행됨

### 실행 타임라인

```
일반 방식:
user     ████████
config   ████████
         ↓ 둘 다 완료 대기
profile         ████████

better-all:
user     ████████
config   ████████████████
profile         ████████
         ↑ user만 완료되면 시작
```

## 핵심 포인트

- 복잡한 의존성 체인 자동 최적화
- `this.$`로 다른 작업의 Promise 참조
- 가능한 모든 병렬 실행 자동 탐지
- 수동 Promise 관리 불필요

## 사용 시나리오

- 여러 API 호출이 부분적으로 의존적인 경우
- 인증 후 여러 데이터를 가져올 때
- 복잡한 데이터 파이프라인

## 참고

라이브러리: [better-all](https://github.com/shuding/better-all)

</template>
<template #en>

## Overview

For operations with partial dependencies, use `better-all` to maximize parallelism. It automatically starts each task at the earliest possible moment.

### Impact

- **Priority**: CRITICAL
- **Performance**: 2-10× improvement

## Problem

When some tasks have dependencies, `Promise.all()` alone makes optimization difficult.

### Incorrect (profile waits for config unnecessarily)

```typescript
const [user, config] = await Promise.all([fetchUser(), fetchConfig()])
const profile = await fetchProfile(user.id)
```

`profile` only needs `user` but waits for `config` too.

### Correct (config and profile run in parallel)

```typescript
import { all } from "better-all"

const { user, config, profile } = await all({
  async user() {
    return fetchUser()
  },
  async config() {
    return fetchConfig()
  },
  async profile() {
    return fetchProfile((await this.$.user).id)
  },
})
```

## How It Works

`better-all` analyzes dependencies of each task:

1. `user` and `config` run in parallel immediately
2. `profile` starts as soon as `user` completes
3. `config` and `profile` execute simultaneously

### Execution Timeline

```
Normal approach:
user     ████████
config   ████████
         ↓ wait for both
profile         ████████

better-all:
user     ████████
config   ████████████████
profile         ████████
         ↑ starts after user only
```

## Key Points

- Auto-optimizes complex dependency chains
- Reference other task Promises with `this.$`
- Auto-detects all possible parallelism
- No manual Promise management needed

## Use Cases

- Multiple API calls with partial dependencies
- Fetching multiple data after authentication
- Complex data pipelines

## Reference

Library: [better-all](https://github.com/shuding/better-all)

</template>
</BilingualContent>

---

**Tags**: async, parallelization, dependencies, better-all
