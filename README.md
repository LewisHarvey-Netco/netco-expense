# Netco Expense App

A demo expense tracking application built to experiment with Feniks AI capabilities.

## Overview

This repository serves as a playground for exploring and demonstrating what Feniks AI can do when building real-world applications.

## Tech Stack

- Vite 8
- React 19
- TypeScript 6
- npm
- oxlint (linter)
- React Router v7 (classic JSX API)
- Tailwind v4 + shadcn/ui (New York style, lucide-react icons) — shadcn is a copy-paste CLI, not a traditional library. Components live in `src/components/ui/` so you own the source and can modify it freely.
- clsx + tailwind-merge — `cn()` utility in `src/lib/utils.ts` for safely merging Tailwind classes, used by all shadcn components
- react-hook-form + zod (form handling & validation)
- Vitest + React Testing Library (testing)

## Getting Started

```
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run test`, `npm run preview`.

## Project Structure

```
src/
  components/       # Reusable UI components
    ui/             # shadcn/ui components (add via `npx shadcn@latest add <name>`)
  context/          # React contexts (AuthContext, etc.)
  lib/              # Utility functions (cn helper, etc.)
  mocks/            # Mock data (hardcoded users, etc.)
  pages/            # Page components (routes)
```

## Configuration Files

| File | Description | Docs |
|------|-------------|------|
| `vite.config.ts` | Vite dev server, plugins, and `@` path alias | [Vite Config](https://vite.dev/guide/) |
| `vitest.config.ts` | Vitest test runner: jsdom environment, setup files, globals | [Vitest Config](https://vitest.dev/config/) |
| `tsconfig.json` | Project references pointing to app and node configs | [TS Project Refs](https://www.typescriptlang.org/docs/handbook/project-references.html) |
| `tsconfig.app.json` | TypeScript for app source: JSX, path aliases, strict checks | [TS Compiler Options](https://www.typescriptlang.org/tsconfig/) |
| `tsconfig.node.json` | TypeScript for config files: Node module resolution | [TS Compiler Options](https://www.typescriptlang.org/tsconfig/) |
| `.oxlintrc.json` | oxlint rules: react hooks, component export warnings | [oxlint Docs](https://oxc.rs/docs/guide/usage/lint/rules.html) |
| `components.json` | shadcn/ui CLI: style, path aliases, icon library | [shadcn Docs](https://ui.shadcn.com/docs/cli) |

## License

Internal use only — Netcompany.
