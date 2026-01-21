# 조건부 모듈 로딩

<BilingualContent>
<template #ko>

## 개요

대용량 데이터나 모듈은 기능이 활성화될 때만 로드하세요.

### 영향도

- **우선순위**: HIGH
- **성능 영향**: 필요할 때만 대용량 데이터 로드

## 사용 예시

### 애니메이션 프레임 지연 로딩

```tsx
function AnimationPlayer({ enabled }: { enabled: boolean }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== "undefined") {
      import("./animation-frames.js").then((mod) => setFrames(mod.frames)).catch(() => setEnabled(false))
    }
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

## 핵심 포인트

- **조건부 import**: 기능 활성화 시에만 모듈 로드
- **SSR 최적화**: `typeof window !== 'undefined'` 체크로 서버 번들에서 제외
- **빌드 최적화**: 서버 번들 크기 및 빌드 속도 개선
- **에러 핸들링**: import 실패 시 적절한 폴백 제공

## 적용 대상

- 대용량 애니메이션 데이터
- 조건부 기능 (feature flags)
- 사용자 권한에 따른 모듈
- A/B 테스트 변형

## 장점

- 초기 번들 크기 감소
- 불필요한 데이터 전송 방지
- 더 빠른 초기 로딩

</template>
<template #en>

## Overview

Load large data or modules only when a feature is activated.

### Impact

- **Priority**: HIGH
- **Performance**: loads large data only when needed

## Usage Example

### Lazy-load Animation Frames

```tsx
function AnimationPlayer({ enabled }: { enabled: boolean }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== "undefined") {
      import("./animation-frames.js").then((mod) => setFrames(mod.frames)).catch(() => setEnabled(false))
    }
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

## Key Points

- **Conditional import**: Load module only when feature is active
- **SSR optimization**: `typeof window !== 'undefined'` check excludes from server bundle
- **Build optimization**: Improves server bundle size and build speed
- **Error handling**: Provide appropriate fallback on import failure

## Use Cases

- Large animation data
- Conditional features (feature flags)
- Permission-based modules
- A/B test variations

## Benefits

- Reduced initial bundle size
- Prevents unnecessary data transfer
- Faster initial loading

</template>
</BilingualContent>

---

**Tags**: bundle, conditional-loading, lazy-loading
