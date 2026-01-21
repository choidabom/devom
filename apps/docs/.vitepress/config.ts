import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "docs",
  description: "devom's development notes",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    outline: {
      label: '' // "On this page" 제목 제거
    },
    nav: [{ text: "Home", link: "/dev/laboratory" }],

    sidebar: [
      {
        text: "Agent Skills",
        items: [
          { text: "Overview", link: "/skills/" },
          {
            text: "React Best Practices",
            collapsed: false,
            items: [
              {
                text: "Async & Parallelization",
                collapsed: true,
                items: [
                  { text: "Promise.all() 병렬 처리", link: "/skills/react-best-practices/async-parallel" },
                  { text: "필요할 때까지 await 지연", link: "/skills/react-best-practices/async-defer-await" },
                  { text: "의존성 기반 병렬 처리", link: "/skills/react-best-practices/async-dependencies" },
                  { text: "API 라우트 워터폴 방지", link: "/skills/react-best-practices/async-api-routes" },
                  { text: "전략적 Suspense 경계", link: "/skills/react-best-practices/async-suspense-boundaries" },
                ],
              },
              {
                text: "Bundle Optimization",
                collapsed: true,
                items: [
                  { text: "배럴 파일 임포트 피하기", link: "/skills/react-best-practices/bundle-barrel-imports" },
                  { text: "동적 임포트로 코드 스플리팅", link: "/skills/react-best-practices/bundle-dynamic-imports" },
                  { text: "서드파티 라이브러리 지연 로딩", link: "/skills/react-best-practices/bundle-defer-third-party" },
                  { text: "조건부 모듈 로딩", link: "/skills/react-best-practices/bundle-conditional" },
                  { text: "사용자 의도 기반 프리로드", link: "/skills/react-best-practices/bundle-preload" },
                ],
              },
              {
                text: "Server-Side Performance",
                collapsed: true,
                items: [
                  { text: "React.cache()로 중복 제거", link: "/skills/react-best-practices/server-cache-react" },
                  { text: "요청 간 LRU 캐싱", link: "/skills/react-best-practices/server-cache-lru" },
                  { text: "RSC 경계 직렬화 최소화", link: "/skills/react-best-practices/server-serialization" },
                  { text: "컴포넌트 구성으로 병렬 페칭", link: "/skills/react-best-practices/server-parallel-fetching" },
                  { text: "after()로 논블로킹 작업", link: "/skills/react-best-practices/server-after-nonblocking" },
                ],
              },
              {
                text: "Client-Side",
                collapsed: true,
                items: [
                  { text: "SWR로 자동 중복 제거", link: "/skills/react-best-practices/client-swr-dedup" },
                ],
              },
              {
                text: "Rendering & Re-render",
                collapsed: true,
                items: [
                  { text: "content-visibility로 긴 리스트 최적화", link: "/skills/react-best-practices/rendering-content-visibility" },
                  { text: "메모이제이션된 컴포넌트로 추출", link: "/skills/react-best-practices/rerender-memo" },
                  { text: "Transitions로 비긴급 업데이트", link: "/skills/react-best-practices/rerender-transitions" },
                ],
              },
            ],
          },
        ],
      },
      {
        text: "Development Notes",
        items: [
          { text: "laboratory", link: "/dev/laboratory" },
          // { text: "TypeScript 설정 최적화", link: "/dev/tsconfig-optimization" },
          // { text: "GitHub Pages로 배포", link: "/dev/github-pages-deployment" },
          // { text: "Vite 개발 환경 최적화", link: "/dev/vite-development-setup" },
          // { text: "Blog screenshot automation", link: "/dev/screenshot-updater" },
          // { text: "모노레포로 애플리케이션 분리", link: "/dev/monorepo-setup" },
          // { text: "Dev Server 실험", link: "/dev/dev-server-experiment" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/choidabom/devom" }],
  },
});
