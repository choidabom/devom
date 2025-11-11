# @devom

> AI-Powered Frontend Monorepo with DDK (Devom Development Kit)

Next.js 15 + TypeScript + Shadcn UI 기반의 프론트엔드 모노레포입니다.
**DDK (Devom Development Kit)**를 통해 AI 에이전트가 자동으로 코드를 생성하고 관리합니다.

---

## ✨ 특징

### 🤖 AI 에이전트 기반 개발

- **component-writer**: React 컴포넌트 자동 생성
- **hook-writer**: 커스텀 훅 자동 생성
- **storybook-writer**: Storybook 스토리 자동 생성
- **code-reviewer**: 자동 코드 리뷰

### 📋 Epic-Driven Workflow

- Epic 단위로 기능 관리 (큰 기능 → 작은 Task로 분해)
- Phase별 병렬 개발 (여러 파일 동시 작업)
- 자동화된 테스트 & 문서화

### 🛠️ 최신 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI**: Shadcn UI + Radix Primitives
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Testing**: Vitest + React Testing Library
- **Quality**: ESLint + Prettier + Husky

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
pnpm dev          # 개발 서버 시작 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm lint         # Lint 체크
pnpm format       # 코드 포맷팅
pnpm test         # 테스트 실행
```

---

## 🤖 DDK 시작하기

### 1. Epic 생성 (AI가 자동으로 작업 분해)

```bash
# 새로운 기능 Epic 생성
.devom/scripts/epic-manager.sh create "사용자 대시보드" high

# Epic 목록 확인
.devom/scripts/epic-manager.sh list

# Epic 상세 보기
.devom/scripts/epic-manager.sh show EPIC-xxx
```

### 2. Epic 타입 선택

#### 📦 공통 컴포넌트 (Button, Modal 등)

- **Phase**: Components + Testing
- **예상 시간**: 2-4시간
- **사용 예**: Button, Input, Card, Modal 등

#### 🎯 전체 기능 (Dashboard, 인증 시스템 등)

- **Phase**: Foundation → Components → Pages → Integration → Testing
- **예상 시간**: 12-20시간
- **사용 예**: 사용자 대시보드, 로그인 플로우, 상품 관리 등

자세한 내용: [epic-types.md](.devom/docs/epic-types.md)

### 3. AI 에이전트에게 요청

Epic을 생성하면 Claude가 자동으로:

1. 필요한 파일 목록 파악
2. 여러 에이전트를 병렬로 실행
3. 컴포넌트, 훅, 테스트 자동 생성
4. 코드 리뷰 수행
5. Storybook 문서화

---

## 📚 Documentation

### 🎯 필수 문서 (먼저 읽으세요!)

1. **[CONVENTION.md](./CONVENTION.md)** - 코드 컨벤션 (Next.js 15 + TypeScript)
2. **[CLAUDE.md](./CLAUDE.md)** - DDK 시스템 완전 가이드
3. **[agent-system-guide.md](.devom/docs/agent-system-guide.md)** - 에이전트 동작 원리

### 📖 개발 가이드

- [coding-rules.md](.devom/docs/coding-rules.md) - 코딩 표준 (TypeScript, React, Next.js)
- [component-patterns.md](.devom/docs/component-patterns.md) - 컴포넌트 패턴 (RSC, Client Component)
- [testing-patterns.md](.devom/docs/testing-patterns.md) - 테스트 패턴 (Vitest, RTL)
- [epic-types.md](.devom/docs/epic-types.md) - Epic 유형 선택 가이드

---

## 📁 Project Structure

```
devom/
├── apps/                         # 애플리케이션
│   └── archive/                  # 아카이브 앱 (Next.js 15)
│
├── packages/                     # 공유 패키지 (Monorepo)
│   ├── ui/                       # UI 컴포넌트 라이브러리
│   ├── hooks/                    # 커스텀 훅
│   ├── stores/                   # Zustand 상태 관리
│   ├── utils/                    # 유틸리티
│   └── types/                    # 공유 타입
│
├── .claude/                      # AI 에이전트 정의
│   └── agents/
│       ├── component-writer.md  # React 컴포넌트 작성 에이전트
│       ├── hook-writer.md       # 커스텀 훅 작성 에이전트
│       ├── storybook-writer.md  # Storybook 작성 에이전트
│       └── code-reviewer.md     # 코드 리뷰 에이전트
│
├── .devom/                       # DDK 시스템
│   ├── docs/                     # 개발 문서
│   ├── scripts/                  # CLI 도구
│   │   ├── epic-manager.sh      # Epic 관리
│   │   └── task-manager.sh      # Task 관리
│   ├── templates/                # Epic 템플릿
│   └── epics/                    # Epic 작업 디렉토리 (gitignored)
│
├── CONVENTION.md                 # 코드 컨벤션
├── CLAUDE.md                     # DDK 가이드
└── README.md                     # 이 파일
```

## 🧩 Apps & Packages

### Apps

- `apps/archive`
  - React 19 + Vite + Tailwind 기반 데스크톱 UI 실험 공간입니다.
  - 창 관리, 드래그 인터랙션, 포트폴리오/블로그 뷰어 컴포넌트 등을 포함합니다.
  - `@devom/docs`를 의존하여 정적 문서 번들을 함께 제공하며, `pnpm --filter @devom/archive dev`로 개발 서버를 실행합니다.
- `apps/docs`
  - VitePress 2로 구성된 문서 사이트로, DDK 사용 가이드와 레퍼런스를 제공합니다.
  - `pnpm --filter @devom/docs dev`로 로컬 미리보기, `pnpm --filter @devom/docs build`로 정적 파일을 생성합니다.
- `apps/tracker`
  - Next.js 15 App Router 기반 비트코인 포트폴리오 트래커입니다.
  - 실시간 시세 조회(`useBitcoinPrice`), 투자 기록 CRUD(`useInvestments`), Shadcn UI Sheet를 활용한 폼 워크플로우를 제공합니다.
  - `pnpm --filter @devom/tracker dev`로 개발 서버, `pnpm --filter @devom/tracker build`로 프로덕션 번들을 생성합니다.

### Packages

- `packages/api`
  - GitHub Actions 배포 워크플로우 실험용 데모 패키지입니다.
  - `scripts/deploy.js`를 통해 `dev`, `alpha`, `real` 스테이지 별 모의 배포 구성을 검증합니다.
- `packages/utils`
  - 클라이언트 유틸 모음으로, 안전한 Storage 팩토리(`safeLocalStorage`, `safeSessionStorage`), 범위 보정 함수(`inrange`), 경로 유효성 검사(`isAbsolute`, `isRelative`)를 제공합니다.
  - 모든 유틸은 `pnpm --filter @devom/utils build`로 번들링되며, `@devom/ts-config`를 공유하여 타입 정의를 함께 배포합니다.
- `packages/ts-config`
  - `base.json`, `react.json`, `library.json`, `node.json` 등 상황별 타입스크립트 설정을 제공합니다.
  - 패키지와 앱은 필요한 설정을 조합해 일관된 타입 검사를 유지합니다.

---

## 🎯 Workflow 예시

### 예시 1: Button 컴포넌트 만들기 (2시간)

```bash
# 1. Epic 생성
.devom/scripts/epic-manager.sh create "Button 컴포넌트" medium

