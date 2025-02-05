import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const ABSOLUTE_PATH_REGEX = /^(?:\/|(?:[A-Za-z]:)?[/\\|])/;
const RELATIVE_PATH_REGEX = /^\.?\.(\/|$)/;

export const isAbsolute = (path: string): boolean =>
  ABSOLUTE_PATH_REGEX.test(path);
export const isRelative = (path: string): boolean =>
  RELATIVE_PATH_REGEX.test(path);

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: (id: string): boolean => !isAbsolute(id) && !isRelative(id),
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "chunk-[name].js",
      },
    },
  },
});
