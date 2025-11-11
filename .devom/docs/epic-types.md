# Epic Types Guide

> 프론트엔드 개발에서 Epic 범위를 정하는 방법

---

## 📊 Epic 유형 비교

| 특성 | 공통 컴포넌트 Epic | 전체 기능 Epic |
|------|------------------|--------------|
| **범위** | 재사용 가능한 UI 컴포넌트 | 완전한 사용자 기능 플로우 |
| **파일 수** | 1-5개 | 10-20개 |
| **Phase 수** | 1-2개 | 4-5개 |
| **예상 시간** | 2-4시간 | 12-20시간 |
| **라우팅** | ❌ 불필요 | ✅ 필요 |
| **API 연동** | ❌ 선택적 | ✅ 필수 |
| **상태 관리** | Local state | Global + Server state |
| **네비게이션** | ❌ 불필요 | ✅ 필요 |
| **권한 체크** | ❌ 불필요 | ✅ 필요 (보통) |

---

## 🎨 Type 1: 공통 컴포넌트 Epic

### 언제 사용하는가?

- ✅ 재사용 가능한 UI 컴포넌트 개발
- ✅ 디자인 시스템 컴포넌트
- ✅ 라우팅/상태와 독립적인 기능
- ✅ Storybook 문서화가 주 목적

### 예시

- Button, Input, Modal, Card 등 기본 UI 컴포넌트
- DatePicker, FileUpload 등 복합 컴포넌트
- LoadingSpinner, ErrorMessage 등 피드백 컴포넌트

### Phase 구조 (간소화)

```
Phase 1: Component Development
├── 컴포넌트 구현 (Button.tsx, Button.types.ts)
├── 스타일링 (button.module.css)
└── Props 인터페이스

Phase 2: Testing & Documentation
├── 단위 테스트 (Button.test.tsx)
├── Storybook 스토리 (Button.stories.tsx)
└── 접근성 검증
```

### 파일 구조

```
packages/ui/src/Button/
├── Button.tsx              # 컴포넌트 구현
├── Button.types.ts         # Props 타입
├── button.module.css       # 스타일
├── Button.test.tsx         # 테스트
├── Button.stories.tsx      # Storybook
├── docs/
│   └── EPIC.md            # Epic 문서
└── index.ts               # Public API
```

### Epic 예시

```markdown
# Epic: Button 컴포넌트 구현

**Epic ID**: EPIC-m1n2o3p4
**Priority**: medium
**Status**: TODO

## 목적

재사용 가능한 Button 컴포넌트를 구현하여 일관된 UI를 제공한다.

## Phase 1: Component Development

- [ ] Button.tsx - 기본 버튼 컴포넌트
- [ ] Button.types.ts - Props 인터페이스
- [ ] button.module.css - 스타일 (primary, secondary, ghost variants)

## Phase 2: Testing & Documentation

- [ ] Button.test.tsx - 단위 테스트 (클릭, 비활성화, variants)
- [ ] Button.stories.tsx - Storybook 스토리
- [ ] 접근성 검증 (ARIA, 키보드)
```

---

## 🚀 Type 2: 전체 기능 Epic (Full Feature)

### 언제 사용하는가?

- ✅ 새로운 페이지 추가
- ✅ 라우팅이 필요한 기능
- ✅ API 연동이 필요한 기능
- ✅ 네비게이션/권한 변경이 필요한 경우
- ✅ 전체 사용자 플로우 구현

### 예시

- 사용자 대시보드 페이지
- 상품 목록 + 상세 페이지
- 로그인 → 프로필 → 설정 플로우
- 장바구니 → 결제 플로우

### Phase 구조 (전체)

```
Phase 1: Foundation (기반)
├── API 타입 정의 (user.types.ts)
├── API 서비스 클래스 (user-service.ts)
└── React Query 훅 (useUser.ts)

Phase 2: Components (컴포넌트)
├── 도메인 전용 컴포넌트 (UserProfile.tsx, UserCard.tsx)
├── 폼 컴포넌트 (UserForm.tsx)
└── 컴포넌트 테스트

Phase 3: Pages (페이지)
├── 메인 페이지 (app/users/page.tsx)
├── 상세 페이지 (app/users/[id]/page.tsx)
├── 레이아웃 (app/users/layout.tsx)
├── 로딩 UI (app/users/loading.tsx)
└── 에러 UI (app/users/error.tsx)

Phase 4: Integration (통합)
├── 네비게이션 추가 (components/navigation.tsx)
├── 권한 체크 (middleware.ts)
└── SEO 메타데이터

Phase 5: Testing & Optimization (테스트 & 최적화)
├── E2E 테스트 (e2e/users.spec.ts)
├── 성능 최적화 (이미지, 코드 스플리팅)
├── 접근성 검증
└── 모바일 반응형
```

