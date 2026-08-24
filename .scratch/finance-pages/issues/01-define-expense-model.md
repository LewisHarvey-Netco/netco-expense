# 01: Define Expense Data Model & Schema

**What to build:** Create the authoritative expense data model in JSON Schema format and Markdown documentation, then define TypeScript interfaces for use throughout the app. This establishes the single source of truth for expense structure: fields, types, constraints, and validation rules.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Create `docs/data-models/expense.schema.json` in JSON Schema Draft 2020-12 format with all required fields (id, submitterId, description, type, amount, currency, receiptDate, status, submittedAt, internalNotes, region, project)
- [ ] Create `docs/data-models/expense.md` documenting the schema in Markdown with field descriptions, types, constraints, and notes
- [ ] Define TypeScript interfaces in `src/types.ts`: `Expense`, `ExpenseType` (enum with five types), `ExpenseStatus` (enum with four statuses)
- [ ] Write unit tests validating schema constraints (id is UUID, amount > 0, currency is ISO 4217, receiptDate is ISO 8601, etc.)