# 2. Claude에게 요청
"Button 컴포넌트를 만들어줘. primary, secondary, danger variants 필요해."

# 3. AI가 자동으로 생성
# - Button.tsx (컴포넌트)
# - Button.types.ts (타입)
# - Button.test.tsx (테스트)
# - Button.stories.tsx (Storybook)
# - 코드 리뷰 통과

# 4. 완료! 🎉
```

### 예시 2: 사용자 대시보드 만들기 (14시간)

```bash
# 1. Epic 생성
.devom/scripts/epic-manager.sh create "사용자 대시보드" high

# 2. Claude에게 요청
"사용자 대시보드 페이지 만들어줘. 프로필, 활동 내역, 설정 포함."

# 3. AI가 Phase별로 작업
# Phase 1: API 타입, React Query 훅
# Phase 2: UserProfile, UserStats 컴포넌트
# Phase 3: /dashboard/page.tsx 페이지
# Phase 4: 네비게이션 추가, 권한 체크
# Phase 5: E2E 테스트, 성능 최적화

# 4. 완료! 🎉
```

---

## 🔧 Commands

### Epic 관리

```bash
# Epic 생성
.devom/scripts/epic-manager.sh create "기능명" [priority]

# Epic 목록
.devom/scripts/epic-manager.sh list

# Epic 상세
.devom/scripts/epic-manager.sh show [EPIC-ID]

# Epic 완료
.devom/scripts/epic-manager.sh complete [EPIC-ID]
```

### 개발 명령어

```bash
# 개발 서버
pnpm dev

# 빌드
pnpm build

# 테스트
pnpm test              # 모든 테스트
pnpm test:watch        # Watch 모드
pnpm test:coverage     # 커버리지

# 코드 품질
pnpm lint              # Lint 체크
pnpm lint:fix          # Lint 자동 수정
pnpm format            # Prettier 포맷팅
pnpm type-check        # TypeScript 타입 체크
```

---

## 💡 Why DDK?

### 기존 개발 방식

```
요구사항 분석 (1시간)
  ↓
컴포넌트 설계 (2시간)
  ↓
컴포넌트 구현 (3시간)
  ↓
테스트 작성 (2시간)
  ↓
Storybook 작성 (1시간)
  ↓
코드 리뷰 (1시간)
────────────────
총 10시간
```

### DDK 개발 방식

```
Epic 생성 (5분)
  ↓
Claude에게 요청 (30초)
  ↓
AI 자동 생성 (10분)
  ↓
검토 및 조정 (30분)
────────────────
총 45분 🚀
```

### 장점

- ⚡ **빠른 개발**: 10배 빠른 속도
- 🎯 **일관된 품질**: 코딩 규칙 자동 준수
- 📚 **자동 문서화**: Storybook + JSDoc
- ✅ **자동 테스트**: 80%+ 커버리지
- 👥 **쉬운 협업**: Epic 단위 작업

---

## 📖 Learn More

### 공식 문서

- [Next.js Documentation](https://nextjs.org/docs) - Next.js 공식 문서
- [Shadcn UI](https://ui.shadcn.com/) - UI 컴포넌트 라이브러리
- [Radix Primitives](https://www.radix-ui.com/) - 접근성 우선 컴포넌트
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Zustand](https://zustand-demo.pmnd.rs/) - 상태 관리

### DDK 문서

- [CLAUDE.md](./CLAUDE.md) - DDK 완전 가이드
- [agent-system-guide.md](.devom/docs/agent-system-guide.md) - 에이전트 동작 원리
- [epic-types.md](.devom/docs/epic-types.md) - Epic 유형 가이드

---

## 🤝 Contributing

1. Epic 생성 (`epic-manager.sh create`)
2. 브랜치 생성 (`git checkout -b feature/EPIC-xxx`)
3. DDK로 개발
4. 코드 리뷰 (자동)
5. PR 생성

자세한 내용은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

---

## 📄 License

MIT

---

**Version**: 1.0.0
**Last Updated**: 2025-11-11
**Powered by**: [DDK (Devom Development Kit)](./CLAUDE.md)
