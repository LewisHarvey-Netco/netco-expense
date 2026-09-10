# Feniks AI Case Study – Netco Expense POC

## Introduction

### Intended Audience

This document is intended for those working in technical delivery that are considering using Feniks Build to support software design and development.

This document intends to provide a clear example of operational usage of Feniks Build to develop software, including demonstrate key benefits, known limitations, and some concrete practices for working with it. It also addresses some gaps in the workflow that need further investigation.

### Feniks Build and Agentic AI

Throughout, this document covers problems and benefits with Feniks AI specifically, as well as to Agent assisted development in general, distinguishing between the two were appropriate.

## Project Overview

### What is the project?

Netco-expense is a proof of concept for a Netcompany expense app (like Continia). The system allows consultants to submit expenses, and finance staff to review and reject/accept them. It was built specifically for testing the usage of Feniks AI and not intended to be released.

### Tech Stack

| Name | Usage | Category |
|------|-------|----------|
| React 19 | Javascript library for stateful UIs | Functionality |
| Typescript 6 | Typed Javascript | Functionality |
| React Router 7 | Page Routing | Functionality |
| React-hook-form | Form handling and validation | Functionality |
| Shadcn | Prebuilt copy paste UI components | Functionality/Style |
| Tailwind 4 | Utility classes for css styling | Style |
| NPM | Package manager and script running | Build & Test |
| Oxlint | Linting react issues – hook misuse | Build & Test |
| React-testing-library | Unit and integration tests | Build & Test |
| Storybook 10 | Visual component library | Build & Test |
| Playwright | End to end tests | Build & Test |

## Feniks Build Usage

Feniks Build has been used throughout development (analysis, design, build and test) extensively. This is intentional as the goal was to test the effectiveness of Feniks as an agentic programming tool as much as possible.

Later sections on planning, designing and building cover specifics on Feniks AI usage (skills, agents, models, etc).

### Limitations of Case Study

It's important to note that there are clear limitations to this case study that impact its reliability in demonstrating the usage of Feniks Build:

- **Project context:** The lack of real project constraints is beneficial for exploration of the tool usage, but on a real project there will be problems and requirements that have not been simulated.
- **Scale:** The expense app is a simple MVP, which means it's likely there are problems with Feniks usage/workflow that would only manifest once the size of the project increases.
- **Frontend only:** The backend is mocked with a repository pattern. Frontend components call repository methods exposed through a shared application context. The injected implementation is an in-memory dataset loaded from a JSON file of expenses. This lets the frontend interact with data exactly as it would with a real backend, where a real implementation of the repository would make RESTful calls to an API instead of reading from memory. This allowed the frontend to be built realistically without a backend.
- **Single Contributor:** As Feniks AI has only been worked on by a single contributor, it's possible there are issues with agentic programming that only emerge with larger team sizes, which won't be captured here.

## Getting Started with Feniks Build

Setup needs to be done by each developer, on their local machine. The process is well covered by the document C0200 – User Guide – Feniks AI.

Once Feniks AI is installed and setup, users can choose whether to interact with the Graphical Interface, or the Terminal Interface. Sessions and capabilities are shared between interfaces, so users can switch back and forth as they like.

Once the tool is installed, you can start using Feniks build to assist with development tasks. On the Feniks Build LLM-Bridge tab, you can turn on LLM prompt injection protection and CPR scrubber, which prevents sending prompts that breach rule sets defined within the modules (see user guide). For example, prompts that contain phone numbers are blocked. You can then start adding skills from the skill library, configuring MCPs etc as defined in the User Guide.

### Graphical Interface

To use the Graphical Interface, the user can run the program "OpenCode for Feniks", (searchable in the start bar).

### Terminal Interface

To use the terminal interface, open PowerShell, navigate to the root directory of the project you're working on, and run the command `opencode`.

During this MVP development the terminal interface was used.

## Requirements and Planning

To start work on Netco expense, requirements elicitation was conducted to understand the user needs the product aims to meet. As consultants who submit expenses at Netcompany, we acted as proxies for future users, allowing us to simulate the elicitation process. For the finance side, we had to make assumptions about needs (there are likely gaps) but this was sufficient to establish a foundational understanding to kick off development.

