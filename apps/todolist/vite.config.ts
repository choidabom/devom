import { isAbsolute, isRelative } from "@devom/utils";
import react from "@vitejs/plugin-react";
import { type PluginOption, defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      rollupTypes: true,
    }),
  ] as PluginOption[],
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"],
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: (id: string): boolean => !isAbsolute(id) && !isRelative(id),
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "chunk-[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
