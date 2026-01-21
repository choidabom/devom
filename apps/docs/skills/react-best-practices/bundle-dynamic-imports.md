# 무거운 컴포넌트는 동적 임포트 사용

<BilingualContent>
<template #ko>

## 개요

초기 렌더링에 필요하지 않은 대용량 컴포넌트는 `next/dynamic`을 사용하여 지연 로딩하세요.

### 영향도

- **우선순위**: CRITICAL
- **성능 영향**: TTI 및 LCP에 직접적인 영향

## 문제점

대용량 컴포넌트(에디터, 차트 라이브러리 등)를 일반 import로 불러오면 메인 번들에 포함되어 초기 로딩 시간이 크게 증가합니다.

### 잘못된 예시 (Monaco가 메인 청크에 포함 ~300KB)

```tsx
import { MonacoEditor } from "./monaco-editor"

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

이 경우 사용자가 코드 패널을 열지 않더라도 Monaco Editor가 로딩됩니다.

### 올바른 예시 (Monaco는 필요할 때만 로딩)

```tsx
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("./monaco-editor").then((m) => m.MonacoEditor), { ssr: false })

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

## 핵심 포인트

- 대용량 컴포넌트는 동적 임포트로 분리
- `next/dynamic`으로 코드 스플리팅 구현
- `{ ssr: false }` 옵션으로 서버 렌더링 제외 가능
- TTI(Time to Interactive)와 LCP(Largest Contentful Paint) 개선

## 적용 대상

- 에디터 (Monaco, CodeMirror 등)
- 차트 라이브러리 (Chart.js, Recharts 등)
- 지도 (Google Maps, Mapbox 등)
- 마크다운 렌더러
- PDF 뷰어

</template>
<template #en>

## Overview

Use `next/dynamic` to lazy-load large components not needed on initial render.

### Impact

- **Priority**: CRITICAL
- **Performance**: directly affects TTI and LCP

## Problem

Importing heavy components (editors, chart libraries, etc.) with regular imports includes them in the main bundle, significantly increasing initial load time.

### Incorrect (Monaco bundles with main chunk ~300KB)

```tsx
import { MonacoEditor } from "./monaco-editor"

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

In this case, Monaco Editor loads even if the user never opens the code panel.

### Correct (Monaco loads on demand)

```tsx
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("./monaco-editor").then((m) => m.MonacoEditor), { ssr: false })

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

## Key Points

- Split heavy components with dynamic imports
- Implement code splitting using `next/dynamic`
- Use `{ ssr: false }` to exclude from server rendering
- Improves TTI (Time to Interactive) and LCP (Largest Contentful Paint)

## Common Use Cases

- Editors (Monaco, CodeMirror, etc.)
- Chart libraries (Chart.js, Recharts, etc.)
- Maps (Google Maps, Mapbox, etc.)
- Markdown renderers
- PDF viewers

</template>
</BilingualContent>

---

**Tags**: bundle, dynamic-import, code-splitting, next-dynamic