We started by writing free form descriptions of how we use the Continia expense app, and any possible pain point areas we (as users) often experience that could be addressed. These descriptions were enhanced by experimenting with the Continia app, and taking notes as we performed common tasks, to help find more potential improvements.

At this point, we had a decent, unstructured understanding of the actions that the application needs to facilitate, problems with UX to avoid, and key benefits of the existing system. The initial input is found at `docs/init-requirements.md`.

### Using Feniks to convert notes to user stories

We used Feniks Build to convert our unstructured notes into user stories the app needs to meet.

This was done using the grill-me skill from the skill library (popularised by Matt Pocock) with the Qwen 3.6 on-prem model. This skill is used to get the AI to relentlessly interview the developer until a shared understanding of the task/subject has been established. We invoked the skill with a prompt that contained all the initial loose requirements, and an explanation of the goal: to create a structured list of user stories.

The agent asked a series of clarifying questions about the user needs and queried the developer on potential additions. For each question, the developer provided responses one at a time until a shared understanding was established (or the developer requested to finish).

After a shared understanding was established, the agent produced a list of user stories in a mark down document (`/docs/user-stories.md`) which was reviewed by the developers for any inaccuracies/improvements then committed to the repo.

This engagement with Feniks Build resulted in a clear, well formatted list of user needs to move forward with. Using Feniks allowed us to transform loose notes into structured, referenceable user stories much more quickly than doing it by hand. The workflow used here is loose, and a clearer, systematic approach could have been useful for better results (using a common skill to write user stories for example, enforcing more rigid structure). But in this case, since we were manually reviewing and adjusting the complete list of user stories, we had control and insight into the output of the activity rather than the process, giving us confidence that the work done was of sufficient quality.

In a real project, these user stories could continue to be kept in mark down, or could be migrated to JIRA for sharing across the project, using the jira-mcp.

## Design and Prototyping

With the user stories built, prototypes were drawn up to get a view of how the requirements can be met with a solution. The prototyping method used in projects depends on a few key considerations:

- Are the prototypes to be maintained long term?
- What level of interactivity and fidelity is needed?
- What tooling is the designer familiar with?
- How quickly are they needed?

### Using Feniks to prototype

I first added `design-guidelines.md`, which takes content from Netcompany Brand Guide V.02.02_2023-11-30.pdf as a baseline style guide. Then I prompted Qwen without a skill, telling it to build a full prototype that met the user requirements and followed the design guidelines. This is a very open request, but this is intentional as the output is for ideation, not a product to be delivered.

The prototype was manually reviewed, and a few follow up prompts were used to refine some features.

This end prototype gave enough design to start building an MVP (source code) (hosted prototype).

### Feniks Prototyping - What worked well

Feniks build enabled us to build relatively high fidelity prototypes (with linking between pages etc) in a very small amount of time. Because the prototype is not meant to be maintained at this stage, we can disregard code quality issues and quickly build a version of the product end to end. Iteration on the prototype can be continuously added by Feniks build, allowing high speed iteration with high fidelity.

### Feniks Prototyping - Problems

Feniks worked well for ideation and planning, not for design artifact creation. It generated interactive HTML fast enough to walk through user flows and validate architecture decisions.

The lack of image feedback is a real bottleneck. When asked to describe a screenshot of the current prototype, Feniks hallucinated details that weren't there. This means every small visual change requires describing the current state in text, which is slow and error prone. Trying to make small UI tweaks is a long and tedious process, where it often executes changes on a prompt incorrectly, requiring many iterations for changes that would usually only take a few minutes (adding spacing and margin for example).

To improve this workflow, an agent would need either: (1) the ability to view and iterate on visual output directly, or (2) a constrained component library that limits the scope of possible changes. This would reduce the back-and-forth needed for visual refinement.

Apps like Claude Design support more fine grain workflows, where designers can prompt for visual changes, but also use a Figma-like interface to make small adjustments (such as spacing, font size, borders etc) and output the design as standalone html to be used as visual feedback by coding agents that have capabilities to look at images.

## Build and Testing

With user stories and a prototype in place, we moved into iterative implementation and validation. The development approach was explicitly agentic: we used Feniks Build to generate code at high speed, paired with multi-layered testing to catch regressions early.

The key insight was to break down work into small vertical slices before touching the code, each feature cutting through the full stack (state, types, forms, tests) in a single small, demoable increment. This let the developer validate end-to-end work early and catch architectural issues before they compounded.

