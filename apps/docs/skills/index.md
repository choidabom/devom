# Agent Skills

AI 에이전트가 참조하는 구조화된 코딩 가이드라인 모음입니다.

## 개요

Agent Skills는 AI 에이전트에게 특정 작업 수행을 위한 전문 지식을 제공하는 문서 시스템입니다. 각 스킬은 베스트 프랙티스, 성능 최적화 전략, 검증된 패턴을 포함합니다.

### 작동 방식

1. **컨텍스트 분석**: 에이전트가 작업 요청을 분석
2. **스킬 매칭**: 관련 스킬 문서를 자동 참조
3. **가이드라인 적용**: 문서 규칙을 코드 작성/리뷰에 적용

::: tip 예시
"React 컴포넌트 최적화해줘" → **React Best Practices** 스킬 자동 활성화
:::

## 사용 가능한 스킬

### React Best Practices

Vercel 엔지니어링 팀의 React/Next.js 성능 최적화 가이드라인

::: info 스펙

- **규칙 수**: 20개
- **카테고리**: 7개 (Async, Bundle, Server, Client, Rerender, Rendering)
- **우선순위**: CRITICAL → LOW
- **예제**: 실제 코드 포함
  :::

#### 카테고리별 가이드

**비동기 최적화 (Async)**

- [Promise.all()로 병렬 처리](./react-best-practices/async-parallel.md) - 독립적 작업 동시 실행
- [await 지연](./react-best-practices/async-defer-await.md) - 필요 시점까지 차단 방지
- [의존성 기반 병렬화](./react-best-practices/async-dependencies.md) - better-all 활용
- [API 라우트 워터폴 제거](./react-best-practices/async-api-routes.md) - 순차 실행 방지
- [Suspense 경계 설정](./react-best-practices/async-suspense-boundaries.md) - 전략적 로딩 UI

**번들 최적화 (Bundle)**

- [배럴 임포트 피하기](./react-best-practices/bundle-barrel-imports.md) - 직접 임포트 사용
- [동적 임포트](./react-best-practices/bundle-dynamic-imports.md) - 무거운 컴포넌트 지연 로딩
- [서드파티 지연](./react-best-practices/bundle-defer-third-party.md) - 비필수 라이브러리 처리
- [조건부 로딩](./react-best-practices/bundle-conditional.md) - 필요 시에만 로드
- [프리로드](./react-best-practices/bundle-preload.md) - 사용자 의도 기반 로딩

**서버 최적화 (Server)**

- [React.cache() 사용](./react-best-practices/server-cache-react.md) - 요청별 중복 제거
- [LRU 캐싱](./react-best-practices/server-cache-lru.md) - 요청 간 캐시
- [직렬화 최소화](./react-best-practices/server-serialization.md) - RSC 경계 최적화
- [병렬 데이터 페칭](./react-best-practices/server-parallel-fetching.md) - 컴포넌트 구성 활용
- [논블로킹 작업](./react-best-practices/server-after-nonblocking.md) - after() API 사용

**클라이언트 최적화 (Client)**

- [SWR 자동 중복 제거](./react-best-practices/client-swr-dedup.md) - 데이터 페칭 최적화

**리렌더 최적화 (Rerender)**

- [메모이제이션 컴포넌트](./react-best-practices/rerender-memo.md) - 조기 반환 패턴
- [Transitions 사용](./react-best-practices/rerender-transitions.md) - 비긴급 업데이트 처리

**렌더링 최적화 (Rendering)**

- [content-visibility 사용](./react-best-practices/rendering-content-visibility.md) - 긴 리스트 최적화

## 설치

프로젝트에 Agent Skills를 추가하려면:

```bash
npx add-skill vercel-labs/agent-skills
```

수동 설치는 `.claude/skills/` 디렉토리에 복사:

```bash
git clone https://github.com/vercel-labs/agent-skills
cp -r agent-skills/skills/* ./.claude/skills/
```

## 참고 자료

- [Vercel Agent Skills GitHub](https://github.com/vercel-labs/agent-skills)
- [React Best Practices 원본](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
- [Claude Code 문서](https://claude.com/claude-code)

---

**라이선스**: MIT | **번역**: Korean translation with bilingual support
