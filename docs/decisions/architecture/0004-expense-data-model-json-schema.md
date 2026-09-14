# ADR-0004: Expense data model as JSON Schema with TypeScript interfaces

## Status
Accepted

## Context

The Finance Review Pages feature requires an expense data model with fields, types, constraints, and validation rules. This model will be used by the frontend now and eventually by a backend API. A decision was needed on where the model lives, in what format, and how the frontend consumes it.

## Decision

Define the expense data model in **JSON Schema Draft 2020-12** format in `src/schemas/expense.schema.json`. Derive TypeScript interfaces (`Expense`, `ExpenseType`, `ExpenseStatus`) in `src/types.ts` from the schema. A Markdown summary is maintained in `docs/data-models/expense.md` for non-technical stakeholders and reference.

The JSON Schema in `src/schemas/` is the **authoritative source of truth**. TypeScript interfaces are a downstream artifact that must stay in sync with the schema.

**Runtime Validation:** Use `ajv` (JSON Schema validator) in `src/lib/expense-validation.ts` to validate expense data against the JSON Schema at **write boundaries** (form submissions, mutations). Mock data and API responses are loaded without validation, allowing the app to boot and operate even with invalid or corrupted backend data. Read operations may encounter invalid data and must handle it gracefully.

## Rationale

- JSON Schema is a standard, toolable format that can be validated, documented, and consumed by both frontend and backend teams.
- Keeping the schema in `src/schemas/` makes it source code, directly importable by the validator and TypeScript. A Markdown summary in `docs/` remains accessible to non-technical stakeholders and future backend developers.
- Deriving TypeScript interfaces from the schema ensures type safety in the app while maintaining a single source of truth.
- Runtime validation via `ajv` compiles the schema once and reuses the validator for write-boundary checks (form submissions, mutations), protecting data integrity when changes are persisted.
- Validation happens at write boundaries, not load time, because the frontend must tolerate invalid data from the backend—just as it would if a database contained corrupted records or incomplete migrations. This mirrors real-world production scenarios.
- This approach prepares for backend API integration: when a real API exists, the schema can be shared with backend developers or used to auto-generate API contracts. Both frontend and backend validate data at write boundaries before persistence.

## Consequences

- **Two artifacts to maintain:** The JSON Schema and TypeScript interfaces must stay in sync. If the schema changes, the interfaces must be updated in the same commit.
- **No auto-generation today:** TypeScript interfaces are hand-derived, not generated from the schema. This is acceptable at current scale but could be automated later if the schema grows complex.
- **Single source of truth at runtime:** The JSON Schema is the authoritative source. The `ajv` validator compiles the schema once at module load time and reuses it for all write-boundary validations. No duplication of constraints.
- **Validation at write boundaries only:** Expense data is validated via `validateAndParseExpense()` before mutations (form submissions, status changes) to ensure persisted data is valid. Read operations use `isValidExpense()` for defensive checks but must tolerate invalid data gracefully. Mock data and API responses load without validation, allowing the app to operate even with corrupted or incomplete backend data.
- **Resilience to backend data issues:** By not validating at load time, the app can boot and display partial/invalid data from the backend, matching real-world scenarios where corruption or incomplete migrations might occur. This prevents a single invalid record from breaking the entire app.
- **Future backend alignment:** When a backend API is introduced, the JSON Schema can be referenced directly or used to generate API endpoints, reducing the risk of frontend/backend contract mismatches. Both frontend and backend validate data at write boundaries before persistence.