The workflow we followed was:

- **grill-me:** the agent interviews the developer to extract requirements and agree on handling edge cases
- **write-a-prd:** The agent takes the grill-me findings as input and rewrites as a PRD (product requirements document) detailing user stories, components to build etc.
- **to-tickets:** The agent takes the PRD as input and creates a vertical-slice ticket breakdown with explicit blocking dependencies. The developer reviews and alters the slices before moving on.
- **implementation with TDD:** at pre-agreed seams write code following practices established in readme.md and architecture.md. validation via unit, component, and E2E tests.

This cycle repeated for each major feature.

Note that Claude 4.5 was used here for the planning and analysis activities, then Qwen (on prem) was used for actual implementation once the tasks were very clearly defined. Larger models like Claude often do better at pulling together lots of information and conducting analysis, while Qwen can finish tasks more quickly, but needs well-defined tasks to remain useful. It's likely that the on prem models (e.g Qwen) could also perform some of the analysis if it's broken up into small chunks, especially once the repository has a well-defined Agents.md, and well-organized documentation on architectural patterns and principles that can be enforced as part of the skill.

### Building the Finance Review Pages – Grill-me (Planning mode, Claude 4.5)

For the grill-me session, we fed in the related user stories, the prototype designs and some guidance on scope with model Claude 4.5 selected. The agent asked several clarifying questions, for example:

- What sections of the prototype are in scope?
- Do finance staff need to provide a reason for flagging an expense?
- Should the daily food caps be implemented at this point?

For each question, the developer did manual analysis and gave answers that clarified the task, building a better shared picture of the problem space.

The agent walked through 13 distinct architectural and UI decisions (routing structure, status workflow, filter triggers, data model fields, component choices) and recorded each one with rationale. The entire exchange took about 30 minutes and produced a 370-line decision document that locked in our shared understanding, which is saved to the repository as a markdown document.

Saving the output into a markdown document provides several benefits:

1. The content can be referred to later to remember why decisions were made
2. The content can be used in subsequent follow up tasks (like enhancing documentation) after the implementation is done
3. A new session can be started to move on to the next step of the process, where we feed this document in and otherwise have a completely fresh context window

This last point is important when we consider the advice often given around keeping context small and highly relevant. To quote C0200 – User Guide – Agentic AI Guidelines: "The context window is a finite and expensive resource: filling it with irrelevant files or stale history degrades reasoning quality and increases cost. Filling it with the right, highly relevant information is often the single most impactful improvement you can make to agent performance."

### Building the Finance Pages – write-a-prd (Planning mode, Claude 4.5)

Next, we generated a PRD using the write-a-PRD skill, feeding in the document from the grill-me session. The PRD documented the problem (finance reviewers lack a structured way to review and approve expenses), the solution (two pages with filtering and a decision form), tied in 25 user stories covering both finance and consultant perspectives, implementation decisions (which components to use, how filtering works, data model), and testing strategy. This session produced a 330-line spec, ready to break into tickets.

### Building the Finance Pages – to-tickets (Planning mode, Claude 4.5)

The to-tickets skill broke the PRD into 11 tickets organized in six phases.

Phase 1 established the foundation: define the expense data model as a JSON schema and TypeScript types, with validation tests.

Phase 2 created mock expense data conforming to that model.

Phase 3 built three independent components in parallel: the expense table (displaying a list of expenses), the expense detail page (showing a single expense with all its fields), and the review decision form (approve or request changes, with a required comment field when requesting changes).

Phase 4 wired these components together in three parallel tracks: building the all-expenses page that displays the table, implementing the filter logic (a pure function that filters by status, submitter, type, date range), and integrating the decision form into the detail page with status updates.

Phase 5 finished the plumbing: connecting the filters to the page and adding the navigation link to the header.

Phase 6 was end-to-end testing—verifying the full workflow (user navigates to expenses, filters, clicks one, makes a decision, sees the status change).

The structure wasn't arbitrary. It was a dependency graph: tickets that didn't depend on each other could run in parallel (Phase 3 had three independent tickets, Phase 4 had three more). Tickets that did depend on earlier work were sequenced (the detail page and form could be built in parallel, but integrating them together came later). For a solo developer, this clarifies priority; for a team, it enables parallelism.

