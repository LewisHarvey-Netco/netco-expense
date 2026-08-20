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
- Vitest + React Testing Library (unit/component testing)
- @vitest/ui — browser dashboard for test results and DOM snapshots, run with `npm run test:ui`
- Playwright (E2E browser testing)

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for how the app is structured (routing, auth/context, forms, testing) and [`docs/decisions/`](docs/decisions/) for the reasoning behind key architectural choices.

## Prototype

A static HTML/CSS prototype has been built to explore user flows, interaction patterns, and UI design before writing React code.

**Location:** `prototype/` directory

**What's inside:**
- Consultant views (submit expenses, batch upload, manage templates, track flagged receipts)
- Finance views (review queue, approve/reject, statistics dashboard)
- Daily food cap tracking and warnings
- Communication threads between consultants and finance
- Multi-receipt batch upload with editable fields
- Expense type templates

**How to run:**
```
npx serve prototype
```
Then open `http://localhost:3000` or navigate directly to `prototype/index.html` in your browser.

**Quick start:**
- Visit `prototype/index.html` for a guided tour of all features
- Login as consultant: use `john@netcompany.com`
- Login as finance: use `finance@netcompany.com`
- All forms and inputs are live — no data is persisted across page refreshes

## Getting Started (React App)

```
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run test`, `npm run test:ui`, `npm run test:e2e`, `npm run test:e2e:headed`, `npm run preview`.

## Project Structure

```
src/
  components/       # Reusable UI components
    ui/             # shadcn/ui components (add via `npx shadcn@latest add <name>`)
  context/          # React contexts (AuthContext, etc.)
  lib/              # Utility functions (cn helper, etc.)
  mocks/            # Mock data (hardcoded users, etc.)
  pages/            # Page components (routes)
e2e/                # Playwright E2E tests
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
| `playwright.config.ts` | Playwright E2E test runner: Chromium, screenshots on failure, auto-starts dev server | [Playwright Config](https://playwright.dev/docs/test-configuration) |

## License

Internal use only — Netcompany.
