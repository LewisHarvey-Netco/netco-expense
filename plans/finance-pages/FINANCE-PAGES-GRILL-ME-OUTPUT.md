# Finance Pages Implementation — Grill-Me Interview Output

**Date:** 2026-08-24  
**Session:** Comprehensive design interview to establish shared understanding of finance pages implementation  
**Outcome:** All architectural, routing, data, and UI decisions documented with rationale

---

## Executive Summary

This document captures the output of a relentless grill-me interview covering every aspect of implementing two finance pages:
1. `/review` — All expenses table (finance landing page)
2. `/review/:id` — Expense detail page with review decision form

The interview resolved all major design dependencies in a single-threaded tree walk, recording recommendations and confirming choices.

---

## Decision Tree & Questions

### Decision 1: Routing Structure

**Question:** How should the routes be organized?

**Options considered:**
- Option 1: `/finance` → all expenses, `/finance/review/:id` → detail (namespaced)
- Option 2: `/review` → all expenses, `/review/:id` → detail (reuse existing route, minimal change)
- Option 3: `/expenses` → all expenses (shared with consultant), `/expenses/:id` → detail

**Recommendation:** Option 2 — Keep `/review` as the finance landing (all expenses table) and add `/review/:id` for detail. Minimal change to existing `roleHome()` function; reuses existing route guard; the current `/review` is just a placeholder anyway.

**Decision:** ✅ **OPTION 2** — User confirmed.

**Rationale:**
- Current codebase already has `/review` with a ProtectedRoute guard for finance role
- `roleHome('finance')` already returns `/review`, no changes needed
- Cleaner than inventing new routes; pragmatic over architectural purity

---

### Decision 2: Review Page Scope (What Features?)

**Question:** The prototype `review.html` has four distinct sections. What's in scope?

**Prototype sections:**
1. Expense Details (left column)
2. Receipt Image placeholder (left column)
3. Daily Food Cap Summary (right column)
4. Flag Details (right column)
5. Review Decision form (right column)
6. Communication/Conversation thread (right column)

**Options considered:**
- Option A: All sections (full implementation)
- Option B: Left column only (Expense Details + Receipt) — right column later
- Option C: Left column + Review Decision form only (skip cap summary, flag details, conversation)
- Option D: Custom combination

**Recommendation:** Option C — Expense Details + Receipt placeholder + Review Decision form. Gives a functional review flow without the complexity of cap calculations, flag logic, and messaging. The right-column features (cap summary, conversation) can be added later.

**Decision:** ✅ **OPTION 3** — User confirmed.

**Rationale:**
- Scope creep prevention: cap calculations and conversation threads are complex
- MVP-focused: core workflow is approve/request changes, which is implementable now
- Conversation integration tracked separately in TODO.md as "Blocking Go-Live"

---

### Decision 3: Status Workflow

**Question:** What statuses should expenses have, and what's the workflow?

**Initial options:**
- "Submitted", "Approved", "Flagged" (from prototype)
- Plus what happens when flagged?

**User requirements clarified:**
- Remove "Reject" and "Partial Approval" decision options (for now)
- Need a status for "finance flagged it, submitter must revise"
- Need a separate status for "submitter resubmitted after changes, finance must re-review"

**Statuses defined:**
1. `Submitted` — Consultant initially submitted
2. `Approved` — Finance approved; done
3. `Changes Requested` — Finance flagged; consultant must revise
4. `Resubmitted` — Consultant resubmitted after changes; finance must re-review

**Decision:** ✅ **CONFIRMED** — All four statuses locked in.

**Workflow:**
```
Submitted
  ├─→ Approved ✓ (end)
  └─→ Changes Requested
      └─→ Resubmitted
          ├─→ Approved ✓ (end)
          └─→ Changes Requested (cycle repeats)
```

**Rationale:**
- Clearer than "Flagged" — statuses now explicitly represent the submitter's action
- Aligns with conversation integration work (future TODO)

---

### Decision 4: Review Decision Form Actions

**Question:** What actions should the finance person be able to take?

**Options considered:**
- Option A: Approve, Reject, Partial Approval (from prototype)
- Option B: Approve, Request Changes (simpler)

**Recommendation:** Option B — Just Approve and Request Changes. Partial approval adds complexity (partial amount tracking, re-approval logic) that can come later. Maps cleanly to status transitions: Approve → `Approved`, Request Changes → `Changes Requested`.

**Decision:** ✅ **OPTION B** — User confirmed.

**Additional requirement:** When finance selects "Request Changes", they must write a comment. This comment should later be auto-added to the conversation thread (tracked as Blocking Go-Live TODO, implemented later).

