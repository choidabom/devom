import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
// https://ko.vite.dev/config/#conditional-config

export default defineConfig({
  plugins: [react()] as PluginOption[],
  server: {
    fs: {
      allow: [".."],
    },
  },
  publicDir: "dist",
});
