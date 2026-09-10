---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
license: MIT
metadata:
  version: "1.0"
  maintainer: Feniks AI Team
  last_updated: "2026-09-02"
  categories: productivity, implementation
  scope: global:preference
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

When you change an E2E spec, or code that an E2E spec covers, run the affected E2E spec(s) right after the change — do not defer E2E verification to the final full run.

New components should be added to storybook

**Before making any refactoring, architectural change, or structural modification:**
Summarize why the change is needed, what will be refactored, and the impact on existing code. Present this to the user and wait for approval before proceeding. Do not apply large-scale changes without consent.

If you are blocked from running a command due to permission issues or other blocks, flag the problem to the user and ask for directions on how to proceed. Give recommendations.

Once done, use /code-review to review the work.

DONT commit your work, the user will review.