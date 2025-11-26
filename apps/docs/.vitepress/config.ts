import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "docs",
  description: "devom's development notes",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Home", link: "/dev/laboratory" }],

    sidebar: [

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
