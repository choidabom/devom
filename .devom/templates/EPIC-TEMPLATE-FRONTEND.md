# Epic Template - Frontend Feature

> 프론트엔드 기능 개발을 위한 Epic 템플릿

**Epic ID**: EPIC-{ulid}
**Created**: {date}
**Priority**: {priority}
**Status**: TODO

---

## 1. 기능 개요 (Feature Overview)

### 목적
{이 기능이 왜 필요한가?}

### 사용자 스토리
"사용자로서, 나는 {무엇을} 하고 싶다, 왜냐하면 {이유}"

### 완료 조건 (Definition of Done)
- [ ] 모든 사용자 시나리오 동작
- [ ] E2E 테스트 통과
- [ ] 접근성 검증 (WCAG 2.1 AA)
- [ ] 성능 기준 충족 (LCP < 2.5s)
- [ ] 모바일 반응형 동작
- [ ] 코드 리뷰 승인

---

## 2. 화면 흐름 (Screen Flow)

```
[시작 화면]
    ↓
[기능 A 화면]
    ↓
[기능 B 화면]
    ↓
[완료 화면]
```

### 페이지 목록
1. `/path/to/page1` - 페이지 1 설명
2. `/path/to/page2` - 페이지 2 설명

---

## 3. 데이터 흐름 (Data Flow)

### API 엔드포인트
- `GET /api/resource` - 리소스 조회
- `POST /api/resource` - 리소스 생성
- `PUT /api/resource/:id` - 리소스 수정
- `DELETE /api/resource/:id` - 리소스 삭제

### 상태 관리
- **전역 상태**: {어떤 상태가 전역으로 필요한가?}
- **로컬 상태**: {어떤 상태가 로컬에서 관리되는가?}
- **서버 상태**: React Query로 관리 (캐싱, 재검증)

### 타입 정의
```typescript
interface MainEntity {
  id: string
  name: string
  // ...
}
```

---

## 4. Phase 분해 (Task Breakdown)

### Phase 1: Foundation (기반 작업)

**목표**: API 연결 및 타입 정의

- [ ] **TASK-001**: API 타입 정의
  - 파일: `domains/{domain}/types/{entity}.ts`
  - 내용: API 응답/요청 타입

- [ ] **TASK-002**: API 서비스 클래스
  - 파일: `domains/{domain}/api/{entity}-service.ts`
  - 내용: API 호출 로직 (static methods)

- [ ] **TASK-003**: React Query 훅
  - 파일: `domains/{domain}/hooks/use{Entity}.ts`
  - 내용: useQuery, useMutation 훅

**검증 기준**:
- [ ] 타입 체크 통과 (`npx tsc --noEmit`)
- [ ] API 호출 성공 (실제 엔드포인트 테스트)

---

### Phase 2: Components (컴포넌트 개발)

**목표**: 재사용 가능한 UI 컴포넌트 구현

- [ ] **TASK-004**: {컴포넌트 A}
  - 파일: `domains/{domain}/components/{ComponentA}.tsx`
  - Props: `{ComponentA}Props`
  - 기능: {설명}

- [ ] **TASK-005**: {컴포넌트 B}
  - 파일: `domains/{domain}/components/{ComponentB}.tsx`
  - Props: `{ComponentB}Props`
  - 기능: {설명}

- [ ] **TASK-006**: 컴포넌트 테스트
  - 파일: `domains/{domain}/components/*.test.tsx`
  - 커버리지: 80%+ 목표

**검증 기준**:
- [ ] Storybook에서 정상 렌더링
- [ ] 단위 테스트 통과
- [ ] 접근성 검증 (aria 속성)

---

### Phase 3: Pages (페이지 구현)

**목표**: Next.js App Router 페이지 생성

- [ ] **TASK-007**: 메인 페이지
  - 파일: `app/{path}/page.tsx`
  - 레이아웃: {어떤 레이아웃 사용?}
  - RSC/Client: {Server Component인가?}

- [ ] **TASK-008**: 서브 페이지
  - 파일: `app/{path}/{sub}/page.tsx`

- [ ] **TASK-009**: 레이아웃
  - 파일: `app/{path}/layout.tsx`
  - 공통 요소: 헤더, 사이드바 등

- [ ] **TASK-010**: 로딩 UI
  - 파일: `app/{path}/loading.tsx`
  - Suspense fallback

- [ ] **TASK-011**: 에러 UI
  - 파일: `app/{path}/error.tsx`
  - 에러 바운더리

**검증 기준**:
- [ ] 라우팅 정상 동작
- [ ] 로딩 상태 표시
- [ ] 에러 처리 동작

---

### Phase 4: Integration (통합)

