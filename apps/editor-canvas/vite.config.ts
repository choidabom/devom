import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import path from "path"

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/canvas/' : '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4001,
  },
}))