**Rationale:**
- Simpler first implementation
- Reject/Partial approval are separate features; prioritize core approve/request workflow
- Comment field establishes the pattern for future conversation integration

---

### Decision 5: Mock Data — Quantity & Coverage

**Question:** How much mock expense data should we generate?

**Options considered:**
- Option A: ~10 expenses covering all statuses and types
- Option B: ~20 expenses with more variety, multiple submitters
- Option C: Just 3-5 minimal ones

**Recommendation:** Option A — ~10 expenses. Enough to make filtering/sorting meaningful and show all statuses and types, without bloat.

**Decision:** ✅ **OPTION A** — User confirmed.

**Coverage required:**
- All four statuses (Submitted, Approved, Changes Requested, Resubmitted)
- All five types (Breakfast, Lunch, Dinner, Transport, Accommodation)
- Multiple submitters (use existing users: Alice Nielsen, Bob Madsen)
- Realistic data (mixed regions, projects, currencies)

---

### Decision 6: Data Model Authority & Format

**Question:** How should we document the expense data model?

**Options considered:**
- Option A: Markdown table only
- Option B: JSON Schema only
- Option C: Both — JSON Schema as source of truth + Markdown summary

**User request:** Document as industry standard, and confirm the format.

**Recommendation:** Option C with **JSON Schema Draft 2020-12**. JSON Schema is:
- IETF RFC standard (widely tooling-supported)
- Machine-readable (can generate TypeScript types, zod schemas, OpenAPI specs)
- Future-proof for backend integration
- Plus Markdown for human readability

**Location:**
- `docs/data-models/expense.schema.json` — authoritative schema
- `docs/data-models/expense.md` — Markdown summary

**Decision:** ✅ **CONFIRMED** — JSON Schema Draft 2020-12 + Markdown.

---

### Decision 7: Expense Data Model Fields

**Question:** What fields should be in the authoritative expense model?

**Base fields (required from prototypes):**
- id, submitterId, description, type, amount, currency, receiptDate, status, submittedAt, internalNotes

**Additional fields discussed:**
- region (shown in prototype review page)
- project (shown in prototype review page)
- receiptImageUrl (for receipt image display — future feature)
- conversation array (for messages — future feature)

**Recommendation:** Include region and project (they appear in the prototype and make data feel complete). Skip receiptImageUrl and conversation (those are view-specific and can be added when those features are implemented).

**Final field list:**
```
id                string (required)
submitterId       string (required)
description       string (required)
type              enum: Breakfast, Lunch, Dinner, Transport, Accommodation (required)
amount            number > 0 (required)
currency          string, ISO 4217 (required)
receiptDate       ISO 8601 date (required)
status            enum: Submitted, Approved, Changes Requested, Resubmitted (required)
submittedAt       ISO 8601 timestamp (required)
internalNotes     string | null (optional, typically populated when status = Changes Requested)
region            string (required)
project           string (required)
```

**Decision:** ✅ **CONFIRMED** — All fields locked in.

---

### Decision 8: Expense Types (Enum)

**Question:** What are the valid expense types?

**From prototype:** Breakfast, Lunch, Dinner, Transport, Accommodation

**Additional options to consider:** Parking, Supplies, etc.?

**Decision:** ✅ **CONFIRMED** — Stick with prototype types: Breakfast, Lunch, Dinner, Transport, Accommodation.

---

### Decision 9: Table Columns & Sorting

**Question:** What columns in the all expenses table? Should they be sortable?

**Prototype columns:** Submitted, Submitter, Description, Type, Amount, Status, [Action]

**Options considered:**
- Option A: Exact prototype columns, no sorting
- Option B: Exact prototype columns + sortable headers
- Option C: Subset of columns (remove Type, etc.)

**Recommendation:** Option A — Stick with prototype, no sorting yet. Sorting adds state management (which column, ascending/descending) that can come later.

**Decision:** ✅ **OPTION A** — User confirmed.

---

### Decision 10: Filter Behavior

**Question:** Should filters update the table in real-time or require an "Apply Filters" button?

**Options considered:**
- Option A: Real-time filtering (updates as you type/select)
- Option B: "Apply Filters" button (current user action required)
- Option C: Skip filters for now

**Recommendation:** Option B — Button-triggered. Real-time filtering requires either network calls or local state representation, both adding complexity.

**Decision:** ✅ **OPTION B** — User confirmed.

**Filter fields:** Status, Submitter, Type, Date Range

---

### Decision 11: Header Navigation

**Question:** How should the nav be structured?

