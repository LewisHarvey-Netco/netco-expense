# ADR-0004: Expense data model as JSON Schema with TypeScript interfaces

## Status
Accepted

## Context

The Finance Review Pages feature requires an expense data model with fields, types, constraints, and validation rules. This model will be used by the frontend now and eventually by a backend API. A decision was needed on where the model lives, in what format, and how the frontend consumes it.

## Decision

Define the expense data model in **JSON Schema Draft 2020-12** format in `docs/data-models/expense.schema.json`, with a Markdown summary in `docs/data-models/expense.md`. Derive TypeScript interfaces (`Expense`, `ExpenseType`, `ExpenseStatus`) in `src/types.ts` from the schema.

The JSON Schema is the **authoritative source of truth**. TypeScript interfaces are a downstream artifact that must stay in sync with the schema.

## Rationale

- JSON Schema is a standard, toolable format that can be validated, documented, and consumed by both frontend and backend teams.
- Keeping the schema in `docs/` makes it accessible to non-code stakeholders (product, design) and future backend developers without requiring TypeScript knowledge.
- Deriving TypeScript interfaces from the schema ensures type safety in the app while maintaining a single source of truth.
- This approach prepares for backend API integration: when a real API exists, the schema can be shared with backend developers or used to auto-generate API contracts.

## Consequences

- **Two artifacts to maintain:** The JSON Schema and TypeScript interfaces must stay in sync. If the schema changes, the interfaces must be updated in the same commit.
- **No auto-generation today:** TypeScript interfaces are hand-derived, not generated from the schema. This is acceptable at current scale but could be automated later if the schema grows complex.
- **Validation is manual:** The JSON Schema is not used for runtime validation in the frontend today. It serves as documentation and contract. If runtime validation is needed (e.g., for user input), zod schemas can be derived from the JSON Schema in the future.
- **Future backend alignment:** When a backend API is introduced, the JSON Schema can be referenced directly or used to generate API endpoints, reducing the risk of frontend/backend contract mismatches.
