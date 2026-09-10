# Problems Log

This directory contains logs of friction/issues encountered during the Feniks AI-assisted development of the netco-expense project.

## Files

- **open-problems.md** — Current open and worked-around issues that still need fixes or developer workarounds
- **closed-problems.md** — Historical record of problems that have been resolved or fixed

## Organization

Problems are categorized into three types:

1. **Developer Workflow Adjustments** — Issues that the developer can address through configuration or practice changes, without requiring changes to Feniks AI itself.

2. **Feniks AI / Tooling Fixes Needed** — Issues that require changes to Feniks AI, opencode configuration, or their design. These cannot be resolved by the developer alone and need fixes from the Feniks AI team.

3. **Non-AI Related Problems** — Upstream tool issues (shadcn, Playwright, Vite, etc.) or generic programming problems that would occur regardless of whether an AI agent is involved.

## Adding Problems

When encountering a new issue:

1. Determine which file it belongs in (open-problems.md or closed-problems.md based on status)
2. Determine which category (Developer Workflow, Feniks AI Fixes, or Non-AI)
3. Add an entry with: date, what was attempted, what went wrong, root cause (if known), and status
4. Include impact, solutions, or developer actions as applicable
