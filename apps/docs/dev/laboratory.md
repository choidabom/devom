# Laboratory

개발 실험 및 학습 기록. 프로젝트별 작업 히스토리와 참고 도구 모음.

## Projects

### Archive

아카이브 웹사이트.

**완료된 작업**

- ~~archive 페이지 디자인 개선~~ (25.11.17)
- ~~Calendar (가제:날짤) 추가~~ (25.11.19)
- ~~Clarity 등록 및 GA4, GTM 연결~~ (25.11.20)
- ~~Next.js로 이사/배포(Github Pages)~~ (25.11.26)
- ~~local HTTPS 개발 환경 구축~~ (25.11.29)
- ~~Next.js에서 Vite로 전환~~ (모노레포 구조) (25.12.19)
- ~~Supabase OAuth 인증 + TanStack Query 도입~~ (25.12.19)
- ~~archive UI redesign v1~~ (26.02.02)
- ~~React best practices agent skills 추가~~ (26.01.19)
- ~~CONVENTION.md, .claude/agents/code-reviewer.md 추가~~ (26.02.03)
- ~~guestbook 추가~~ (26.02)

**진행 예정**

- mini-terminal: 브라우저 내 터미널 에뮬레이터 기능 추가

### Docs

VitePress 기반 기술 문서 사이트. 개발 가이드, 설정 최적화, 배포 워크플로우 등을 정리.

**작성 예정**

- TypeScript 설정 최적화 문서 작성
- GitHub Pages로 배포 가이드 작성
- Vite 개발 환경 최적화 문서 작성
- Blog screenshot automation 가이드 작성
- 모노레포로 애플리케이션 분리 문서 작성
- Dev Server 실험 문서 작성
- 성능 최적화 과정 정리

### Deploy Server

GitHub 웹훅 기반 자동 배포 시스템. PR별 프리뷰 환경 구축 및 브랜치 기반 배포 자동화 실험.

**상태**: 기획 및 실험 단계

### Home Server

개인 홈 서버 구축 실험.

**상태**: 기획 단계

## Reference Tools

개발 과정에서 유용한 도구 및 학습 자료 모음.

### Build & Tooling

- **[tsconfig cheat sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet)**
  TypeScript 컴파일러 옵션 치트시트. Matt Pocock의 Total TypeScript 프로젝트.

- **[pnpm catalogs](https://pnpm.io/catalogs)**
  pnpm workspace에서 의존성 버전을 중앙 집중식으로 관리하는 기능.

- **[bunchee](https://github.com/huozhi/bunchee)**
  설정 없이 사용 가능한 npm 패키지 번들러. Zero-config로 ESM/CJS 동시 빌드 지원.

- **[tsup](https://github.com/egoist/tsup)**
  esbuild 기반 TypeScript 라이브러리 번들러. 빠른 빌드 속도와 간단한 설정.

- **[tsx](https://tsx.is/)**
  Node.js에서 TypeScript를 즉시 실행하는 도구. ts-node의 빠른 대안.

### React & State Management

- **[TanStack Query](https://tanstack.com/query/latest)**
  서버 상태 관리 라이브러리. 캐싱, 동기화, 업데이트를 자동으로 처리.
  - [한국어 튜토리얼](https://github.com/ssi02014/react-query-tutorial)

- **[React 로컬 개발 서버](https://maxkim-j.github.io/posts/local-dev-server)**
  로컬 개발 환경에서 HTTPS, CORS, 프록시 등을 설정하는 방법.

### Learning Resources

- **[프론트엔드 프레임워크 만들기](https://mfrachet.github.io/create-frontend-framework/)**
  React와 같은 프론트엔드 프레임워크를 직접 구현하며 내부 동작 원리를 이해하는 튜토리얼.

---

_마지막 업데이트: 2026년 2월 23일_