This stage in the workflow is a good point for developers to affirm everything is still on the right track. The tasks created are similar to a typical Jira ticket that a developer would see, and reviewing the tasks gives the developer a clear view of what is going to be built. This is an opportunity for developers to remain in the loop, altering plans as needed and staying in tune with what's going on.

### Building the Finance Pages – Implementation (Build mode, Qwen on-prem)

The implement skill includes instruction to use test driven development and continuously run the full test suite after each change. The agent makes a change, runs the tests, fixes regressions, and continues until the ticket specification is met.

For each ticket, we started a new session (therefore a new context window) and ran the implement skill with reference to a single ticket.

Test driven development enables agents to set up parameters for success before executing on implementation. Consider ticket 05 (filter logic and form). Unit tests were written for `filterExpenses()`—does it filter by status? by type? by date range? Does it preserve the original array and return a new one? Once tests are written and failing, Feniks then implements the function that passes the tests.

Manual review is still needed to ensure that the tests cover the behaviour they need to, and that the code is written in a way that abides by practices and patterns already established in the repository. We set up guardrails for AI to achieve this by adding instruction to skills to reference our architecture document, ADRs and the design guidelines.

Occasionally the agent would write changes that break something, but with comprehensive testing in place it could course correct. When implementing ticket 09 (integrating the decision form into the detail page), all component tests passed. The form worked in isolation. But the E2E test failed: user navigates to an expense detail page, clicks Approve, but after going back to the list view, the status in the table doesn't update. We traced the bug: the form submitted and updated the mock repository, but the detail page wasn't re-fetching the updated expense to display the new status. Unprompted, to fix the bug, the agent added a useEffect hook to re-fetch after form submission. E2E test passed. This is a classic gap in AI-generated code: components work in isolation (unit tests pass) but break in integration (E2E tests catch it). The tests act as a safety net. This feedback loop (test fails, prompt, fix, retest) takes about three minutes per iteration.

### Human in the Loop: Trade-offs and Disagreements

There is a fundamental trade off with agentic development: having the developer in the loop is slower than simply unleashing the AI to write code without review. But it keeps the developer informed and in control of architectural decisions. Without human oversight, Feniks would generate code faster, but the codebase would reflect the AI's adhoc decisions about structure, naming, and patterns. Giving the jira-ticket sized problems enables developers to review code as they usually would with non-agentic programming, keeping developers responsible for and capable of maintaining the code.

A concrete example: ticket 03 (build the expense table component). Feniks generated a component that took `expenses` and `onRowClick` as props, rendering rows with a hardcoded column order. The component worked and tests passed. But when we reviewed it, we noticed the column definitions (field name, display label, width) were hard coded in the JSX. We disagreed with this approach. If we later needed to reorder columns or add new ones, we'd have to touch the render logic, and the reusability of the table component was limited to views that needed the exact same columns. We prompted Feniks to refactor extract column definitions into a constant, accept `columns` as a prop, make the render loop generic. This review cycle added maybe 20 minutes to the ticket but bought us a better codebase. Without human oversight, we'd have the working-but-rigid solution.

Another example: ticket 05 (filter logic). Feniks initially implemented filter state inside the FilterPanel component—when the user clicked "Apply Filters," the component called `onFiltersChange()` with the new criteria. This worked but meant filter state lived inside a component. We asked it to extract filter state to the parent component (`ReviewPage`) and have FilterPanel be a pure presentation component. This is a better separation of concerns: presentation (FilterPanel) stays dumb, state management and filtering logic (ReviewPage) stays coordinated. The resulting architecture is cleaner and easier to test in isolation.

These decisions (extracting column definitions, lifting state) are the kinds of choices that determine whether a codebase remains maintainable as it grows. An AI operating at full speed without human gatekeeping might not make these choices. The developer's involvement slows down the raw code-generation speed but ensures the decisions are deliberate and the architecture scales.

## Codebase Maintainability

This human-guided approach has resulted in a codebase that is not just functional but intentionally well-structured. The project includes comprehensive unit test coverage (filter logic, validation, data transformations all tested), end-to-end tests that verify key user journeys (user submits expense, reviewer approves, status updates), and strict TypeScript that catches type errors at compile time. Every component is documented in Storybook, allowing visual review and regression testing without running the full app. Architectural decisions are recorded in ADRs (Architecture Decision Records) in `docs/decisions/`, so future maintainers understand not just what the code does but why those decisions were made. The repo has clear separation of concerns: pages in `src/pages/`, shared components in `src/components/`, utilities in `src/lib/`, contexts in `src/context/`, and mock data in `src/mocks/`. Type definitions live in `src/types.ts` and are referenced throughout, ensuring consistency.

