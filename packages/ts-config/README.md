# @devom/ts-config

This package provides a set of separated tsconfig.json options that can be combined and used according to the situation.

## Configuration Files

- `base.json`: Basic settings (common to all projects)

- `library.json`: Settings for package or library development

- `node.json`: Settings for Node.js environment

- `react.json`: Settings for React projects

## Usage Explanation

In this repository, all packages using TypeScript extend a shared TypeScript configuration from @devom/ts-config. This ensures consistency across different packages while allowing individual projects to customize their configurations as needed.

### 1. Extends @devom/ts-config/base.json

```json
// packages > utils > tsconfig.json
{
  "extends": "@devom/ts-config/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

This means the package inherits the base TypeScript configuration defined in @devom/ts-config/base.json.

### 2. Extends Multiple Configs

```json
// apps > todolsit > tsconfig.json
{
  "extends": ["@devom/ts-config/react.json", "@devom/ts-config/library.json"],
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- `@devom/ts-config/react.json`: Likely contains settings optimized for a React project (e.g., JSX support, stricter type checking).
- `@devom/ts-config/library.json`: Include settings for building a library, such as declaration file generation.

## Detail

[상황별 tsconfig.json 설정하기](https://bo5mi.tistory.com/270) written by @choidabom
