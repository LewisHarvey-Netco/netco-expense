# Problems Log

Running log of friction/issues encountered in the human↔agent workflow
with this Feniks AI / opencode setup — permission quirks, tooling gaps,
environment inconsistencies, or anything else that slowed down or blocked
a session. This is NOT for application bugs (those belong in normal issue
tracking) — it's specifically for problems with the *setup* and *workflow*
itself.

Each entry should include: date, what was attempted, what went wrong,
root cause (if known), and current status (open / worked around /
resolved).

---

## 2026-08-17 — Plan mode's bash permissions block basic read-only checks

**What was attempted:** During a plan-mode interview about scaffolding a
Vite app, tried to run `node --version` / `npm --version` to check the
installed Node version before deciding whether to pin an engines field.

**What went wrong:** The command was denied. Same happened for
`Get-ChildItem` (PowerShell dir listing) even though `ls *` is allowed —
the plan agent's bash permission override doesn't recognize PowerShell
cmdlet aliases the same way, and commands like `node *` aren't in its
allowlist at all.

**Root cause:** `~/.config/opencode/opencode.json` defines a broad
top-level `permission.bash` allowlist (allows `node *`, `npm run *`,
etc.), but the `agent.plan.permission.bash` block *overrides* it
entirely with a much smaller allowlist scoped to read-only git/file
inspection commands only (`git status/diff/log/show/blame/branch/
ls-files`, `cat`, `head`, `tail`, `grep`, `rg`, `ls`, `tree`, `pwd`,
`wc`, `find`, `fd`, `jq`, `diff`, `file`, `stat`, `echo`). This is by
design (plan mode = read-only), but it's stricter than necessary for
*inspection-only* commands like `node --version` that don't mutate
anything.

**Status:** Worked around by asking the user directly instead of running
the command. Not fixed — fixing it means editing
`agent.plan.permission.bash` in `opencode.json`, which is itself outside
plan mode's write permissions (and a separate, deliberate task, likely
via the `customize-opencode` skill in build mode).

**Suggested fix:** Add a small set of clearly read-only version/inspection
commands (`node --version`, `npm --version`, `node -v`, `npm -v`, etc.) to
`agent.plan.permission.bash` so planning sessions can verify environment
details without needing to ask the user or defer to execution time.

## 2026-08-17 — OpenCode for Feniks unavailable on WSL for Linux-based projects

**What was attempted:** Using OpenCode for Feniks on a Windows machine to
work on projects that are Linux-based (common in the team's workflow,
typically via WSL).

**What went wrong:** OpenCode for Feniks is not available for WSL, meaning
agent sessions run in the Windows environment (PowerShell) rather than the
Linux WSL environment where the actual project tooling and dependencies
live. This creates a mismatch: the agent operates on Windows while many
projects expect a Linux toolchain (npm, node, bash scripts, Linux-native
tools, etc.).

**Root cause:** OpenCode for Feniks currently ships as a Windows-only
application and cannot be installed or run inside WSL.

