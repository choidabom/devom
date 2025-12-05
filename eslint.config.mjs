import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"
import importPlugin from "eslint-plugin-import"

const eslintConfig = [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/build/**", "**/*.config.*", "**/public/**", "**/.*/**", "**/out"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      "prefer-const": "error",
      "no-var": "error",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // Node.js 스크립트 파일에서 require 허용
    files: ["**/scripts/**/*.js", "**/deploy.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
  {
    // 개발 도구나 유틸리티 파일에서 console 허용
    files: ["**/utils/**/*.ts", "**/hooks/**/*.ts", "**/captureScreenshot.ts"],
    rules: {
      "no-console": "off",
    },
  },
]

export default eslintConfig