**Prototype nav:** "Flagged Queue", "All Expenses", "Statistics"

**Current state:** Minimal Header with just branding, user name, logout

**Options considered:**
- Option A: Keep minimal header; add separate navbar below
- Option B: Extend Header to include nav links
- Option C: Replace Header with a new component matching prototype

**Recommendation:** Option B — Extend existing Header. Add a nav section with "All Expenses" link. Keep clean and restrained per DESIGN-GUIDELINES.

**Decision:** ✅ **OPTION B** — User confirmed.

**Scope for nav links:** Just "All Expenses" for now. Flagged Queue and Statistics are separate features added later (Option B from an earlier question about page scope).

---

### Decision 12: Table Component

**Question:** How to render the table? Existing shadcn components?

**Options considered:**
- Option A: Use shadcn Table component (if it exists or add via CLI)
- Option B: Hand-write `<table>` with Tailwind styling
- Option C: Third-party table library (TanStack Table, etc.)

**Recommendation:** Option A — Use shadcn Table component. It's vendored in the project (per AGENTS.md convention), avoiding external dependency.

**Decision:** ✅ **OPTION A** — User confirmed.

---

### Decision 13: Responsive Design

**Question:** Should the table adapt to mobile/tablet, or desktop-only?

**Options considered:**
- Option A: Stack to card-based layout on mobile
- Option B: Horizontal scroll on mobile
- Option C: Desktop-only for now

**Recommendation:** Option C — Desktop-only. The app is in early prototype stage. Responsive design can be added once core flows work.

**Decision:** ✅ **OPTION C** — User confirmed.

---

## Final Decisions Summary Table

| # | Topic | Decision | Rationale |
|----|-------|----------|-----------|
| 1 | Routing | `/review` (all), `/review/:id` (detail) | Reuse existing route; minimal change |
| 2 | Review page scope | Expense Details + Receipt + Decision form | Skip cap summary/conversation for now |
| 3 | Statuses | Submitted, Approved, Changes Requested, Resubmitted | Clear workflow; aligns with revisions |
| 4 | Decision actions | Approve, Request Changes only | Simpler; Reject/Partial later |
| 5 | Mock data qty | ~10 expenses | Enough variety; covers all statuses/types |
| 6 | Data model format | JSON Schema Draft 2020-12 + Markdown | Industry standard; tooling-friendly |
| 7 | Data model fields | 11 fields (id, submitterId, description, type, amount, currency, receiptDate, status, submittedAt, internalNotes, region, project) | Complete but minimal; future-extensible |
| 8 | Types enum | Breakfast, Lunch, Dinner, Transport, Accommodation | From prototype; policy-aligned |
| 9 | Table columns | Submitted, Submitter, Description, Type, Amount, Status, Action | From prototype; no sorting (yet) |
| 10 | Filter trigger | "Apply Filters" button | Avoids state management complexity |
| 11 | Header nav | Extend Header with "All Expenses" link | Clean, restrained; per design guidelines |
| 12 | Table component | shadcn Table (via CLI) | Vendored; no external dependency |
| 13 | Responsive | Desktop-only (for now) | MVP focus; mobile comes later |

---

## Implementation Roadmap (Not In Scope)

This grill-me session established what to build, not how. Implementation tasks:

1. Create expense data model files (schema.json + markdown)
2. Generate mock expenses.json (~10 realistic entries)
3. Add shadcn Table component
4. Extend Header with nav links
5. Implement `/review` page (all expenses table + filters)
6. Implement `/review/:id` page (expense detail + decision form)
7. Update architecture.md if new patterns emerge
8. Add e2e and unit tests

**Deferred (Future Work, Not In Scope):**
- Conversation/comment integration (Blocking Go-Live TODO)
- Cap summary calculations
- Flag details display
- Sorting, pagination
- Mobile responsiveness
- Partial approval logic
- Reject action

---

## Design Constraints

### Architecture
- Follow patterns in `docs/architecture.md` (no new service/API layer yet)
- Use existing `AuthContext` for user info
- Route guards via `ProtectedRoute` (already in place)

### Styling
- Follow `DESIGN-GUIDELINES.md` strictly
- Use only Netcompany palette (green, dark-green, white, coral)
- No arbitrary colours or heavy decoration
- Studio 6 typography, restrained style
- Max one prominent coral use per page

### Testing
- Vitest + React Testing Library for component/unit tests (colocated `.test.tsx`)
- Playwright E2E tests in `e2e/` (optional but recommended)

---

## Open Questions / Future Sessions

None — this interview resolved all foundational decisions. Ready for implementation.