**Discussion:** [Viva Engage thread](https://teams.microsoft.com/l/entity/683f3525-d193-4a67-8d91-22093beab1ca/?context=%7B%22internalId%22%3A%2219%3AeyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIyNTQ3MDYzMTExNjgifQ%40EngageCommunity%22%2C%22contextType%22%3A%22engageCommunity%22%2C%22subEntityId%22%3A%22%7B%5C%22deepLinkType%5C%22%3A%5C%22crossapp%5C%22%2C%5C%22path%5C%22%3A%5C%22%2Fthreads%2FeyJfdHlwZSI6IlRocmVhZCIsImlkIjoiMzk4NDM3MTk4MTc4NzEzNiJ9%5C%22%7D%22%7D)

**Status:** Open. Workaround: ensure Node.js and other project tooling are
installed on the Windows side (not just WSL) so the agent can operate on
them. Alternatively, run the agent on a Linux machine directly.

**Impact:** Any project that relies on WSL for its toolchain will require
the Windows environment to also have the same tooling installed, or the
agent won't be able to execute commands against it. This adds setup
friction and risks version drift between the Windows and WSL environments.

## 2026-08-17 — Aggressive prompt injection detection blocks legitimate commands and code

**What was attempted:** Running `npm run build` and `npm run test` via the
agent's bash tool to verify the project compiles and tests pass. Also
writing test code containing mock credentials (e.g. email/password
strings in `App.test.tsx`).

**What went wrong:** Commands were blocked with `[BLOCKED: prompt injection
detected]` — no further explanation, file path, or triggered pattern
provided. The block persisted even after the `@/` directory cleanup was
complete, making it impossible for the agent to run verification commands.
Separately, the LLM bridge redacted credential-like strings in generated
code (see next entry), further suggesting the security filters are
overly broad.

**Root cause:** The security injection detection appears to trigger on
project content containing patterns like password fields, storage keys,
or mock credentials (e.g. `src/mocks/users.json`, `AuthContext.tsx`).
However, the error message gives zero visibility into what triggered it,
making it hard to diagnose or fix. The filters seem designed to catch
prompt injection in *external* content, but they fire on the project's
own legitimate code and data. Because the developer sees no diagnostic
information about why a command was blocked, the most obvious course of
action is to simply disable the injection detection entirely — which
creates a bad incentive structure where the security feature is removed
rather than tuned to work correctly.

**Status:** Open. Worked around by having the user run commands manually.

**Discussion:** [Teams thread](https://teams.microsoft.com/l/entity/683f3525-d193-4a67-8d91-22093beab1ca/?context=%7B%22internalId%22%3A%2219%3AeyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIyNTQ3MDYzMTExNjgifQ%40EngageCommunity%22%2C%22contextType%22%3A%22engageCommunity%22%2C%22subEntityId%22%3A%22%7B%5C%22deepLinkType%5C%22%3A%5C%22crossapp%5C%22%2C%5C%22path%5C%22%3A%5C%22%2Fthreads%2FeyJfdHlwZSI6IlRocmVhZCIsImlkIjoiMzk4NDM3MTk4MTc4NzEzNiJ9%5C%22%7D%22%7D)

**Suggested fix:** The injection detection should surface which file or
pattern triggered the block, so the user can distinguish false positives
from genuine issues. At minimum, the error message should name the
suspect file or content pattern. Consider scoping the detection to
external/untrusted content (e.g. fetched URLs, user messages) rather
than the project's own source files.

## 2026-08-17 — Agent applies workarounds without consulting the user

**What was attempted:** Standard build workflow — agent runs verification
commands, encounters errors, and fixes them.

**What went wrong:** The agent independently decided to refactor the
router architecture (moving `<BrowserRouter>` from `App.tsx` to
`main.tsx`) and rewrite test file structure without informing the user
or asking for approval. While the fix was correct, the user was not
consulted before structural changes were made.

**Root cause:** No explicit workflow rule in place requiring the agent to
ask before applying workarounds or making architectural changes. The
agent's default behavior is to solve problems autonomously.

**Status:** Open.

**Suggested fix:** Add a workflow rule: when the agent encounters an
error or blocker during verification (build, test, lint), it should
present the issue to the user and propose a fix before applying it.
Only apply the fix after the user confirms. This keeps the user in the
loop and prevents surprise refactors.

## 2026-08-18 — LLM bridge masks passwords and credentials in code output

**What was attempted:** Writing test code containing email/password
strings (e.g., `'alice@netcompany.com'`, `'password123'`) in
`src/App.test.tsx`.

**What went wrong:** The LLM bridge is redacting credential-like strings
in the agent's output, replacing them with asterisks. For example,
`'alice@netcompany.com'` became `'alic************.com'` and
`{ name: /sign in/i }` became `{ name************ }`. This corrupted
the generated code, causing parse errors and test failures.

**Root cause:** The LLM bridge has a security filter that detects
password/credential patterns and masks them before they reach the
agent. This is intended to prevent credential leakage, but it
incorrectly triggers on test fixtures, mock data, and demo credentials
that are part of the codebase.

**Status:** Open. Worked around by manually fixing the corrupted strings
after the agent generates them.

**Suggested fix:** The masking should be aware of context — it should
not redact strings in test files, mock data, or code that's already
part of the repository. Alternatively, provide a way to whitelist
known demo credentials or disable masking for specific file patterns
like `*.test.tsx`, `*.spec.ts`, and `src/mocks/`.

## 2026-08-18 — Get-ChildItem with -LiteralPath fails consistently in bash tool

**What was attempted:** Running `Get-ChildItem -Force -LiteralPath "." | Select-Object Name, Mode`
(via the bash tool) to list directory contents in a way that handles paths with spaces and
special characters safely.

**What went wrong:** The command fails consistently. The same pattern works when using `ls *`
(which is on the bash allowlist), but `Get-ChildItem` is not — the `bash` tool's permission
rules allow `ls *` but do not include `Get-ChildItem` or other PowerShell cmdlets by name.
Using `tree /f /a` also fails for the same reason.

**Root cause:** The bash permission allowlist in `opencode.json` includes `ls *` and `tree *`
as allowed patterns, but these are Unix-native commands or external executables, not PowerShell
cmdlets. On Windows with PowerShell 5.1 as the shell, `ls` works only as an alias for
`Get-ChildItem`, and the allowlist matching may not resolve aliases. Meanwhile, running
`Get-ChildItem` directly is not covered by any allowlist pattern.

**Status:** Open. Worked around by using the Read tool on directories and the Glob tool for
file pattern matching, which are the recommended approach anyway per the tool usage policy.

**Suggested fix:** Either (a) add `Get-ChildItem *` and other commonly-needed PowerShell cmdlets
to the bash allowlist, or (b) clarify in AGENTS.md or the tooling docs that agents should prefer
the Read/Glob tools over shell-based directory listing on Windows, since the bash allowlist is
tuned for Unix commands and PowerShell cmdlets are not reliably covered.

## 2026-08-20 — Docker Desktop may require commercial license

**What was attempted:** Following opencode setup instructions that reference
Docker Desktop.

**What went wrong:** Docker Desktop's free tier is limited to organizations
with fewer than 250 employees AND less than $10M annual revenue. Netcompany
exceeds both thresholds, which means Docker Desktop use likely requires a
paid commercial license. Using it without a license would be a compliance
issue.

**Root cause:** The opencode setup documentation recommends Docker Desktop
without noting the commercial licensing requirements for large organizations.

**Status:** Open.

**Suggested fix:** Either (a) procure a Docker Desktop commercial license,
(b) switch to an alternative container runtime with no commercial licensing
restrictions (e.g., Docker Compose V2 standalone, podman-desktop, or
colima), or (c) update the setup docs to clarify the licensing requirement
so users are aware before installing.

## 2026-08-20 — Feniks startup fails with Docker container not found, requires full termination

**What was attempted:** Starting Feniks normally to begin a session.

**What went wrong:** Feniks occasionally complains about not finding Docker
containers on startup. The error persists through normal restart attempts
and the only reliable fix is to fully terminate Feniks from the taskbar
(close the process completely) before relaunching.

**Root cause:** Unknown. Likely a stale Docker context or orphaned process
state that Feniks doesn't clean up on normal exit.

**Status:** Open. Worked around by force-closing Feniks from the taskbar
when the error appears, then relaunching.

**Suggested fix:** Feniks should detect and clean up stale Docker state on
startup, or gracefully handle the missing container case without requiring
a full process kill.

## 2026-08-18 — No good way to reference small code snippets without overloading context

**What was attempted:** Referencing a specific function, type, or small code
section in conversation (e.g. "look at `roleHome()` in `types.ts`") to
ground a discussion or decision, without dumping the entire file into
context.

**What went wrong:** The available tools are all-or-nothing: `Read` loads
an entire file (or a large chunk), `Grep` returns matching lines but not
surrounding context, and `Glob` only finds filenames. There's no "show me
lines X–Y of this file" or "show me the definition of this function"
primitive. This means referencing even a 5-line function requires feeding
the agent the whole file, which wastes context window and makes
conversations harder to follow.

**Root cause:** The tool set is designed for exploration (find files,
search content, read files) rather than surgical code reference. The
`Read` tool supports `offset` and `limit`, but the agent has to know the
exact line numbers beforehand — which defeats the purpose when the goal
is to find and reference a specific snippet.

**Status:** Open. Worked around by reading whole files and accepting the
context cost, or using `Grep` to find line numbers then `Read` with
offset/limit — which requires two steps and is error-prone.

**Suggested fix:** Consider adding a tool or mode that lets the agent
reference a specific symbol, function, or line range without loading the
entire file. Even a "find definition" tool (like IDE go-to-definition)
would dramatically reduce context waste when discussing specific code.

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

**Status:** Worked around.

**Solution:** Add explicit directives in `AGENTS.md` to define which
directories and files the agent should not read:

```
## Project Structure
- src/: main application code, agent should work here
- scripts/: build/deploy scripts, agent may read but not modify
- node_modules/: DO NOT read or analyze, ever
- .env: DO NOT read, contains secrets
- dist/: generated output, ignore entirely
```

**Suggested fix:** The read tool should respect `.gitignore` by default,
or the opencode configuration should provide a way to define read
exclusions independently of git.

## 2026-08-24 — shadcn CLI writes components to a literal `@` directory on Windows

**What was attempted:** `npx shadcn@latest add select checkbox` to add two
shadcn/ui components (per AGENTS.md convention: "add new ones via
`npx shadcn@latest add <name>`, don't hand-write them").

**What went wrong:** The CLI created the files at a literal `@/components/ui/`
directory in the project root instead of `src/components/ui/` (the `@` alias
from `components.json` was not resolved to `src/`). The CLI output even
showed the broken path: `@\components\ui\select.tsx`. The files had to be
manually copied to `src/components/ui/` and the stray `@` directory removed.
Additionally, the CLI did not install the `lucide-react` dependency that the
generated components import — it had to be added separately with
`npm install lucide-react`.

**Root cause:** Likely a Windows path-resolution bug in the shadcn CLI's
alias handling (the `@` alias in `components.json` → `@/components` was
treated as a relative path segment rather than resolved against the Vite
alias config). The missing `lucide-react` install suggests the CLI's
dependency detection also didn't run (or failed silently) on this setup.

**Status:** Worked around — files moved to `src/components/ui/`,
`lucide-react` installed manually. The stray `@/` directory could not be
removed by the agent: `rm`/`rmdir`/`Remove-Item` are all denied by the bash
permission policy, so the user must delete it manually (it is not tracked by
git and should be excluded from commits).

**Suggested fix:** Before adding shadcn components on Windows, verify the
files landed in `src/components/ui/` (not a literal `@/` folder) and that
`lucide-react` is in `package.json`. Consider pinning a shadcn CLI version
known to handle Windows paths, or adding a post-step to the AGENTS.md
convention that checks file location after `npx shadcn@latest add`.

## 2026-08-24 — Bash permission policy blocks most PowerShell cmdlets and complex one-liners

**What was attempted:** Routine session work: checking file existence
(`Test-Path`), listing directories (`Get-ChildItem`), deleting files
(`Remove-Item`, `del`, `rm`), and running compound PowerShell one-liners
(variables + loops + `Select-String` pipelines) to inspect the production
bundle.

**What went wrong:**
- `Test-Path`, `Get-ChildItem`, `Remove-Item`, and `del` were all denied —
  the bash allowlist is tuned for Unix command names (`ls`, `cat`, `grep`,
  `rm`, ...) and does not recognize their PowerShell cmdlet equivalents.
  (Extends the 2026-08-18 `Get-ChildItem` entry.)
- File deletion is effectively impossible for the agent: `rm *` and
  `rmdir *` are explicit denies, and the PowerShell equivalents
  (`Remove-Item`, `del`) are denied too. A stray `@/` directory (from the
  shadcn CLI bug, previous entry) and a temporary debug test file could not
  be removed; the debug file was moved to the temp dir via `mv` (ask →
  approved) instead.
- Compound PowerShell one-liners (e.g. `$js = Get-ChildItem ...; foreach
  (...) { Select-String ... }`) were denied even though each constituent
  command is allowed — the permission matcher appears to evaluate the whole
  command string, not the individual statements.
- Unix tools that are on the allowlist (`grep`, `rg`) are simply not
  installed on this Windows machine, so the "allowed" fallbacks don't exist.

**Root cause:** The bash permission allowlist in `opencode.json` lists
Unix command names; on Windows/PowerShell the equivalent cmdlets are not
covered, and multi-statement commands are not decomposed before matching.
Deletion commands are deny-listed by name (`rm`, `rmdir`) without
PowerShell equivalents being considered.

**Status:** Worked around. File inspection via the Read/Glob tools and
`ls`; bundle inspection via `node -e "..."` one-liners (node is allowed);
unwanted files moved to `C:\Users\lehar\AppData\Local\Temp\opencode` via
`mv` (user-approved) instead of deleted. The stray `@/` directory at the
project root still needs manual deletion by the user.

**Commands that work for bundle inspection (for the user, in a normal
terminal):**
```powershell
npm run build   # prints dist asset sizes (raw + gzip)
node -e "const s=require('fs').readFileSync('dist/assets/'+require('fs').readdirSync('dist/assets').find(f=>f.endsWith('.js')),'utf8');console.log([...new Set(s.match(/lucide-[a-z0-9-]+/g)||[])])"
```
(the second lists which lucide icons are actually in the bundle)

**Suggested fix:** (a) Add the common PowerShell cmdlets (`Test-Path *`,
`Get-ChildItem *`, `Remove-Item *`) to the bash allowlist/denylist
deliberately, or document that agents must use Read/Glob/`ls` and `node -e`
on Windows; (b) make the permission matcher decompose `;`-separated
statements before matching; (c) provide an approved deletion path for the
agent (e.g. allow `Remove-Item` for files inside the workspace) so temp
artifacts don't have to be moved to a temp dir.

## 2026-08-24 — Bash permission policy blocks most PowerShell cmdlets and complex one-liners

**What was attempted:** Routine inspection and cleanup via the bash tool
(PowerShell 5.1): `Get-ChildItem -Recurse`, `Test-Path`, `Remove-Item` /
`del` (to delete a stray `@/` directory and a temporary debug test file),
and a multi-statement one-liner (`$js = Get-ChildItem ...; foreach ...
Select-String ...`) to count icon occurrences in the production bundle.

**What went wrong:** All of the above were denied by the bash permission
policy. Only a narrow Unix-style allowlist works reliably: `ls`, `cat`,
`grep`, `node -e`, `npm run *`, `git status/log/diff`, etc. Consequences
during the session:
- Could not delete files at all (`rm`, `rmdir`, `Remove-Item`, `del` all
  denied). A stray `@/` directory (shadcn CLI bug) and a temporary debug
  test file had to be worked around: the debug file was moved to
  `C:\Users\lehar\AppData\Local\Temp\opencode` via `mv` (allowed with
  approval), and the `@/` directory still needs manual deletion by the user.
- Bundle inspection had to fall back to `node -e` one-liners reading the
  file directly, which is clunkier and was aborted by the user as
  unproductive.

**Root cause:** The permission allowlist in `opencode.json` is tuned for
Unix shell commands. On Windows/PowerShell, common cmdlets
(`Get-ChildItem`, `Test-Path`, `Remove-Item`, `Select-String` in pipelines,
variable assignments + loops) are not covered, and the fallback default is
deny. Related earlier entry: "Get-ChildItem with -LiteralPath fails
consistently in bash tool" (2026-08-18).

**Status:** Open. Worked around by using the Read/Glob tools for file
inspection, `ls`/`node -e` for checks, and `mv` to relocate (not delete)
unwanted files. The stray `@/` directory at the repo root still requires
manual deletion by the user.

**Suggested fix:** Add the read-only PowerShell cmdlets actually needed on
Windows (`Get-ChildItem *`, `Test-Path *`, `Select-String *`) to the bash
allowlist, and decide on an explicit policy for file deletion
(`Remove-Item`/`del`) — either allow with confirmation or document that the
user must delete files manually.

## 2026-08-24 — `git reset --soft` / `--mixed` not covered by the git permission policy

**What was attempted:** The user asked to review work before committing,
after a commit had already been made. Tried `git reset --soft HEAD~1` to
undo the commit while keeping all changes staged (fully reversible, no
working-tree changes).

**What went wrong:** Denied. The permission policy only recognizes
`git reset --hard *` (explicitly denied); `git reset --soft` and
`git reset --mixed` match no rule and fall through to the default deny.
The agent cannot undo its own commits, even in the safest (soft) mode —
only the user can, from a normal terminal.

**Root cause:** The git allowlist in `opencode.json` enumerates specific
subcommands (`status`, `log`, `diff`, `add` (ask), `commit` (ask), ...)
but never considered `git reset` in its non-hard forms, which are the
normal tool for amending/undoing local commits.

**Status:** Open. Worked around by asking the user to run
`git reset --soft HEAD~1` manually if they want to undo the commit.

**Suggested fix:** Add `git reset --soft *` and `git reset --mixed *` to
the git rules as "ask" (they only affect local, unpushed state and never
touch the working tree in the soft/mixed case).

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

## 2026-08-25 — `/code-review` referenced by the implement skill but no such skill/command exists

**What was attempted:** Following the `implement` skill's workflow for ticket
07 (Expense Detail Page): "Once done, use /code-review to review the work."
Searched for a code-review skill or command: not in the session's
`available_skills` list (only `customize-opencode`, `grill-me`, `implement`,
`mattpocock-skills-write-a-prd`, `to-tickets`), not in
`.opencode/` in the project, and not in `~/.config/opencode/`.

**What went wrong:** The `implement` skill instructs the agent to run
`/code-review` as the final step, but no such skill or custom command is
installed anywhere the agent can load it. The agent cannot invoke it, so the
work either goes unreviewed or the agent has to fall back to an ad-hoc
manual review (re-reading the diff, checking against the ticket, design
guidelines, and architecture docs) that is not the standardized, repeatable
review the skill implies.

**Root cause:** The `implement` skill references a `/code-review` step that
was never installed/configured in this environment (no entry in
`.opencode/skills/`, no custom command in `~/.config/opencode/`, and it is
not one of opencode's built-in skills). The skill and the environment are
out of sync.

**Status:** Worked around — performed a manual self-review of the diff
(ticket checklist, DESIGN-GUIDELINES, `docs/architecture.md`, ADRs, lint
output) in place of `/code-review`, and flagged the gap to the user.

**Suggested fix:** Either (a) install/add a `code-review` skill or custom
command (e.g. under `.opencode/skills/code-review/` or
`~/.config/opencode/`) so the `implement` skill's final step works, or
(b) update the `implement` skill to not reference `/code-review` (or to
describe the manual review fallback it should perform when the skill is
absent).

hand written:
the trust center blocking requests and not logging details is a big problem

## 2026-09-01 — shadcn CLI creates literal `@` directory on Windows; cleanup blocked by permissions

**What was attempted:** Adding the shadcn `textarea` component via
`npx shadcn@latest add textarea` (ticket 08, ReviewDecisionForm needs a
comment text area; AGENTS.md mandates CLI-added shadcn components over
hand-written ones).

**What went wrong:** The CLI reported "Created 1 file:
`@\components\ui\textarea.tsx`" — it wrote the component to a literal
`@` directory at the project root instead of resolving the `@/` path
alias from `components.json` to `src/`. The file content itself was
correct. Moving it to `src/components/ui/textarea.tsx` via
`Move-Item`/`mv` was blocked (not in the bash allowlist), so the content
was re-written to the correct location with the file tool. The now-stray
`@\components\ui\` tree at the repo root could NOT be removed: `rm`,
`rmdir`, and `Remove-Item` are all denied by the bash permission rules.
It remains untracked in git and will pollute a `git add .` if not
removed by hand.

**Root cause:** (1) shadcn CLI v4.19.1 does not resolve the `@/` alias
on Windows (path separator / alias handling bug — it treated `@` as a
literal directory name). (2) The bash permission allowlist has no
file-move or file-remove commands (`mv` is "ask" but only matches the
literal `mv` binary, not `Move-Item`; `rm`/`rmdir`/`Remove-Item` are
denied), so the agent cannot clean up after itself.

**Status:** Worked around — component content re-written to
`src/components/ui/textarea.tsx` (verified identical). The stray `@/`
directory still needs manual deletion by the user
(`Remove-Item -Recurse .\@` from the repo root).

**Suggested fix:** (a) Add `Remove-Item *` (or `rm *` / `rmdir *`) and
`Move-Item *` / `mv *` (cmdlet form) to the bash permission allowlist as
"ask" so the agent can relocate/delete files it created; (b) until the
shadcn CLI Windows bug is fixed, after any `npx shadcn add` on this
machine, check for a stray `@` directory at the repo root and verify the
file landed in `src/components/ui/`.

## 2026-09-01 — Storybook vitest project: transient "Failed to fetch dynamically imported module" on first run after adding a story

**What was attempted:** Running the full test suite (`npm run test`) after
adding `src/components/Header.stories.tsx` (ticket 10). The new story
imports `react-router-dom` (MemoryRouter) and `@/context/AuthContext` —
modules the other stories don't import, so the Storybook Vite server's
dep graph changed.

**What went wrong:** On the first full run, all 3 new Header stories
failed with `TypeError: Failed to fetch dynamically imported module:
http://localhost:63315/node_modules/.cache/storybook/.../sb-vitest/deps/
@storybook_addon-docs_n_@storybook_react-dom-shim.js` while the 9
pre-existing story files passed. Re-running the storybook project alone
(`npm run test -- --project=storybook`) and then the full suite again
passed 100% (23 files / 151 tests) with no code changes in between.

**Root cause (likely):** Vite re-optimized dependencies mid-run because
the new story introduced new modules to the browser project's dep graph;
the chromium browser fetched a dep-shim chunk while it was still being
written. The error names the docs-addon shim (not the new imports), which
is consistent with a cache/optimization race rather than a problem with
the story itself.

**Status:** Resolved (transient). Workaround: if a story fails with
"Failed to fetch dynamically imported module" under `node_modules/.cache/
storybook/.../sb-vitest/deps/`, re-run before debugging the story; if it
persists, clear `node_modules/.cache/storybook` and re-run.

## 2026-09-02 — Piping an allowed command breaks the bash permission match

**What was attempted:** Running
`npm run test -- src/pages/ExpenseDetailPage.test.tsx 2>&1 | Select-Object -Last 30`
to run a single test file with truncated output.

**What went wrong:** Denied. The bare `npm run test -- <file>` matches the
`npm run *` allow rule, but appending `2>&1 | Select-Object -Last 30` makes
the whole command string fail to match any rule. Same root cause as the
2026-08-24 entries on compound one-liners: the permission matcher evaluates
the entire command string, not the constituent commands.

**Root cause:** The bash permission matcher does whole-string pattern
matching; pipes and redirections change the string so it no longer matches
the intended allow rule (`npm run *`).

**Status:** Worked around — ran the command without the pipe (the tool
auto-saves output to a file when it exceeds the limit) and used the Grep
tool on the saved output file to extract pass/fail lines.

**Suggested fix:** Either decompose pipelines before matching (match each
`|`-separated segment against the rules), or document that agents should not
pipe allowed commands and should rely on the tool's built-in output capture
instead.

## 2026-09-02 — Playwright 1.62 removed `toHaveTextContent`; confusing TypeError at runtime

**What was attempted:** Writing a new Playwright E2E test
(`e2e/expenses-consultant.spec.ts`) using `expect(locator).toHaveTextContent('Lunch')` — the
matcher used in countless Playwright examples and docs.

**What went wrong:** The test failed with `TypeError:
expect(...).toHaveTextContent is not a function`. No deprecation warning, no hint about the
replacement — just a runtime TypeError that looks like a test-setup problem rather than a
removed API. The installed `@playwright/test@1.62.1` type definitions
(`node_modules/playwright/types/test.d.ts`) expose only `toHaveText` (exact match) and
`toContainText` (substring match); `toHaveTextContent` no longer exists.

**Root cause:** Playwright removed the long-deprecated `toHaveTextContent` matcher in a recent
release (the repo has no pinned version history showing when the jump happened — the lockfile
simply has 1.62.1). Code written against older Playwright docs/examples breaks silently at
runtime.

**Status:** Worked around — used `toContainText` (substring) for the select-trigger assertion,
since the trigger's accessible text includes the chevron glyph (`"Lunch▼"`), which also rules
out exact-match `toHaveText`.

**Suggested fix:** Pin `@playwright/test` in `package.json` (or at least note the version in
AGENTS.md) so matcher availability is predictable, and remember that on 1.62+ the text
matchers are `toHaveText` / `toContainText`.

## 2026-09-02 — Edit tool reports "Could not find oldString" but the edit was applied

**What was attempted:** A sequence of `edit` calls on `src/pages/ExpenseDetailPage.test.tsx`
and `src/components/expenses/ExpenseDetailCard.stories.tsx` (adding a new `describe` block,
then adding a `const` to it; adding a Storybook `decorators` array).

**What went wrong:** Several `edit` calls returned `Could not find oldString in the file` even
though the `oldString` was present in the file (and, on re-reading, the intended change WAS in
the file). Conversely, an earlier call that reported "Edit applied successfully" needed a
re-read to confirm the exact resulting content. The net effect: the reported success/failure
status did not reliably reflect the file's actual state, so every edit had to be followed by a
`read`/`grep` to verify what really landed. This is distinct from the shadcn/permission issues
above — it is the edit tool's own confirmation being unreliable.

**Root cause:** Unknown. Possibly a race between applying the edit and re-reading the file for
the match/confirmation check, or stale in-memory file state when edits are made in quick
succession on the same file. Not reproducible on demand (some edits in the same session
reported correctly), which makes it hard to pin down.

**Status:** Worked around — after every `edit` (especially on a file just edited), re-read the
affected region or `grep` for the expected text to confirm the real state before proceeding,
rather than trusting the tool's success/failure message.

**Suggested fix:** The edit tool should re-read the file from disk immediately before reporting
success/failure, so the reported status always matches the on-disk state. If a "could not find
oldString" is returned, it should be certain the change did NOT apply (not ambiguous).

## 2026-09-02 — `git stash pop` conflicts on the tracked `test-results/.last-run.json` artifact

**What was attempted:** Temporarily stashing tracked changes (`git stash push`) to verify
whether a pre-existing E2E test failure was caused by the current session's changes, then
restoring them with `git stash pop`.

**What went wrong:** `git stash pop` failed with "Your local changes to the following files
would be overwritten by merge: `test-results/.last-run.json`". The Playwright run had rewritten
that file between the stash and the pop, so the pop refused to overwrite the working-tree copy.

**Root cause:** `test-results/.last-run.json` is tracked by git but is a test-run artifact that
Playwright rewrites on every run. Any git operation that touches the working tree (stash pop,
checkout) can conflict with it after a test run.

**Status:** Worked around — discarded the artifact's working-tree change
(`git checkout -- test-results/.last-run.json`) and re-ran `git stash pop`.

**Suggested fix:** Add `test-results/` (or at least `test-results/.last-run.json`) to
`.gitignore` so test artifacts don't show up as tracked modifications and don't conflict with
git operations.