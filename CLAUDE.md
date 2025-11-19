# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo project organized with pnpm workspaces. The repository contains a portfolio/archive website, documentation site, and a deployment server experiment.

## Key Commands

### Development

```bash
pnpm dev                    # Start archive app (default)
pnpm build                  # Build archive app
pnpm build:packages         # Build all packages (@devom/*)
pnpm lint                   # Run ESLint and Prettier together
pnpm lint:eslint            # Run ESLint with auto-fix
pnpm lint:prettier          # Format with Prettier
```

### Application-specific commands

```bash
pnpm --filter @devom/archive dev       # Run archive app (Vite, default)
pnpm --filter @devom/tracker dev       # Run tracker app (Next.js)
pnpm --filter @devom/docs dev          # Run docs (VitePress)
pnpm --filter @devom/archive build     # Build specific app
```

### Workspace shortcuts

```bash
pnpm archive                # Alias for archive workspace commands
pnpm archive dev            # Same as pnpm --filter @devom/archive dev
```

## Architecture

### Monorepo Structure

#### Applications

- **apps/archive**: portfolio/archive website (PRIMARY PACKAGE)
  - Vite + React 19 + TypeScript
  - macOS-inspired desktop UI with draggable windows
  - Embeds blog posts and documentation as "applications"
  - Development uses Vite dev server
  - Includes VitePress docs build as dependency

- **apps/tracker**: Bitcoin investment tracker
  - Next.js 15 + React 19 + TypeScript
  - Tracks Bitcoin purchases and calculates ROI
  - Uses Tailwind CSS v4, shadcn/ui components
  - Form handling with react-hook-form + Zod
  - Development uses Next.js Turbopack

- **apps/docs**: VitePress documentation site
  - Development notes and technical documentation
  - Exported as static HTML for embedding in archive
  - Includes deployment guides, setup instructions, and TODO lists

- **deploy-server**: Experimental branch-based deployment automation
  - Fastify-based webhook server
  - Handles GitHub webhooks for automatic PR preview deployments
  - Docker-based build and deployment pipeline
  - Traefik integration for subdomain routing
  - **Status**: Planning/experimental phase

#### Support Packages

- **packages/utils**: Shared utility library
  - Vite-based build with TypeScript declaration files
  - Reusable functions across applications

- **packages/ts-config**: Shared TypeScript configurations
  - Base tsconfig for all packages
  - Ensures consistent TypeScript settings

- **packages/api**: API utilities (if applicable)
  - Shared API client or utilities

### Archive-Specific Features

#### Desktop UI Pattern

- Draggable, resizable windows using custom RnD (React-n-Drag) component
- Window controls: minimize, maximize, close
- Context-based application state management
- Desktop metaphor with application icons

#### Embedded Applications

- **Resume**: CV/portfolio content
- **Blog**: Embedded blog posts viewer
- **Docs**: VitePress documentation viewer (embedded from apps/docs build output)

### Tracker-Specific Features

#### Core Functionality

- Bitcoin purchase tracking (date, amount, price)
- Real-time ROI calculation
- Investment history management
- Data persistence (localStorage or similar)

#### UI Components

- shadcn/ui component library
- Radix UI primitives
- Lucide React icons
- Form validation with Zod schemas

### Docs-Specific Features

#### Documentation Structure

- `/dev/` - Development notes
  - Monorepo setup guide
  - Deployment workflows
  - Configuration optimization guides
  - Screenshot automation tools

### Key Patterns

- **Path aliases**: Most apps use `@/*` mapping to `./src/*`
- **Catalog versioning**: pnpm catalog feature for dependency management
  - `react18` and `react19` catalogs for React version management
  - Shared dev tool versions (vite, typescript, tailwindcss, etc.)
- **Workspace protocol**: Internal dependencies use `workspace:*`
- **Only pnpm**: Enforced via preinstall hook (`npx only-allow pnpm`)

### Package Manager

- **Required**: pnpm 10.10.0+ (enforced via packageManager field)
- **Catalog feature**: Centralized dependency version management in `pnpm-workspace.yaml`

## Environment Variables

Archive app may require:

- TBD (check `apps/archive/.env.example` if exists)

Tracker app may require:

- TBD (check `apps/tracker/.env.example` if exists)

Deploy-server requires:

- `GITHUB_WEBHOOK_SECRET`: HMAC signature verification
- `REPO_SSH_URL`: Git repository SSH URL
- `WORK_DIR`: Build workspace directory
- `BASE_DOMAIN`: Base domain for preview environments
- `DEFAULT_BRANCH`: Default branch name (e.g., `main`)
- `ALLOWED_BRANCH_REGEX`: Branch filtering regex
- `GITHUB_TOKEN`: Optional, for GitHub API integration
- `REGISTRY`: Docker registry (optional)
- `PORT`: Server port (default: 3000)

## Important Files

- `pnpm-workspace.yaml`: Workspace configuration and catalog definitions
- `eslint.config.mjs`: Shared ESLint configuration
- `package.json`: Root package with shared scripts and dev dependencies
- `apps/archive/vite.config.ts`: Archive app Vite configuration
- `apps/tracker/next.config.js`: Tracker app Next.js configuration
- `apps/docs/.vitepress/config.ts`: VitePress documentation config
- `deploy-server/README.md`: Deployment automation documentation

## Development Workflow

### Adding a New Package

1. Create directory in `packages/` or `apps/`
2. Add package.json with name `@devom/package-name`
3. Use `workspace:*` for internal dependencies
4. Use catalog versions where applicable: `"typescript": "catalog:"`

### Working with Archive App

The archive app is the primary application:

1. Run `pnpm dev` (defaults to archive)
2. Automatically builds docs on start
3. Desktop UI manages embedded applications

### Working with Tracker App

1. Run `pnpm --filter @devom/tracker dev`
2. Uses Turbopack for fast refresh
3. Tailwind v4 with PostCSS

### Working with Documentation

1. Run `pnpm --filter @devom/docs dev`
2. Edit markdown files in `apps/docs/`
3. VitePress hot-reloads changes
4. Build output is consumed by archive app

## Code Style

- **Formatter**: Prettier with default settings
- **Linter**: ESLint with Next.js config and Prettier integration
- **Pre-commit**: Husky + lint-staged for automatic formatting
- **TypeScript**: Strict mode with shared tsconfig

## Common Tasks

### Building Everything

```bash
pnpm build:packages    # Build all @devom/* packages
pnpm build             # Build archive app (default)
```

### Linting and Formatting

```bash
pnpm lint              # Run ESLint and Prettier together (auto-fix)
pnpm lint:eslint       # Run ESLint with auto-fix only
pnpm lint:prettier     # Format with Prettier only
```

### Adding Dependencies

For a specific package:

```bash
pnpm --filter @devom/archive add react-router-dom
```

Using catalog versions:

```bash
# In package.json:
{
  "dependencies": {
    "typescript": "catalog:"
  }
}
```

## Deployment

- **Archive**: Static site, can be deployed to any static host
- **Tracker**: Next.js app, requires Node.js runtime or edge deployment
- **Docs**: Static VitePress site, embedded in archive
- **Deploy-server**: Experimental, see `deploy-server/README.md`

## Notes for Claude

- Archive app is the primary/default app when user says "dev server" or "build"
- Tracker is a separate Next.js app, not integrated with archive yet
- Deploy-server is experimental - refer to its README for implementation plans
- Use catalog versions from `pnpm-workspace.yaml` when adding common dependencies
- All apps use TypeScript strict mode
- React 19 is the target version for new development