### 파일 구조

```
# API Layer
domains/user/
├── api/
│   └── user-service.ts        # API 호출 로직
├── types/
│   └── user.types.ts          # API 타입
├── hooks/
│   └── useUser.ts             # React Query 훅
└── components/
    ├── UserProfile.tsx        # 도메인 컴포넌트
    ├── UserCard.tsx
    └── UserForm.tsx

# Page Layer
app/users/
├── page.tsx                   # 사용자 목록
├── [id]/
│   └── page.tsx              # 사용자 상세
├── layout.tsx                 # 공통 레이아웃
├── loading.tsx                # 로딩 UI
└── error.tsx                  # 에러 UI

# Test Layer
e2e/
└── users.spec.ts              # E2E 테스트

# Documentation
domains/user/docs/
└── EPIC.md                    # Epic 문서
```

### Epic 예시

템플릿 사용: `.devom/templates/EPIC-TEMPLATE-FRONTEND.md`

```bash
# Epic 생성
.devom/scripts/epic-manager.sh create "사용자 대시보드" high

# EPIC.md 파일이 템플릿 기반으로 생성됨
# 필요한 부분만 채워서 사용
```

---

## 🎯 Phase 선택 가이드

### 공통 컴포넌트 개발 시

**사용할 Phase**:
- ✅ Phase 2: Components (컴포넌트 개발)
- ✅ Phase 5: Testing (테스트 & 문서화)

**생략할 Phase**:
- ❌ Phase 1: Foundation (API 불필요)
- ❌ Phase 3: Pages (라우팅 불필요)
- ❌ Phase 4: Integration (네비게이션 불필요)

### 전체 기능 개발 시

**모든 Phase 사용**:
- ✅ Phase 1-5 전체 진행
- ✅ 각 Phase 완료 후 검증
- ✅ Phase별 코드 리뷰

---

## 📝 Epic 작성 템플릿 선택

### 방법 1: CLI로 생성 (자동으로 템플릿 적용)

```bash
# 자동으로 EPIC-TEMPLATE-FRONTEND.md 기반으로 생성됨
.devom/scripts/epic-manager.sh create "기능명" high
```

생성된 EPIC.md에서:
- 공통 컴포넌트: Phase 1, 3, 4 섹션 삭제
- 전체 기능: 템플릿 그대로 사용하고 내용 채우기

### 방법 2: 수동으로 복사

```bash
# 템플릿 복사
cp .devom/templates/EPIC-TEMPLATE-FRONTEND.md .devom/epics/EPIC-xxx/EPIC.md

# 필요 없는 Phase 섹션 삭제
# 내용 채우기
```

---

## 🔍 실전 예시

### 예시 1: Button 컴포넌트 (공통 컴포넌트)

**Epic 범위**:
- Button.tsx, Button.types.ts, Button.test.tsx, Button.stories.tsx

**Phase**:
- Phase 2: Components (구현)
- Phase 5: Testing (테스트 & Storybook)

**예상 시간**: 2-3시간

---

### 예시 2: 사용자 대시보드 (전체 기능)

**Epic 범위**:
- API 타입 + 서비스
- 컴포넌트 (UserProfile, UserStats, UserActivity)
- 페이지 (app/dashboard/page.tsx, layout.tsx)
- 네비게이션 추가
- E2E 테스트

**Phase**:
- Phase 1: Foundation (API)
- Phase 2: Components (UI)
- Phase 3: Pages (라우팅)
- Phase 4: Integration (네비게이션)
- Phase 5: Testing (E2E)

**예상 시간**: 14-18시간

---

## ✅ Checklist: Epic 타입 결정

### 질문 리스트

1. **새로운 라우트가 필요한가?**
   - YES → 전체 기능 Epic
   - NO → 다음 질문

2. **API 연동이 필수인가?**
   - YES → 전체 기능 Epic
   - NO → 다음 질문

3. **네비게이션 변경이 필요한가?**
   - YES → 전체 기능 Epic
   - NO → 다음 질문

4. **재사용 가능한 독립 컴포넌트인가?**
   - YES → 공통 컴포넌트 Epic
   - NO → 전체 기능 Epic

---

## 📚 참고 자료

- [EPIC-TEMPLATE-FRONTEND.md](../templates/EPIC-TEMPLATE-FRONTEND.md) - 전체 기능 템플릿
- [agent-system-guide.md](./agent-system-guide.md) - 에이전트 시스템 가이드
- [CLAUDE.md](../../CLAUDE.md) - DDK 메인 가이드
- [CONVENTION.md](../../CONVENTION.md) - 코드 컨벤션

---

**Version**: 1.0
**Last Updated**: 2025-11-11
