# Feniks AI Case Study – Netco Expense POC

## Executive Summary

Netco-expense is a frontend-only POC expense app built almost entirely with Feniks Build (OpenCode for Feniks), covering requirements elicitation, prototyping, and full implementation with a multi-layer test suite (unit, component, E2E, visual). It was built to stress-test Feniks as an agentic development tool, not to ship a product.

**Net finding:** Feniks is effective at both planning/analysis and well-scoped implementation, when paired with a deliberate workflow, small vertical-slice tickets, TDD as the specification, and explicit human approval gates before any architectural change. As a concrete data point, one full feature (finance expense review: 11 tickets, 25 user stories, two pages, full test coverage) took roughly 12 hours of human-supervised agentic development, against a rough estimate of 3 days for the same scope built by hand. Model choice mattered: Claude 4.5 was used for planning/analysis (grill-me → PRD → tickets), Qwen 3.6 on-prem for implementation once tickets were well-defined, larger models were stronger at synthesis, on-prem models were faster once the task was unambiguous.

**Where it fell short:**

- **Visual/design iteration:** no image feedback loop meant Feniks routinely hallucinated the current UI state, making small visual tweaks slow and error-prone (see [Design and Prototyping](#feniks-prototyping---problems)).
- **Unsupervised architectural decisions:** left alone, the agent occasionally made structural changes (e.g. moving router setup, restructuring tests) without asking. This was mitigated by adding an explicit approval gate to the `implement` skill (see [Configuring Workflows to Keep Developers in the Loop](#configuring-workflows-to-keep-developers-in-the-loop)).
- **Tooling gaps:** no WSL support, opaque prompt-injection blocking with no diagnostics, and a skill library with no guidance on which skill to use when (just a flat, disconnected collection) all created friction that required workarounds rather than fixes — these are gaps in the tool itself, not the workflow, and need a Feniks-team fix (see [Known Tool Limitations](#known-tool-limitations)).

**Practices that made the biggest difference:** vertical-slice tickets sized to a single context window, TDD as an unambiguous spec for the agent to satisfy, keeping the developer in the loop specifically for strategic/architectural decisions (not tactical ticket work), and documenting project and tool-specific gotchas directly in `AGENTS.md` rather than re-correcting the agent each session.

This document works through each stage of that workflow with concrete examples, then closes with known tool limitations and setup details for teams considering the same approach. The [Appendix](#appendix) contains the full `AGENTS.md` and the exact skill definitions (grill-me, write-a-prd, to-tickets, implement) used throughout, for teams wanting to reuse them directly.

## Introduction

### Intended Audience

This document is intended for those working in technical delivery that are considering using Feniks Build to support software design and development.

This document intends to provide a clear example of operational usage of Feniks Build to develop software, including demonstrate key benefits, known limitations, and some concrete practices for working with it. It also addresses some gaps in the workflow that need further investigation.

### Feniks Build and Agentic AI

Throughout, this document covers problems and benefits with Feniks AI specifically, as well as to Agent assisted development in general, distinguishing between the two were appropriate.

### How Referencing Works in This Document

Two kinds of links are used throughout:

- **Bracketed citations**, e.g. **[AG]** or **[FA]**, refer to external source documents (Netcompany user guides). The bracket tag is a lookup key: find the full title and link for that source in the [References](#references) section near the end of the document.
- **Inline `(see ...)` links** point to other headers within this same document (e.g. "(see [Design and Prototyping](#feniks-prototyping---problems))"). These are standard markdown anchor links generated from the target section's heading text — clicking them (or searching the doc for that heading) jumps you to the relevant section.

## Project Overview

### What is the project?

Netco-expense is a proof of concept for a Netcompany expense app (like Continia). The system allows consultants to submit expenses, and finance staff to review and reject/accept them. It was built specifically for testing the usage of Feniks AI and not intended to be released.

### Tech Stack

| Name                  | Usage                               | Category            |
| --------------------- | ----------------------------------- | ------------------- |
| React 19              | Javascript library for stateful UIs | Functionality       |
| Typescript 6          | Typed Javascript                    | Functionality       |
| React Router 7        | Page Routing                        | Functionality       |
| React-hook-form       | Form handling and validation        | Functionality       |
| Shadcn                | Prebuilt copy paste UI components   | Functionality/Style |
| Tailwind 4            | Utility classes for css styling     | Style               |
| NPM                   | Package manager and script running  | Build & Test        |
| Oxlint                | Linting react issues – hook misuse  | Build & Test        |
| React-testing-library | Unit and integration tests          | Build & Test        |
| Storybook 10          | Visual component library            | Build & Test        |
| Playwright            | End to end tests                    | Build & Test        |

## Feniks Build Usage

Feniks Build was used extensively throughout development (analysis, design, build and test). The goal was to test the effectiveness of Feniks as an agentic programming tool as much as possible.

Later sections on planning, designing and building cover specifics on Feniks AI usage (skills, agents, models, etc).

### Limitations of Case Study

It's important to note that there are clear limitations to this case study that impact its reliability in demonstrating the usage of Feniks Build:

- **Project context:** The lack of real project constraints is beneficial for exploration of the tool usage, but on a real project there will be problems and requirements that have not been simulated.
- **Scale:** The expense app is a simple MVP, which means it's likely there are problems with Feniks usage/workflow that would only manifest once the size of the project increases.
- **Frontend only:** The backend is mocked with a repository pattern. Frontend components call repository methods exposed through a shared application context. The injected implementation is an in-memory dataset loaded from a JSON file of expenses. This lets the frontend interact with data exactly as it would with a real backend, where a real implementation of the repository would make RESTful calls to an API instead of reading from memory. This allowed the frontend to be built realistically without a backend.
- **Single Contributor:** As Feniks AI has only been worked on by a single contributor, it's possible there are issues with agentic programming that only emerge with larger team sizes, which won't be captured here.

## Getting Started with Feniks Build

Setup needs to be done by each developer, on their local machine. The process is well covered by **[FA]**.

Once Feniks AI is installed and setup, users can choose whether to interact with the Graphical Interface, or the Terminal Interface. Sessions and capabilities are shared between interfaces, so users can switch back and forth as they like.

On the Feniks Build LLM-Bridge tab, you can enable or disable individual modules (some are mandatory and cannot be turned off); changes take effect immediately without restarting the Bridge **[FA]**. You can then start adding skills from the skill library, configuring MCPs etc as defined in the User Guide **[FA]**.

### Graphical Interface

To use the Graphical Interface, the user can run the program "OpenCode for Feniks", (searchable in the start bar).

### Terminal Interface

To use the terminal interface, open PowerShell, navigate to the root directory of the project you're working on, and run the command `opencode`.

During this MVP development the terminal interface was used.

## Requirements and Planning

To start work on Netco expense, requirements elicitation was conducted to understand the user needs the product aimed to meet. Consultants who submit expenses at Netcompany acted as proxies for future users, allowing the elicitation process to be simulated. For the finance side, assumptions were made about needs (there are likely gaps) but this was sufficient to establish a foundational understanding to kick off development.

Initial work began by writing free form descriptions of how the Continia expense app is used, and any possible pain point areas that users often experience that could be addressed. These descriptions were enhanced by experimenting with the Continia app, and taking notes as common tasks were performed, to help identify more potential improvements.

At this point, a decent, unstructured understanding existed of the actions that the application needs to facilitate, problems with UX to avoid, and key benefits of the existing system. The initial input is found at `docs/init-requirements.md`.

### Using Feniks to convert notes to user stories

Feniks Build was used to convert unstructured notes into user stories the app needed to meet.

This was done using the grill-me skill from the skill library (popularised by Matt Pocock) with the Qwen 3.6 on-prem model. This skill is designed to get the AI to relentlessly interview the developer until a shared understanding of the task/subject has been established. The skill was invoked with a prompt that contained all the initial loose requirements, and an explanation of the goal: to create a structured list of user stories.

The agent asked a series of clarifying questions about the user needs and queried the developer on potential additions. For each question, the developer provided responses one at a time until a shared understanding was established (or the developer requested to finish).

After a shared understanding was established, the agent produced a list of user stories in a markdown document (`/docs/user-stories.md`) which was reviewed by the developer for any inaccuracies/improvements then committed to the repo.

This engagement with Feniks Build resulted in a clear, well formatted list of user needs to move forward with. Using Feniks allowed the developer to transform loose notes into structured, referenceable user stories much more quickly than doing it by hand. The workflow used here was loose, and a clearer, systematic approach could have been useful for better results (using a common skill to write user stories for example, enforcing more rigid structure). But in this case, since the developer was manually reviewing and adjusting the complete list of user stories, the developer had control and insight into the output of the activity rather than the process, giving confidence that the work done was of sufficient quality.

In a real project, these user stories could continue to be kept in markdown, or could be migrated to JIRA for sharing across the project, using the jira-mcp.

## Design and Prototyping

With the user stories developed, prototypes were drawn up to get a view of how the requirements could be met with a solution. The prototyping method used in projects depends on a few key considerations:

- Are the prototypes to be maintained long term?
- What level of interactivity and fidelity is needed?
- What tooling is the designer familiar with?
- How quickly are they needed?

### Using Feniks to prototype

The designer first added `design-guidelines.md`, which takes content from Netcompany Brand Guide V.02.02_2023-11-30.pdf as a baseline style guide. Then Qwen was prompted without a skill, telling it to build a full prototype that met the user requirements and followed the design guidelines. This was a very open request, but this was intentional as the output was for ideation, not a product to be delivered.

The prototype was manually reviewed, and a few follow up prompts were used to refine some features.

This end prototype provided enough design to start building an MVP (source code) (hosted prototype).

### Feniks Prototyping - What worked well

Feniks Build enabled the designer to build relatively high fidelity prototypes (with linking between pages etc) in a very small amount of time. Because the prototype was not meant to be maintained at this stage, code quality issues could be disregarded and a version of the product could be built end to end quickly. Iteration on the prototype could be continuously added by Feniks Build, allowing high speed iteration with high fidelity.

### Feniks Prototyping - Problems

Feniks worked well for ideation and planning, not for design artifact creation. It generated interactive HTML fast enough to walk through user flows and validate architecture decisions.

The lack of image feedback was a real bottleneck. When asked to describe a screenshot of the current prototype, Feniks hallucinated details that weren't there. This meant every small visual change required describing the current state in text, which was slow and error prone. Trying to make small UI tweaks was a long and tedious process, where it often executed changes on a prompt incorrectly, requiring many iterations for changes that would usually only take a few minutes in a tool like figma (adding spacing and margin for example).

To improve this workflow, an agent would need either: (1) the ability to view and iterate on visual output directly, or (2) a constrained component library that limits the scope of possible changes. This would reduce the back-and-forth needed for visual refinement.

Apps like Claude Design support more fine grain workflows, where designers can prompt for visual changes, but also use a Figma-like interface to make small adjustments (such as spacing, font size, borders etc) and output the design as standalone html to be used as visual feedback by coding agents that have capabilities to look at images.

## Build and Testing

With user stories and a prototype in place, iterative implementation and validation began. The development approach was explicitly agentic: Feniks Build was used to generate code at high speed, paired with multi-layered testing to catch regressions early. **[AG]** frames self-validation loops (build, test, lint, fix, repeat) as one of the highest-leverage patterns available for agentic work; this project's multi-layer test suite (unit, component, E2E) applies that same feedback-loop principle across several layers rather than a single check.

The key insight was to break down work into small vertical slices before touching the code, each feature cutting through the full stack (state, types, forms, tests) in a single small, demoable increment. This allowed the developer to validate end-to-end work early and catch architectural issues before they compounded. This is similar to none agentic best practice, where teams often endevour to break Jira tickets into vertical slices with a cap on the amount of story points per ticket. 

The workflow that was followed:

- **grill-me:** the agent interviews the developer to extract requirements and agree on handling edge cases
- **write-a-prd:** The agent takes the grill-me findings as input and rewrites as a PRD (product requirements document) detailing user stories, components to build etc.
- **to-tickets:** The agent takes the PRD as input and creates a vertical-slice ticket breakdown with explicit blocking dependencies. The developer reviews and alters the slices before moving on.
- **implementation with TDD:** code was written at pre-agreed seams following practices established in readme.md and architecture.md. Validation was performed via unit, component, and E2E tests.

This cycle was repeated for each major feature.

Claude 4.5 was used for the planning and analysis activities, then Qwen (on prem) was used for actual implementation once the tasks were very clearly defined. Larger models like Claude often performed better at pulling together lots of information and conducting analysis, while Qwen could finish tasks more quickly, but needed well-defined tasks to remain useful. It's likely that the on prem models (e.g Qwen) could also perform some of the analysis if it's broken up into small chunks, especially once the repository has a well-defined Agents.md, and well-organized documentation on architectural patterns and principles that can be enforced as part of the skill.

### Building the Finance Review Pages – Grill-me (Planning mode, Claude 4.5)

For the grill-me session, the related user stories, the prototype designs and some guidance on scope were fed in with model Claude 4.5 selected. The agent asked several clarifying questions, for example:

- What sections of the prototype are in scope?
- Do finance staff need to provide a reason for flagging an expense?
- Should the daily food caps be implemented at this point?

For each question, the developer performed manual analysis and provided answers that clarified the task, building a better shared picture of the problem space.

The agent walked through 13 distinct architectural and UI decisions (routing structure, status workflow, filter triggers, data model fields, component choices) and recorded each one with rationale. The entire exchange took about 30 minutes and produced a 370-line decision document that locked in the shared understanding, which was saved to the repository as a markdown document.

Saving the output into a markdown document provides several benefits:

1. The content can be referred to later to remember why decisions were made
2. The content can be used in subsequent follow up tasks (like enhancing documentation) after the implementation is done
3. A new session can be started to move on to the next step of the process, where this document is fed in and otherwise a completely fresh context window is available

This last point is important when considering the advice often given around keeping context small and highly relevant. To quote **[AG]** (page 13): "The context window is a finite and expensive resource: filling it with irrelevant files or stale history degrades reasoning quality and increases cost. Filling it with the right, highly relevant information is often the single most impactful improvement you can make to agent performance." This practice—separating concerns across sessions rather than accumulating context—directly implements the guideline's recommendation for context optimization.

### Building the Finance Pages – write-a-prd (Planning mode, Claude 4.5)

A PRD was generated next using the write-a-PRD skill, feeding in the document from the grill-me session. The PRD documented the problem (finance reviewers lack a structured way to review and approve expenses), the solution (two pages with filtering and a decision form), tied in 25 user stories covering both finance and consultant perspectives, implementation decisions (which components to use, how filtering works, data model), and testing strategy. This session produced a 330-line spec, ready to break into tickets.

### Building the Finance Pages – to-tickets (Planning mode, Claude 4.5)

The to-tickets skill broke the PRD into 11 tickets organized in six phases.

Phase 1 established the foundation: the expense data model was defined as a JSON schema and TypeScript types, with validation tests.

Phase 2 created mock expense data conforming to that model.

Phase 3 built three independent components in parallel: the expense table (displaying a list of expenses), the expense detail page (showing a single expense with all its fields), and the review decision form (approve or request changes, with a required comment field when requesting changes).

Phase 4 wired these components together in three parallel tracks: building the all-expenses page that displays the table, implementing the filter logic (a pure function that filters by status, submitter, type, date range), and integrating the decision form into the detail page with status updates.

Phase 5 finished the plumbing: connecting the filters to the page and adding the navigation link to the header.

Phase 6 was end-to-end testing—verifying the full workflow (user navigates to expenses, filters, clicks one, makes a decision, sees the status change).

The structure was not arbitrary. It was a dependency graph: tickets that didn't depend on each other could run in parallel (Phase 3 had three independent tickets, Phase 4 had three more). Tickets that did depend on earlier work were sequenced (the detail page and form could be built in parallel, but integrating them together came later). For a solo developer, this clarified priority; for a team, it enabled parallelism.

This stage in the workflow was a good point for developers to affirm everything was still on the right track. The tasks created were similar to a typical Jira ticket that a developer would see, and reviewing the tasks gave the developer a clear view of what was going to be built. This was an opportunity for developers to remain in the loop, altering plans as needed and staying in tune with what was going on.

### Building the Finance Pages – Implementation (Build mode, Qwen on-prem)

The implement skill included instruction to use test driven development and continuously run the full test suite after each change. The agent made a change, ran the tests, fixed regressions, and continued until the ticket specification was met.

For each ticket, a new session was started (therefore a new context window) and the implement skill was run with reference to a single ticket.

Test driven development enabled agents to set up parameters for success before executing on implementation. Consider ticket 05 (filter logic and form). Unit tests were written for `filterExpenses()`—does it filter by status? by type? by date range? Does it preserve the original array and return a new one? Once tests were written and failing, Feniks then implemented the function that passed the tests. **[AG]** documents an equivalent "Test First Mode" pattern for AGENTS.md: "write or update unit tests first, then code to green." Applying that pattern here transforms TDD from a human best practice into a critical guardrail for AI-assisted work, where the test is the unambiguous specification the agent must satisfy.

Manual review was still needed to ensure that the tests covered the behaviour they needed to, and that the code was written in a way that abided by practices and patterns already established in the repository. Guardrails were set up for AI to achieve this by adding instruction to skills to reference the architecture document, ADRs and the design guidelines.

Occasionally the agent would write changes that broke something, but with comprehensive testing in place it could course correct. When implementing ticket 09 (integrating the decision form into the detail page), all component tests passed. The form worked in isolation. But the E2E test failed: user navigates to an expense detail page, clicks Approve, but after going back to the list view, the status in the table doesn't update. The bug was traced: the form submitted and updated the mock repository, but the detail page wasn't re-fetching the updated expense to display the new status. Unprompted, to fix the bug, the agent added a useEffect hook to re-fetch after form submission. E2E test passed. This is a classic gap in AI-generated code: components work in isolation (unit tests pass) but break in integration (E2E tests catch it). The tests act as a safety net. This feedback loop (test fails, prompt, fix, retest) took about three minutes per iteration.

### Human in the Loop: Trade-offs and Disagreements

There is a fundamental trade off with agentic development: having the developer in the loop is slower than simply unleashing the AI to write code without review. But it keeps the developer informed and in control of architectural decisions. **[AG]** is explicit that this responsibility does not transfer to the tool: "Code generated by AI must be validated by the developer who generates it. The developer still owns every single line of code written and has the responsibility to validate its correctness." Without human oversight, Feniks would generate code faster, but the codebase would reflect the AI's adhoc decisions about structure, naming, and patterns. Giving the Jira-ticket sized problems enabled developers to review code as they usually would with non-agentic programming, keeping developers responsible for and capable of maintaining the code.

A concrete example: ticket 03 (build the expense table component). Feniks generated a component that took `expenses` and `onRowClick` as props, rendering rows with a hardcoded column order. The component worked and tests passed. But when the developer reviewed it, the column definitions (field name, display label, width) were noticed to be hard coded in the JSX. The developer disagreed with this approach. If columns needed to be reordered or new ones added later, the render logic would have to be touched, and the reusability of the table component was limited to views that needed the exact same columns. Feniks was prompted to refactor—extract column definitions into a constant, accept `columns` as a prop, make the render loop generic. This review cycle added maybe 20 minutes to the ticket but produced a better codebase. Without human oversight, the working-but-rigid solution would have been kept.

Another example: ticket 05 (filter logic). Feniks initially implemented filter state inside the FilterPanel component—when the user clicked "Apply Filters," the component called `onFiltersChange()` with the new criteria. This worked but meant filter state lived inside a component. The developer asked it to extract filter state to the parent component (`ReviewPage`) and have FilterPanel be a pure presentation component. This was a better separation of concerns: presentation (FilterPanel) stayed dumb, state management and filtering logic (ReviewPage) stayed coordinated. The resulting architecture was cleaner and easier to test in isolation.

These decisions (extracting column definitions, lifting state) were the kinds of choices that determined whether a codebase remained maintainable as it grew. An AI operating at full speed without human gatekeeping might not make these choices. The developer's involvement slowed down the raw code-generation speed but ensured the decisions were deliberate and the architecture scaled.

### Configuring Workflows to Keep Developers in the Loop

During implementation, the agent occasionally made large-scale architectural decisions (e.g., moving `<BrowserRouter>` initialization from one file to another, restructuring test file organization) without consulting the developer. While the fixes were technically correct, the developer had no voice in whether those refactors were appropriate.

The solution was not a one-time correction but a **workflow adjustment embedded in the skill itself**. The `implement` skill was updated to enforce a gate:

> **Before making any refactoring, architectural change, or structural modification:**
> Summarize why the change is needed, what will be refactored, and the impact on existing code.
> Present this to the user and wait for approval before proceeding. Do not apply large-scale
> changes without consent.

This gate reflects a distinction **[AG]** draws elsewhere for skill design: "Plan-validate-execute for destructive operations. For batch or destructive operations, have the agent create an intermediate plan, validate it against a source of truth, and only then execute." The `implement` skill applies that same plan-before-execute discipline to architectural changes rather than destructive data operations. It keeps developers in the loop on significant decisions while still allowing the agent to implement straightforward ticket work autonomously. The gate distinguishes between:

- **Tactical work** (implementing ticket requirements, adding tests, fixing bugs) → agent proceeds freely
- **Strategic work** (refactoring, architectural changes, restructuring) → agent proposes, developer approves

This approach scales: as the project grows and more developers join, the workflow ensures that structural decisions remain intentional and deliberate rather than emerging from ad-hoc agent fixes. The skill acts as a guardrail, encoding the principle that large-scale changes require human judgment.

## Codebase Maintainability

This human-guided approach resulted in a codebase that was not just functional but intentionally well-structured. The practices applied throughout—human oversight, multi-layer testing, preventive documentation, and strategic skill configuration—are the core recommendations of **[AG]** for sustainable AI-assisted development. The project included comprehensive unit test coverage (filter logic, validation, data transformations all tested), end-to-end tests that verified key user journeys (user submits expense, reviewer approves, status updates), and strict TypeScript that caught type errors at compile time. Every component was documented in Storybook, allowing visual review and regression testing without running the full app. Architectural decisions were recorded in ADRs (Architecture Decision Records) in `docs/decisions/`, so future maintainers could understand not just what the code does but why those decisions were made. The repo had clear separation of concerns: pages in `src/pages/`, shared components in `src/components/`, utilities in `src/lib/`, contexts in `src/context/`, and mock data in `src/mocks/`. Type definitions lived in `src/types.ts` and were referenced throughout, ensuring consistency.

This maintainable structure emerged because for every ticket, the instructions given to Feniks across agents.md and skills invoked told the agent to follow the patterns in `docs/architecture.md`, to add Storybook stories for new components, to write tests before code, to use TypeScript strictly. Key decisions were ensured to be documented in the PRD and ADR when they involved architectural trade-offs. The result was a codebase that new developers could onboard to quickly: the architecture was explicit, the test coverage was comprehensive, the types were a second form of documentation, and the Storybook was a visual reference for how components behaved.

Vertical slices kept scope tight and demoable. TDD was effective because the test was the spec; Feniks knew exactly what to build. Pure functions were AI-friendly—when filter logic was defined as a pure function with clear inputs and outputs, it worked first try. The grill-me interview extracted architectural nuance upfront, preventing mid-project pivots. The three-layer testing strategy (unit, component, E2E) caught different bug classes and ensured the codebase remained maintainable as features were added. Model switching optimized iteration speed. These practices echo the closing summary of **[AG]**'s planning guidance: "better preparation produces better results. Time spent in Plan mode, writing clear specs, or choosing the right skill is always repaid in fewer review cycles and less rework." And the skills workflow (grill-me → PRD → to-tickets → implement → validate) was repeatable and could be applied to the next feature with confidence.

The entire finance-pages feature—11 tickets, 25 user stories, two pages with filtering and stateful forms, full test coverage, Storybook stories, architectural decisions documented—took about 12 hours of agentic-assisted development time from one developer (real time, not time spent running the agent). This included time writing tests, reviewing generated code, prompting Feniks, and debugging integration issues. A solo human developer building this from scratch might have taken 2–3 days. That estimate is not derived from a control build—no one built the same feature by hand to compare—it is the developer's own back-of-envelope figure, based on prior experience building comparable CRUD-with-filtering features (data model, two pages, form validation, filter logic, unit/E2E coverage) without AI assistance. It should be read as an informed guess, not a measured baseline. The speed boost came primarily from Feniks generating boilerplate and straightforward logic, freeing the developer to focus on architecture, testing, and integration issues—the parts that required human judgment. More importantly, the human involvement ensured that every significant architectural decision was intentional, that the code was tested comprehensively, and that the codebase remained well-structured and maintainable as it grew.

## Keeping Agents Current: Tooling-Specific Instructions

During development, the agent generated E2E tests using Playwright's deprecated `toHaveTextContent()` matcher. The test framework had removed this matcher in version 1.62+, but the agent's training data still referenced the old API. Each time a new test was written, the same mistake recurred—a test would fail at runtime with `TypeError: expect(...).toHaveTextContent is not a function`, requiring manual correction to use `toHaveText()` or `toContainText()` instead.

This revealed an important pattern: **agents trained on public documentation will use outdated library APIs when libraries deprecate features without loud warnings**. The solution was not to wait for the agent to learn, but to document the project-specific guidance directly in `AGENTS.md`—the practice **[FA]** describes as foundational: "AGENTS.md is the foundation. Every project should have a well-maintained AGENTS.md file committed to Git."

A single-line note was added to the Playwright section:

> **Note:** `toHaveTextContent` matcher was removed in Playwright 1.62+. Use `toHaveText()` (exact match) or `toContainText()` (substring match) instead.

After this change, the agent no longer made the mistake. This demonstrates a broader principle: **project and tooling-specific instruction files are a low-effort, high-impact way to keep agents fast and accurate**. Rather than repeatedly correcting the same error (which slows development), a one-time investment in documenting known gotchas, version-specific quirks, or deprecated APIs prevents the agent from going down the same wrong path. For teams using AI agents over months or years, maintaining a curated list of such instructions—library versions, recently deprecated features, project-specific patterns—directly translates to faster, more reliable AI-assisted development.

## Guarding Against Context Bloat: Explicit File Exclusions

Early in development, the agent would occasionally read or analyze files that provided no value but consumed valuable context window: `node_modules/`, the `dist/` build output, or generated test artifacts. The developer's natural instinct was to rely on `.gitignore`, but `.gitignore` controls version control, not tool permissions—the read tool can access any file by absolute path regardless of git tracking status.

The fix was straightforward: document explicit "DO NOT READ" rules in `AGENTS.md` with clear reasons for each:

```
- node_modules/: DO NOT read or analyze, ever (bloats context, no useful information)
- .env: DO NOT read, contains secrets
- dist/: DO NOT read, generated output (ignored by git, bloats context)
- test-results/: DO NOT read, test artifacts only (regenerated on every test run)
```

By adding these rules with explanations, the agent learned the *why* behind each exclusion, making it more likely to honor the guidance in future sessions. More importantly, the developer avoided the overhead of repeatedly correcting the agent: "don't read that file, it's just build output."

A related discovery: on Windows, the agent would attempt to use PowerShell cmdlets (`Get-ChildItem`, `Test-Path`, `Remove-Item`) for file inspection and manipulation, but these were consistently denied by the bash permission policy—inherited from OpenCode's Unix-centric design. Rather than modifying the underlying permission rules (which could introduce security risks), the developer added explicit guidance to AGENTS.md:

> **Windows shell note:** On Windows, use Read and Glob tools instead of PowerShell cmdlets. The bash permission policy is tuned for Unix commands. For file inspection, use the Read tool on directories and Glob for pattern matching. For complex queries, use `node -e` instead of multi-statement PowerShell pipelines.

This single note eliminated a recurring friction point: the agent no longer wasted attempts on denied commands, and instead used the appropriate tools from day one. The lesson extends beyond file operations: **when a tool's permissions or design assumptions don't match the developer's environment, it's faster to document the workaround than to change the tool**. This keeps agents focused and sessions productive.

This illustrates a key principle for sustainable AI-assisted development: preventive documentation about what tools to use (and what not to use) is far more cost-effective than corrective feedback during each session. A few minutes spent documenting file/directory boundaries, shell constraints, or tool-specific workarounds upfront translates to faster sessions throughout the project's lifetime, because the agent spends less time trying blocked commands or reading irrelevant context, and more time focused on actual work. **[FA]** documents the same node_modules/.env/dist exclusion pattern used here as its recommended approach: ".gitignore is not a hard security boundary. The read tool can still access files by absolute path... For files that must never be read, add explicit directives in AGENTS.md," combined with prompt-level instructions as "a redundant safety layer."

## Tuning Feniks Config While Respecting Security

During development, the developer identified a gap in Feniks' plan mode: the plan agent's bash permission allowlist was unnecessarily restrictive, blocking even read-only inspection commands like `node --version` and `npm --version`. This forced planning sessions to rely on user input for basic environment details instead of verifying them independently.

The fix was straightforward: add a small set of clearly read-only commands to the plan agent's bash permissions in `~/.config/opencode/opencode.json`:

```json
"node --version": "allow",
"node -v": "allow",
"node -e *": "allow",
"npm --version": "allow",
"npm -v": "allow",
```

This enhancement maintains the security posture of plan mode (no mutations, no side effects, purely informational) while enabling the agent to verify environment setup independently.

**The principle:** Netcompany's security restrictions in Feniks config are intentional guardrails designed to keep the workflow safe, as outlined in **[FA]**. When tuning the config to enhance capabilities, be cautious and make only **minimal, targeted changes that respect the original security intent**. This means:

- Understand *why* a restriction exists before removing or weakening it
- Only grant permissions for operations that don't break the security model (e.g., read-only inspection in plan mode)
- Document the change and its rationale so future developers understand what was modified and why
- Test the change to ensure it doesn't introduce unintended access patterns or security gaps

This disciplined approach to config tuning allows the developer to adapt Feniks to project needs without eroding the security framework Netcompany built into the tool. **[FA]**'s Plan agent is described as read-only by design ("It can analyse code and reason about the codebase but cannot make changes"); the change made here stayed within that intent by only permitting read-only version checks, not by relaxing the write/execute restriction itself.

## Choosing the Right Model

Throughout the project, both Claude 4.5 and Qwen 3.6 on-prem were used, with switching between them done intentionally. This approach follows **[AG]**'s model-selection guidance directly: "Refrain from using large reasoning models for the actual implementation, but use it for planning tasks only," while optimized coding models like Qwen 3.6 are described as "the right default for most day-to-day work" because, for straightforward tasks, "these performs comparably with large reasoning models."

Experimentation per project is needed to use the on prem models as much as possible, keeping costs down. Ultimately it is important that the developer continues to carefully review the outputs of their agentic workflow that intend to be maintained (documentation, code), to assess whether the workflow is working as expected, rather than depending on using larger models and expecting better outcomes. **[AG]** frames this as a matter of accountability rather than model capability: "you are still accountable for all the code produced. You must be able to understand and validate the correctness."

## Parallel Development

Parallel development is achieved by opening multiple sessions (Ctrl + P -> new session).

## Tooling and Access Problems

See the `problems/` directory (`problems/open-problems.md` and `problems/closed-problems.md`) for a complete log of workflow problems encountered during development.

## Known Tool Limitations

Several limitations in Feniks emerged during development that fall outside the scope of agent configuration or workflow adjustment. These are **fundamental gaps in the tool itself that require fixes by the Feniks development team** to resolve.

### Platform Limitations: WSL Support

**Issue:** OpenCode for Feniks is not available for Windows Subsystem for Linux (WSL). On a Windows machine, Feniks can only run in the Windows environment (PowerShell), not in the WSL environment where many Linux-based projects' toolchains actually live. This creates a mismatch: the agent cannot execute commands against the project's real environment.

**Impact:** Any project relying on WSL (common for cross-platform development) requires duplicate tooling installation on both Windows and WSL, or the agent becomes ineffective. This adds setup friction and risks version drift between environments.

**Recommendation for Feniks team:** Either provide an OpenCode for Feniks build for WSL or improve the Windows build to detect and work directly with WSL environments.

### Security Diagnostics: Prompt Injection Detection

**Issue:** The LLM bridge's prompt injection detection occasionally blocks legitimate build commands (e.g., `npm run build`, `npm run test`) with the message `[BLOCKED: prompt injection detected]`, but provides zero diagnostic information: no file path, no pattern that triggered the block, no explanation.

**Impact:** When a command is blocked, the developer cannot diagnose why or fix it. This creates a **dangerous incentive structure**: the obvious solution is to disable injection detection entirely, which removes a critical security feature rather than tuning it. The lack of diagnostics makes the blocker feel like a bug rather than intentional security, eroding trust in the tool's safety mechanisms.

**Recommendation for Feniks team:**

1. When a command is blocked, output which file or content pattern triggered it
2. Provide a way to view and adjust injection detection rules
3. Consider scoping detection to external/untrusted content (fetched URLs, user messages) rather than the project's own source files
4. Document the security rationale so developers understand why the detection exists and isn't just capricious

Without diagnostics, security features can inadvertently push users toward disabling them, which defeats their purpose.

### Discoverability: Skill Library Has No Usage Guidance

**Issue:** Feniks Build ships a skill library — a searchable UI of skills contributed by other Netcompany teams, intended to standardize workflows across projects. In practice it's a flat, disconnected collection: there's no guidance on which skill fits which situation, no categorization by use case, and no indication of which skills are maintained, deprecated, or project-specific versus general-purpose.

**Impact:** Discovering the right skill for a task relies on the developer already knowing it exists and searching for it by name (e.g. this project only used `grill-me` because the developer already knew of it from prior exposure to Matt Pocock's methodology, not because the library surfaced it). Teams without that prior context are unlikely to find applicable skills, undermining the library's stated goal of standardizing practice.

**Recommendation for Feniks team:** Add categorization/tagging by use case (planning, implementation, review, etc.), a maintenance/ownership indicator per skill, and lightweight discovery aids (e.g. "similar projects used" or search-by-outcome) so the library serves as a real recommendation surface rather than an unstructured list.

## References

- **[AG]** C0200 – User Guide – Agentic AI Guidelines. [Link](https://goto.netcompany.com/cases/GTE3228/NCAI/_layouts/15/WopiFrame.aspx?sourcedoc=%7BD3E134A8-B186-42DC-87E9-79F12886838E%7D&file=C0200%20-%20User%20Guide%20-%20Agentic%20AI%20Guidelines.docx&action=default)
- **[FA]** C0200 – User Guide – Feniks AI. [Link](https://goto.netcompany.com/cases/GTE3338/NCFAI/PublicDocuments/C0200%20-%20User%20Guide%20-%20Feniks%20AI.pdf)

## Overview of Feniks Setup

### Configuration and Customization

- **Skills used and details:** grill-me, mattpocock-skills-write-a-prd, to-tickets, implement (all from skill library); no custom skills created during this project
- **AGENTS.md content:** Project-specific guidance for file exclusions, tool constraints (Windows shell note, bash piping limitations, Grep tool usage), deprecated library APIs (Playwright matchers), and Storybook/Vite dependencies
- **In-code documentation:** DESIGN-GUIDELINES.md (Netcompany brand palette, typography, layout rules), docs/architecture.md (routing, auth, state management, forms, testing boundaries), docs/decisions/ (ADRs for significant architectural choices)
- **Agents and permissions:** Plan mode enhanced with read-only version commands (node/npm), build mode left unrestricted; custom gate in implement skill requiring approval before refactors
- **Instructions:** Security rules from ~/.config/opencode/rules/security.md
- **MCPs:** Gateway MCP for SharePoint integration (not used in this project but available)
- **.opencode configuration:** Plan agent model set to large-reasoning-01, build agent to qwen3-6-coder-gefion; enhanced plan mode bash permissions for environment inspection
- **Global Feniks config (~/.config/opencode/opencode.json):** Plan and build agents configured with custom permissions; security restrictions respected while enabling targeted enhancements

### Known Startup Issues

**Docker container error on startup:** Feniks occasionally fails to start with an error about Docker containers not being found. This appears to be a stale Docker context or orphaned process state that Feniks doesn't clean up on normal exit. 

**Workaround:** Force-close Feniks from the taskbar (full process kill) rather than normal close, then relaunch. This reliably clears the stale state.

**Recommendation for Feniks team:** Implement automatic cleanup of stale Docker state on startup or graceful fallback when containers are missing.

## Appendix

This appendix provides the complete skill and agent configuration used throughout the project. All skills except `grill-me` (from the Feniks skill library) were adapted from Matt Pocock's skill templates and customized for this project's needs.

### A.1 AGENTS.md

This file serves as the central knowledge repository for the agent, providing project-specific guidance on architecture, tooling, conventions, and constraints.

<details>
<summary>AGENTS.md (Click to expand)</summary>

```markdown
# AGENTS.md

## Repo Purpose

Demo expense app built to experiment with Feniks AI capabilities. Start from scratch — no existing codebase conventions to follow.

## Project Structure

**Agent read/write permissions:**
- `src/`: main application code, agent should work here
- `scripts/`: build/deploy scripts, agent may read but not modify
- `node_modules/`: **DO NOT read or analyze, ever** (bloats context, no useful information)
- `.env`: **DO NOT read, contains secrets** (blocked by security policy)
- `dist/`: **DO NOT read, generated output** (ignored by git, bloats context)
- `test-results/`: **DO NOT read, test artifacts only** (regenerated on every test run)

The agent should rely on `.gitignore` for general guidance, but these explicit rules take precedence. When exploring the codebase, stick to `src/`, `docs/`, and config files. Avoid entire directory reads unless explicitly needed for a task.

## Architecture

`docs/architecture.md` is the source of truth for the architectural patterns this codebase must follow (routing, auth/context, state management, forms, testing boundaries, and where new architectural boundaries like a service/API layer should go). Consult it — and follow the patterns it documents — before making any change that touches these areas; don't invent a conflicting pattern. Significant architectural decisions and their rationale are recorded in `docs/decisions/` — check there before revisiting a decision, and add a new ADR when making another one.

Keep this documentation up to date: when a change introduces, removes, or alters an architectural pattern or boundary described in `docs/architecture.md`, update that document in the same change, and add a new ADR to `docs/decisions/` if a significant new decision was made. Stale architecture docs are worse than none — don't leave them describing a pattern the code no longer follows.

## Guidance for Future Sessions

- **Stack:** Vite 8 + React 19 + TypeScript 6, npm as package manager.
- **Routing:** React Router v7 (classic JSX `<BrowserRouter>`/`<Routes>`/`<Route>`).
- **Styling:** Tailwind v4 + shadcn/ui (New York style, lucide-react icons). shadcn components live in `src/components/ui/` — add new ones via `npx shadcn@latest add <name>`, don't hand-write them.
- **Forms:** react-hook-form + zod + shadcn's `Form` component.
- **Testing:** Multi-layer strategy:
  - **Vitest + React Testing Library** — component/unit tests, colocated `.test.tsx` files. Run `npm run test`.
  - **Playwright** — E2E browser tests in `e2e/`. Run `npm run test:e2e` (headless) or `npm run test:e2e:headed` (watch in browser). For debugging, use `$env:PLAYWRIGHT_SLOW_MO=800; npm run test:e2e:headed` (PowerShell) to slow down operations (in milliseconds).
    - **Note:** `toHaveTextContent` matcher was removed in Playwright 1.62+. Use `toHaveText()` (exact match) or `toContainText()` (substring match) instead.
  - **Storybook** — Visual component development & testing. Run `npm run storybook`. Stories live in `.stories.tsx` files alongside components.
    - **Note on vitest + Storybook:** When adding new stories that import previously-unused modules, you may see "Failed to fetch dynamically imported module" errors on first run. This is a Vite dependency optimization race condition. Workaround: re-run the tests. If the error persists, clear `node_modules/.cache/storybook` and re-run. See `problems/closed-problems.md` for full details on CJS/ESM pre-bundling requirements (`optimizeDeps.include` in `vitest.config.ts`).
- **Linting:** oxlint (Vite's default). Run `npm run lint`.
- **Commands:**
  - `npm install` — install dependencies
  - `npm run dev` — start dev server
  - `npm run build` — TypeScript check + Vite production build
  - `npm run lint` — run oxlint
  - `npm run test` — run Vitest tests
  - `npm run test:ui` — run Vitest with UI dashboard
  - `npm run storybook` — start Storybook component development server
  - `npm run test:e2e` — run Playwright E2E tests (headless)
  - `npm run test:e2e:headed` — run Playwright E2E tests (visible browser)
  - `npm run preview` — preview production build
- **Node:** No version pinned. Recommend Node ≥20.19 (Vite 7+ minimum). Current tested version: v24.19.0.
- **Folder convention:** `src/{pages,components,context,mocks,lib}`. Pages are route-level components in `src/pages/`, shared components in `src/components/`, shadcn UI in `src/components/ui/`, contexts in `src/context/`, utilities in `src/lib/`, mock data in `src/mocks/`.
- **Windows shell note:** On Windows, use Read and Glob tools instead of PowerShell cmdlets (`Get-ChildItem`, `Test-Path`, `Remove-Item`). The bash permission policy is tuned for Unix commands. For file inspection, use the Read tool on directories and Glob for pattern matching. For content search, use the Grep tool instead of bash `grep`. For complex queries, use `node -e` instead of multi-statement PowerShell pipelines.
  - **Important:** The bash permission matcher evaluates entire command strings as-is; pipes, redirections, and command chaining (e.g., `cmd1 | cmd2`, `cmd && cmd2`, `2>&1 > file`) may cause the whole command to fail the permission match even if the base command is allowed. **Avoid combining allowed commands with pipes or redirections.** When you need to filter or truncate output, run the command alone and use the Grep tool to search the auto-saved output file instead. Example: instead of `npm run test -- file.tsx | head -30`, run `npm run test -- file.tsx` and then use the Grep tool to search the output.
- Keep this file updated as conventions evolve.

## Design Guidelines

See `DESIGN-GUIDELINES.md` for the Netcompany brand palette, typography, layout rules, and AI implementation guidance. All UI work must follow these guidelines. In short:

- **Colours:** Use only the defined Netcompany palette (`green`, `green-10` through `green-90`, `dark-green`, `white`, `coral`). No arbitrary colours.
- **Coral:** One prominent use per page max. Accent only.
- **Typography:** Studio 6 (fallback Arial). Regular default, Demibold/Bold for hierarchy only.
- **Style:** Clean, technical, restrained. No gradients, heavy shadows, or generic SaaS look.

## Styling Rules

**Always** follow `DESIGN-GUIDELINES.md`. When styling:

- Use only the defined CSS variables (`--primary`, `--foreground`, etc.) — never hardcode hex values or arbitrary colours.
- Extend existing shadcn component variants (`default`, `secondary`, `outline`, etc.) instead of overriding with inline classes.
- If a variant doesn't fit, modify the component's `cva` config in `src/components/ui/` — don't patch it inline.
- Keep styling clean and reusable. Never bolt on inline classes just to make something "look right" quickly.

## TODO Prioritization

`TODO.md` is organized into three tiers:

- **Blocking Go-Live** — Must be done before release. Agent should prioritize these above all else.
- **Should-Do** — Important, but not blocking. Address after go-live blockers are resolved.
- **Nice-to-Have** — Low priority polish. Only touch if there's nothing else to do.

When the agent completes or adds a TODO, place it in the correct tier. Ask the user before moving items between tiers.

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

## Problems Log

This repo maintains a `problems/` directory (`problems/open-problems.md` and
`problems/closed-problems.md`, see `problems/README.md` for the split),
tracking friction and issues in the human↔agent workflow itself
(permissions, tooling gaps, environment quirks — not application bugs).

- Whenever a session hits a workflow problem — a blocked command, a
  confusing permission denial, a tool that doesn't behave as expected,
  an ambiguous or missing instruction — document it in
  `problems/open-problems.md` using the existing entry format (date, what
  was attempted, what went wrong, root cause if known, status).
- Keep the problems log up to date at all times: add new entries to
  `open-problems.md` as issues arise, and move an entry to
  `closed-problems.md` once it's worked around or resolved.
- Do not delete old entries even after they're resolved — mark them
  resolved instead, so the log stays a historical record.
```

</details>

### A.2 Skills

#### A.2.1 grill-me

**Source:** Feniks skill library (not from Matt Pocock; built into Feniks)

This skill is used in the planning phase to relentlessly interview the developer until a shared understanding is reached.

<details>
<summary>grill-me/SKILL.md (Click to expand)</summary>

```yaml
---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding.
license: MIT
metadata:
  version: "1.0"
  maintainer: Feniks AI Team
  last_updated: "2025-07-13"
  categories: productivity, planning
  scope: global:preference
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.
```

</details>

#### A.2.2 mattpocock-skills-write-a-prd

**Source:** Adapted from [Matt Pocock's skill templates](https://github.com/mattpocock/skills)

This skill guides the agent through structured PRD creation: problem exploration, codebase analysis, design interviews, module sketching, and PRD generation.

<details>
<summary>mattpocock-skills-write-a-prd/SKILL.md (Click to expand)</summary>

```yaml
---
name: mattpocock-skills-write-a-prd
description: Use when the user wants to create a Product Requirements Document (PRD). Guides through problem exploration, codebase analysis, relentless design interviews, module sketching, and PRD generation.
---

This skill will be invoked when the user wants to create a PRD. You should go through the steps below. You may skip steps if you don't consider them necessary.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

4. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates a lot of functionality in a simple, testable interface which rarely changes.

Check with the user that these modules match their expectations. Check with the user which modules they want tests written for.

5. Once you have a complete understanding of the problem and solution, use the template below to write the PRD. The PRD should be submitted as a GitHub issue.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>
```

</details>

#### A.2.3 to-tickets

**Source:** Adapted from [Matt Pocock's skill templates](https://github.com/mattpocock/skills)

This skill breaks a plan or spec into vertical-slice tickets with explicit blocking dependencies. It operationalizes the concept of "tracer-bullet" work: complete, demoable slices that cut through every layer.

<details>
<summary>to-tickets/SKILL.md (Click to expand)</summary>

```yaml
---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tickets to the configured tracker

Publish the approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured; the tickets are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise; the tickets are agent-grabbable by construction.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

Do NOT close or modify any parent issue.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</local-ticket-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking ticket, or "None (can start immediately)".

</issue-template>

In either form, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
```

</details>

#### A.2.4 implement

**Source:** Custom skill for this project (inspired by Matt Pocock patterns)

This skill enforces test-driven development and includes a critical gate: before making any refactoring, architectural change, or structural modification, the agent must propose and wait for human approval. This keeps the developer in control of strategic decisions while allowing tactical implementation to proceed autonomously.

<details>
<summary>implement/SKILL.md (Click to expand)</summary>

```yaml
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
```

</details>

### A.3 Skill Sourcing Notes

- **grill-me**: Provided by Feniks skill library. No modifications.
- **mattpocock-skills-write-a-prd**: Sourced from [Matt Pocock's public skill templates](https://github.com/mattpocock/skills). Used as-is to drive structured PRD creation.
- **to-tickets**: Sourced from [Matt Pocock's public skill templates](https://github.com/mattpocock/skills). Used as-is to break specs into tracer-bullet tickets with blocking dependencies.
- **implement**: Custom skill created for this project, inspired by Matt Pocock's patterns. Key addition: the **approval gate** before refactoring or architectural changes. This gate is not in the public templates; it was added to keep developers in the loop on strategic decisions.

The workflow sequence (grill-me → PRD → to-tickets → implement) follows the Matt Pocock methodology: **relentless design clarity upfront, breaking work into demoable slices, then agentic implementation with human oversight on strategic choices**.
