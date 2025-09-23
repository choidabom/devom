import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "docs",
  description: "devom's development notes",
  // archive 앱에서 iframe으로 사용하기 위해 항상 /docs/ base 사용
  base: "/docs/",
  outDir: "../archive/dist/docs",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Home", link: "/" }],

    sidebar: [
      {
        text: "Development Notes",
        items: [
          { text: "Todo List", link: "/todo-list" },
          { text: "Dev Server 실험", link: "/dev-server-experiment" },
        ],
      },
      {
        text: "Completed Tasks",
        items: [
          { text: "모노레포로 애플리케이션 분리", link: "/monorepo-setup" },
          { text: "GitHub Pages로 배포", link: "/github-pages-deployment" },
          { text: "TypeScript 설정 최적화", link: "/tsconfig-optimization" },
          { text: "Vite 개발 환경 최적화", link: "/vite-development-setup" },
          { text: "Blog screenshot automation", link: "/screenshot-updater" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/choidabom/devom" }],
  },
});