**목표**: 기존 시스템과 통합

- [ ] **TASK-012**: 네비게이션 추가
  - 파일: `components/navigation.tsx` 수정
  - 새 메뉴 아이템 추가

- [ ] **TASK-013**: 권한 체크
  - 파일: `middleware.ts` 수정 (필요 시)
  - 인증 필요 여부 설정

- [ ] **TASK-014**: 라우트 메타데이터
  - SEO: title, description
  - Open Graph 설정

**검증 기준**:
- [ ] 네비게이션에서 접근 가능
- [ ] 권한 체크 동작 (미로그인 시 리다이렉트)
- [ ] SEO 메타 태그 확인

---

### Phase 5: Testing & Optimization (테스트 & 최적화)

**목표**: 품질 보증 및 성능 최적화

- [ ] **TASK-015**: E2E 테스트
  - 파일: `e2e/{feature}.spec.ts` (Playwright)
  - 주요 사용자 시나리오 커버

- [ ] **TASK-016**: 성능 최적화
  - 이미지 최적화 (WebP, lazy loading)
  - 코드 스플리팅 (dynamic import)
  - 번들 사이즈 확인

- [ ] **TASK-017**: 접근성 검증
  - axe-core 테스트
  - 키보드 네비게이션 확인
  - 스크린 리더 테스트

- [ ] **TASK-018**: 모바일 반응형
  - 모바일 레이아웃 확인
  - 터치 인터랙션 테스트

**검증 기준**:
- [ ] E2E 테스트 100% 통과
- [ ] Lighthouse 점수 90+ (Performance, Accessibility)
- [ ] 모바일/데스크톱 모두 정상 동작

---

## 5. 기술 스택 & 의존성

### 라이브러리
- [ ] React Query (서버 상태 관리)
- [ ] Zod (스키마 검증)
- [ ] react-hook-form (폼 관리)
- [ ] Shadcn UI (UI 컴포넌트)
- [ ] 기타: {추가 라이브러리}

### API 의존성
- [ ] `/api/endpoint1` - {설명}
- [ ] `/api/endpoint2` - {설명}

---

## 6. 위험 요소 & 고려사항

### 기술적 위험
- {어떤 기술적 도전이 있는가?}
- {성능 이슈 가능성은?}

### 의존성 위험
- {다른 팀/기능에 의존하는가?}
- {API가 준비되지 않았다면?}

### 해결 방안
- {위험 요소 완화 방법}

---

## 7. 타임라인

| Phase | 예상 시간 | 담당 |
|-------|----------|------|
| Phase 1: Foundation | 2시간 | {담당자} |
| Phase 2: Components | 4시간 | {담당자} |
| Phase 3: Pages | 3시간 | {담당자} |
| Phase 4: Integration | 2시간 | {담당자} |
| Phase 5: Testing | 3시간 | {담당자} |
| **총합** | **14시간** | |

---

## 8. 참고 자료

### 디자인
- Figma: {링크}
- 디자인 시스템: {링크}

### API 문서
- Swagger: {링크}
- Postman: {링크}

### 관련 Epic
- EPIC-xxx: {관련 Epic}

---

## 9. 진행 상황

### 완료된 Phase
- [ ] Phase 1: Foundation
- [ ] Phase 2: Components
- [ ] Phase 3: Pages
- [ ] Phase 4: Integration
- [ ] Phase 5: Testing

### 코드 리뷰
- [ ] Phase 1 리뷰 완료
- [ ] Phase 2 리뷰 완료
- [ ] Phase 3 리뷰 완료
- [ ] Phase 4 리뷰 완료
- [ ] Phase 5 리뷰 완료

### 최종 검증
- [ ] 기능 테스트 완료
- [ ] 성능 테스트 완료
- [ ] 접근성 테스트 완료
- [ ] 크로스 브라우저 테스트 완료

---

## 10. 완료 보고

### 구현된 기능
- {구현된 기능 목록}

### 변경된 파일
```
domains/{domain}/
├── api/
│   └── {entity}-service.ts
├── components/
│   ├── {Component}.tsx
│   └── {Component}.test.tsx
├── hooks/
│   └── use{Entity}.ts
└── types/
    └── {entity}.ts

app/{path}/
├── page.tsx
├── layout.tsx
├── loading.tsx
└── error.tsx
```

### 성능 지표
- Lighthouse Score: {점수}
- LCP: {시간}
- FID: {시간}
- CLS: {점수}

### 다음 단계
- {후속 작업}
- {개선 사항}

---

**Status**: ✅ COMPLETED / 🚧 IN_PROGRESS / ⏸️ BLOCKED
**Last Updated**: {date}
