# Expense Data Model

**Authority:** See `expense.schema.json` (JSON Schema Draft 2020-12) for the machine-readable specification.

## Overview

An **Expense** represents a submitted business expense submitted by a consultant for review and approval by finance. Each expense goes through a workflow: initial submission → finance review → approval or request for changes → resubmission (optional) → final approval.

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (e.g., `exp-001`) |
| `submitterId` | string | Yes | User ID of the consultant who submitted |
| `description` | string | Yes | Human-readable description (e.g., `Client Dinner — The Ivy`) |
| `type` | enum | Yes | Category: `Breakfast`, `Lunch`, `Dinner`, `Transport`, `Accommodation` |
| `amount` | number | Yes | Monetary amount as decimal (e.g., `62.00`). Must be > 0. |
| `currency` | string | Yes | ISO 4217 code (e.g., `GBP`, `EUR`, `USD`). Exactly 3 uppercase letters. |
| `receiptDate` | string | Yes | ISO 8601 date when receipt was issued (e.g., `2025-08-15`) |
| `status` | enum | Yes | Workflow status: `Submitted`, `Approved`, `Changes Requested`, `Resubmitted` |
| `submittedAt` | string | Yes | ISO 8601 timestamp when submitted to finance (e.g., `2025-08-15T14:30:00Z`) |
| `internalNotes` | string or null | No | Finance-only notes (typically populated when `status = Changes Requested`). Defaults to `null`. |
| `region` | string | Yes | Geographic region or office (e.g., `UK — London`, `Denmark — Copenhagen`) |
| `project` | string | Yes | Associated project or client (e.g., `Acme Corp — Platform`) |

## Status Workflow

```
Submitted
    ↓
    ├─→ Approved ✓ (done)
    │
    └─→ Changes Requested
            ↓
        Resubmitted
            ↓
            ├─→ Approved ✓ (done)
            │
            └─→ Changes Requested (cycle repeats)
```

| Status | Meaning | Set By |
|--------|---------|--------|
| `Submitted` | Initial submission by consultant | Consultant (on creation) |
| `Approved` | Finance approved; no further action needed | Finance (via review form) |
| `Changes Requested` | Finance flagged; consultant must revise and resubmit | Finance (via review form) |
| `Resubmitted` | Consultant resubmitted after addressing feedback | Consultant (on resubmission) |

## Example

```json
{
  "id": "exp-001",
  "submitterId": "u1",
  "description": "Client Dinner — The Ivy",
  "type": "Dinner",
  "amount": 62.00,
  "currency": "GBP",
  "receiptDate": "2025-08-15",
  "status": "Changes Requested",
  "submittedAt": "2025-08-15T14:30:00Z",
  "internalNotes": "Exceeds dinner cap of £25. Please adjust or provide business justification.",
  "region": "UK — London",
  "project": "Acme Corp — Platform"
}
```

## Notes

- **Types** are fixed by policy and represent expense categories recognized by the organization (meal categories and transport).
- **Currency** must be a valid ISO 4217 code (e.g., GBP, EUR, USD).
- **internalNotes** is optional and only used when `status = Changes Requested` to explain what needs to be revised. On submission, it defaults to `null`.
- **Timestamps** (`submittedAt`, and future fields like `approvedAt`, `changedRequestedAt`) use ISO 8601 format with UTC timezone.
- **No receipt image URL or conversation thread** are stored in this model. Those are handled separately in the application layer for now.
