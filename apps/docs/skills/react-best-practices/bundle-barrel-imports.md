# 배럴 파일 임포트 피하기

<BilingualContent>
<template #ko>

## 개요

배럴 파일(barrel file) 대신 소스 파일에서 직접 임포트하여 수천 개의 사용하지 않는 모듈 로딩을 방지하세요. **배럴 파일**은 여러 모듈을 재export하는 진입점입니다(예: `export * from './module'`을 수행하는 `index.js`).

### 영향도

- **우선순위**: CRITICAL
- **성능 영향**: 200-800ms 임포트 비용, 느린 빌드 속도

## 문제점

인기 있는 아이콘 및 컴포넌트 라이브러리는 진입 파일에 **최대 10,000개의 재export**를 포함할 수 있습니다. 많은 React 패키지의 경우 **임포트만 200-800ms** 소요되어 개발 속도와 프로덕션 콜드 스타트에 영향을 줍니다.

**트리쉐이킹이 도움이 안 되는 이유**: 라이브러리가 external로 표시되면(번들되지 않음) 번들러가 최적화할 수 없습니다. 트리쉐이킹을 활성화하기 위해 번들링하면 전체 모듈 그래프를 분석하느라 빌드가 상당히 느려집니다.

### 잘못된 예시 (전체 라이브러리 임포트)

```tsx
import { Check, X, Menu } from "lucide-react"
// 1,583개 모듈 로딩, 개발 시 ~2.8초 추가 소요
// 런타임 비용: 콜드 스타트마다 200-800ms

import { Button, TextField } from "@mui/material"
// 2,225개 모듈 로딩, 개발 시 ~4.2초 추가 소요
```

### 올바른 예시 (필요한 것만 임포트)

```tsx
import Check from "lucide-react/dist/esm/icons/check"
import X from "lucide-react/dist/esm/icons/x"
import Menu from "lucide-react/dist/esm/icons/menu"
// 3개 모듈만 로딩 (~2KB vs ~1MB)

import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
// 사용하는 것만 로딩
```

### 대안 (Next.js 13.5+)

```js
// next.config.js - optimizePackageImports 사용
module.exports = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@mui/material"],
  },
}

// 이제 편리한 배럴 임포트를 유지할 수 있습니다:
import { Check, X, Menu } from "lucide-react"
// 빌드 시 자동으로 직접 임포트로 변환됨
```

## 성능 개선

직접 임포트 사용 시:

- 개발 부팅: 15-70% 빠름
- 빌드: 28% 빠름
- 콜드 스타트: 40% 빠름
- HMR: 크게 개선

## 영향받는 라이브러리

`lucide-react`, `@mui/material`, `@mui/icons-material`, `@tabler/icons-react`, `react-icons`, `@headlessui/react`, `@radix-ui/react-*`, `lodash`, `ramda`, `date-fns`, `rxjs`, `react-use`

### 참고 자료

[How we optimized package imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

</template>
<template #en>

## Overview

Import directly from source files instead of barrel files to avoid loading thousands of unused modules. **Barrel files** are entry points that re-export multiple modules (e.g., `index.js` that does `export * from './module'`).

### Impact

- **Priority**: CRITICAL
- **Performance**: 200-800ms import cost, slow builds

## Problem

Popular icon and component libraries can have **up to 10,000 re-exports** in their entry file. For many React packages, **it takes 200-800ms just to import them**, affecting both development speed and production cold starts.

**Why tree-shaking doesn't help**: When a library is marked as external (not bundled), the bundler can't optimize it. If you bundle it to enable tree-shaking, builds become substantially slower analyzing the entire module graph.

### Incorrect (imports entire library)

```tsx
import { Check, X, Menu } from "lucide-react"
// Loads 1,583 modules, takes ~2.8s extra in dev
// Runtime cost: 200-800ms on every cold start

import { Button, TextField } from "@mui/material"
// Loads 2,225 modules, takes ~4.2s extra in dev
```

### Correct (imports only what you need)

```tsx
import Check from "lucide-react/dist/esm/icons/check"
import X from "lucide-react/dist/esm/icons/x"
import Menu from "lucide-react/dist/esm/icons/menu"
// Loads only 3 modules (~2KB vs ~1MB)

import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
// Loads only what you use
```

### Alternative (Next.js 13.5+)

```js
// next.config.js - use optimizePackageImports
module.exports = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@mui/material"],
  },
}

// Then you can keep the ergonomic barrel imports:
import { Check, X, Menu } from "lucide-react"
// Automatically transformed to direct imports at build time
```

## Performance Improvements

Direct imports provide:

- Dev boot: 15-70% faster
- Builds: 28% faster
- Cold starts: 40% faster
- HMR: Significantly faster

## Commonly Affected Libraries

`lucide-react`, `@mui/material`, `@mui/icons-material`, `@tabler/icons-react`, `react-icons`, `@headlessui/react`, `@radix-ui/react-*`, `lodash`, `ramda`, `date-fns`, `rxjs`, `react-use`

### Reference

[How we optimized package imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

</template>
</BilingualContent>

---

**Tags**: bundle, imports, tree-shaking, barrel-files, performance
