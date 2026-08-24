# ADR-0004: Expense data model as JSON Schema with TypeScript interfaces

## Status
Accepted

## Context

The Finance Review Pages feature requires an expense data model with fields, types, constraints, and validation rules. This model will be used by the frontend now and eventually by a backend API. A decision was needed on where the model lives, in what format, and how the frontend consumes it.

## Decision

Define the expense data model in **JSON Schema Draft 2020-12** format in `src/schemas/expense.schema.json`. Derive TypeScript interfaces (`Expense`, `ExpenseType`, `ExpenseStatus`) in `src/types.ts` from the schema. A Markdown summary is maintained in `docs/data-models/expense.md` for non-technical stakeholders and reference.

The JSON Schema in `src/schemas/` is the **authoritative source of truth**. TypeScript interfaces are a downstream artifact that must stay in sync with the schema.

**Runtime Validation:** Use `ajv` (JSON Schema validator) in `src/lib/expense-validation.ts` to validate all expense data against the JSON Schema at runtime. This ensures that data from any source (mock files, API responses, form submissions) conforms to the schema constraints before being treated as an `Expense`.

## Rationale

- JSON Schema is a standard, toolable format that can be validated, documented, and consumed by both frontend and backend teams.
- Keeping the schema in `src/schemas/` makes it source code, directly importable by the validator and TypeScript. A Markdown summary in `docs/` remains accessible to non-technical stakeholders and future backend developers.
- Deriving TypeScript interfaces from the schema ensures type safety in the app while maintaining a single source of truth.
- Runtime validation via `ajv` compiles the schema once and reuses the validator for all expense data, ensuring all data (internal or external) conforms to constraints before being used.
- This approach prepares for backend API integration: when a real API exists, the schema can be shared with backend developers or used to auto-generate API contracts. Both frontend and backend validate against the same schema.

## Consequences

- **Two artifacts to maintain:** The JSON Schema and TypeScript interfaces must stay in sync. If the schema changes, the interfaces must be updated in the same commit.
- **No auto-generation today:** TypeScript interfaces are hand-derived, not generated from the schema. This is acceptable at current scale but could be automated later if the schema grows complex.
- **Single source of truth at runtime:** The JSON Schema is the authoritative source. The `ajv` validator compiles the schema once at module load time and reuses it for all validations. No duplication of constraints.
- **Validation at boundaries:** All expense data entering the system must be validated via `validateAndParseExpense()` or checked with `isValidExpense()`. This includes mock data, API responses, and form submissions.
- **Future backend alignment:** When a backend API is introduced, the JSON Schema can be referenced directly or used to generate API endpoints, reducing the risk of frontend/backend contract mismatches. The same schema is used for both frontend and backend validation.