This maintainable structure emerged because for every ticket, the instructions given to Feniks across agents.md and skills invoked told the agent to follow the patterns in `docs/architecture.md`, to add Storybook stories for new components, to write tests before code, to use TypeScript strictly. We ensured that key decisions are documented in the PRD and ADR when they involved architectural trade-offs. The result is a codebase that new developers can onboard to quickly: the architecture is explicit, the test coverage is comprehensive, the types are a second form of documentation, and the Storybook is a visual reference for how components behave.

Vertical slices kept scope tight and demoable. TDD was effective because the test was the spec; Feniks knew exactly what to build. Pure functions were AI-friendly—when filter logic was defined as a pure function with clear inputs and outputs, it worked first try. The grill-me interview extracted architectural nuance upfront, preventing mid-project pivots. The three-layer testing strategy (unit, component, E2E) caught different bug classes and ensured the codebase remained maintainable as features were added. Model switching optimized iteration speed. And the skills workflow (grill-me → PRD → to-tickets → implement → validate) was repeatable and could be applied to the next feature with confidence.

The entire finance-pages feature—11 tickets, 25 user stories, two pages with filtering and stateful forms, full test coverage, Storybook stories, architectural decisions documented—took about 12 hours of agentic-assisted development time from one developer (real time, not time spent running the agent). This included time writing tests, reviewing generated code, prompting Feniks, and debugging integration issues. A solo human developer building this from scratch might have taken 2–3 days. The speed boost came primarily from Feniks generating boilerplate and straightforward logic, freeing the developer to focus on architecture, testing, and integration issues—the parts that require human judgment. More importantly, the human involvement ensured that every significant architectural decision was intentional, that the code was tested comprehensively, and that the codebase remained well-structured and maintainable as it grew.

## Choosing the Right Model

Throughout the project, we used both Claude 3.5 and Qwen 3.6 on-prem, switching between them intentionally.

Experimentation per project is needed to try to use the on prem models as much as possible, keeping costs down. Ultimately it's important that the developer continues to carefully review the outputs of their agentic workflow that intend to be maintained (documentation, code), to assess whether the workflow is working as expected, rather than depending on using larger models and expecting better outcomes.

## Parallel Development

Parallel development is achieved by opening multiple sessions (Ctrl + P -> new session).

## Tooling and Access Problems

See the problems.md file for a complete log of workflow problems encountered during development.

## Overall Findings

### Benefits

What did Feniks make easier, faster or better?

### Limitations

Where did Feniks struggle, introduce risk or require additional effort? What problems does the program experience that are attributed to using agentic AI?

### Effective Ways of Working

What practices appeared to make Feniks more effective?

Focus on lessons supported by examples from the project.

## Overview of Feniks Setup

- List of Skills used and details of custom skills
- Agents.md content
- In code documentation that supports feniks (style guides, architecture etc).
- Agents (and custom agents)
  - Include changes to permissions
- Instructions
- MCPs
- .opencode changes
- C:\Users\<user>\.config\opencode\ changes
- Configurations on LLM bridge

## Appendix

Optional supporting material:

- Example prompts
- Skills used
- Model/configuration details
- Screenshots
- Plans or generated outputs

## TODO

### SETUP OF FENIKS

- Note around using my own skills rather than skill lib, dump each skill, and how skill lib doesn't provide much guidance for usage of skills.
  - Consider recommending implementing something similar to the matt Pocock skill of skills
- Problems with setup (heading tooling and access problems)
- Needs to be part of regular practice to update ai workflow just like documentation.

### TIDYING (at the end)

- Correct tense throughout (we, I, the developer, time)

### OTHER

- Section on the workflow reference matt Pocock setup
- Suggestion for further investigation (usage on a larger project with multiple developers across time)
- Reference to needing to clean some bloat from architecture and adrs
- Add test coverage stats and proof for some color in implementation
- Read through Netco ai guide and Feniks ai guide and references/adjustments/criticisms of this based on that input
