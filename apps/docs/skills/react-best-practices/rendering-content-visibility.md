# 긴 리스트에 CSS content-visibility 사용

<BilingualContent>
<template #ko>

## 개요

`content-visibility: auto`를 적용하여 화면 밖 렌더링을 지연시키세요.

### 영향도

- **우선순위**: HIGH
- **성능 영향**: 더 빠른 초기 렌더링

## 구현

### CSS

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### 사용 예시

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map((msg) => (
        <div key={msg.id} className="message-item">
          <Avatar user={msg.author} />
          <div>{msg.content}</div>
        </div>
      ))}
    </div>
  )
}
```

## 작동 원리

- **content-visibility: auto**: 화면 밖 요소의 렌더링 건너뛰기
- **contain-intrinsic-size**: 렌더링 전 요소 크기 힌트 제공
- 브라우저가 레이아웃/페인트를 지연

## 성능 개선

1000개 메시지 기준:

- 화면 밖 ~990개 항목의 레이아웃/페인트 건너뛰기
- **초기 렌더링 10배 빠름**

## 핵심 포인트

- 긴 리스트에 적용
- 스크롤 성능 향상
- 초기 로딩 시간 단축
- CSS만으로 구현 가능

## 주의사항

- `contain-intrinsic-size`로 정확한 높이 지정 (스크롤바 점프 방지)
- 가변 높이 아이템에는 주의 필요
- 최신 브라우저 지원 확인

## 적용 대상

- 채팅 메시지 리스트
- 뉴스 피드
- 상품 목록
- 댓글 스레드

</template>
<template #en>

## Overview

Apply `content-visibility: auto` to defer off-screen rendering.

### Impact

- **Priority**: HIGH
- **Performance**: faster initial render

## Implementation

### CSS

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### Usage Example

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map((msg) => (
        <div key={msg.id} className="message-item">
          <Avatar user={msg.author} />
          <div>{msg.content}</div>
        </div>
      ))}
    </div>
  )
}
```

## How It Works

- **content-visibility: auto**: Skip rendering off-screen elements
- **contain-intrinsic-size**: Provide size hint before rendering
- Browser defers layout/paint

## Performance Improvement

For 1000 messages:

- Skips layout/paint for ~990 off-screen items
- **10× faster initial render**

## Key Points

- Apply to long lists
- Improves scroll performance
- Reduces initial load time
- CSS-only implementation

## Cautions

- Set accurate height with `contain-intrinsic-size` (prevents scrollbar jump)
- Be careful with variable-height items
- Check modern browser support

## Use Cases

- Chat message lists
- News feeds
- Product listings
- Comment threads

</template>
</BilingualContent>

---

**Tags**: rendering, css, content-visibility, long-lists
