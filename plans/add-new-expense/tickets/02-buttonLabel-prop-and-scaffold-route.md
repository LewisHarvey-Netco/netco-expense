# 02: Add `buttonLabel` prop to `ExpenseDetailCard` and scaffold `/expenses/new` route

**What to build:** `ExpenseDetailCard` is reusable for both edit and create contexts, and consultants can navigate to `/expenses/new` to see an editable form pre-populated with defaults (today's date, USD, consultant's ID, Submitted status).

**Blocked by:** None (can start immediately).

**Status:** done

## Acceptance Criteria

- [x] Add optional `buttonLabel?: string` prop to `ExpenseDetailCard` component (defaults to `'Resubmit'`)
- [x] Button text renders `buttonLabel` value when provided
- [x] Button renders default `'Resubmit'` when `buttonLabel` is not provided (backward compatibility)
- [x] Form behavior unchanged; only button label is customizable
- [x] Create `src/pages/ExpenseCreatePage.tsx` with: UUID generation on mount, default template initialization (amount: 0, currency: USD, receiptDate: today's date in YYYY-MM-DD, submittedAt: full ISO datetime, status: 'Submitted', submitterId: current user's ID)
- [x] Render `ExpenseDetailCard` with `isEditable={true}` and `buttonLabel="Submit"`
- [x] Add route to `App.tsx`: `/expenses/new` defined **before** `/expenses/:id` (route order matters)
- [x] Wrap route in `ProtectedRoute` with `requiredRole="consultant"`
- [x] Tests cover: card renders custom button label, card renders default label when omitted, page renders with correct defaults, form is editable
- [x] Storybook story updated to show both button label variants
