# Closed Problems Log

Historical record of problems that have been resolved or fixed during the project.

---

# Developer Workflow Adjustments

## 2026-08-24 — Read tool bypasses .gitignore via absolute path

**What was attempted:** Relying on `.gitignore` to prevent the agent from
reading sensitive or irrelevant files (e.g., `node_modules/`, `.env`,
`dist/`).

**What went wrong:** The read tool can access files by absolute path even
when they are listed in `.gitignore`. The `.gitignore` file has no effect
on the agent's file read permissions.

**Root cause:** `.gitignore` only controls git tracking, not tool-level
file access. The read tool operates on the filesystem directly and does
not consult `.gitignore`.

**Status:** Fixed.

**Solution:** Added explicit read/write exclusions to `AGENTS.md` under Project Structure:

```
Agent read/write permissions:
- src/: main application code, agent should work here
- scripts/: build/deploy scripts, agent may read but not modify
- node_modules/: DO NOT read or analyze, ever (bloats context, no useful information)
- .env: DO NOT read, contains secrets (blocked by security policy)
- dist/: DO NOT read, generated output (ignored by git, bloats context)
- test-results/: DO NOT read, test artifacts only (regenerated on every test run)
```

Each rule includes reasoning so the agent understands the *why* behind the exclusion.
Case study section "Guarding Against Context Bloat" documents the principle: preventive
documentation prevents per-session corrections and saves context window.

---

# Feniks AI / Tooling Fixes Needed

## 2026-08-17 — Bash permission policy blocking PowerShell cmdlets

**What was attempted:** Common Windows inspection tasks: checking file existence
(`Test-Path`), listing directories (`Get-ChildItem`), and running multi-statement
PowerShell one-liners with pipes and variables.

**What went wrong:** All were denied. The bash allowlist is tuned for Unix command names
(`ls`, `cat`, `grep`, `rm`, etc.) and does not recognize their PowerShell cmdlet equivalents
(`Get-ChildItem`, `Test-Path`, `Remove-Item`). Multi-statement one-liners with pipes and
variables are also denied even when constituent commands are allowed.

**Root cause:** The bash permission allowlist in `opencode.json` lists Unix command names;
on Windows/PowerShell the equivalent cmdlets are not covered. The permission matcher evaluates
the entire command string as a whole and does not decompose statements before matching. This
reflects OpenCode's Unix-centric heritage—Feniks forked it for Windows but did not fully adapt
the permission model.

**Status:** Resolved (workflow documented).

**Solution:** Rather than modifying permission rules (which could introduce security gaps),
added explicit guidance to AGENTS.md:

> **Windows shell note:** On Windows, use Read and Glob tools instead of PowerShell cmdlets.
> The bash permission policy is tuned for Unix commands. For file inspection, use the Read
> tool on directories and Glob for pattern matching. For complex queries, use `node -e`
> instead of multi-statement PowerShell pipelines.

This eliminates wasted attempts on denied commands and guides the agent to use the correct
tools from the start. Case study section "Guarding Against Context Bloat" documents the
principle: documenting tool constraints prevents per-session corrections.

---

# Non-AI Related Problems

## 2026-08-24 — Storybook vitest project fails on aria-query `elementRoles` import (pre-existing)

**What was attempted:** Running the full test suite (`npm run test`) after
implementing ticket 05 (filter logic + FilterPanel). The suite has two
projects: jsdom (unit/component tests) and storybook (runs every
`.stories.tsx` in headless chromium via `@storybook/addon-vitest`).

**What went wrong:** All 7 story files fail (including the 6 that existed
before this session's changes — Button, Card, Input, Alert, Badge,
ExpenseTable) with the same infrastructure error:

```
Error: Failed to import test file
  .../@storybook/addon-vitest/dist/vitest-plugin/setup-file-with-project-annotations.js
Caused by: SyntaxError: The requested module
  '/node_modules/aria-query/lib/index.js' does not provide an export named 'elementRoles'
```

The jsdom project passes fully (60/60 tests).

**Root cause (corrected):** NOT a version mismatch. The installed
`aria-query@5.3.0` does export `elementRoles` (verified in its CJS build).
The real cause: the storybook project runs in a real browser (chromium via
`@vitest/browser-playwright`). `@testing-library/dom` (imported by the
Storybook setup file) does ESM named imports from CJS-only packages
(`aria-query`, `lz-string`). Vite's dep scanner only scans app entry points,
not test/setup files, so those CJS deps were never pre-bundled — Vite served
the raw CJS files to the browser, whose native ESM loader can't read CJS
`exports.x` as named exports. Hence "does not provide an export named
'elementRoles'" (and, once that was fixed, the same error for `lz-string`).
Verified pre-existing and unrelated to this session's code: the 6 story files
that existed before ticket 05 failed identically, and `git diff
package-lock.json` showed the only lockfile change was `lucide-react`.

**Status:** Resolved.

**Solution:** Add the CJS deps (and the ESM package that imports them) to
`optimizeDeps.include` in `vitest.config.ts` so Vite pre-bundles them into
proper ESM for the browser:

```ts
optimizeDeps: {
  include: ['@testing-library/dom', 'aria-query', 'lz-string']
}
```

After this, the full suite passes: 15/15 test files, 87 tests (63 jsdom +
24 storybook/chromium).

**Note:** If a new CJS-only dep is later pulled in by the Storybook setup or
a test file, the same "does not provide an export named X" error will recur
in the storybook project — add that package to `optimizeDeps.include` too.
