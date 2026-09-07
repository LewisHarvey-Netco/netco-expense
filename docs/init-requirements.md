# Initial Requirements — Expense App (old)

**Date:** 2026-09-07
**Status:** Initial elicitation (working document)
**Source:** Requirements elicitation notes

## 1. Overview

An app for Netcompany employees to log expenses. Consultants log expenses (receipts); finance reviews them and either approves or flags them. This document captures the initial requirements, including pain points with the current app and the desired behaviour of the new one.

## 2. Users and authentication

- Two user groups:
  - **Consultants** — log expenses.
  - **Finance** — review expenses; approve or flag them.
- Users log in with **email and password**.
- Users select their group (consultant / finance) **when they create an account**.

## 3. Problems with the current app

Pain points the new app must address:

1. **Clunky list filtering.** The top-level filter is "open" vs "history". "History" includes submitted and approved items; "open" is presumably anything else — the distinction is not clear.
2. **Slow to open a new expense.** Long loading times when opening the new-expense form.
3. **Country re-entered on every receipt.**
4. **No expense-type favourites.** No favourites list sorted to the top, no type-and-autofill.
5. **Delivery selected every time.** Most expenses go to the same delivery, but the user must pick it each time. The downside of auto-selecting the last-used delivery is that it may be the wrong delivery.
6. **Whole receipt rejected for cap excess.** Accidentally submitting the full price of a dinner or lunch that goes over the £40 daily cap leads to the whole receipt being rejected instead of just the excess.
7. **Poor communication.** The note between finance and the receipt giver is a single text box.
8. **Navigation blocked by in-flight submits.** It takes ages to move to a new page while the previous page is still submitting.
9. **Unnecessary table columns.** The table view shows columns that are not needed.

## 4. Data model

### 4.1 Receipt (expense)

| Field | Description |
|---|---|
| `id` | Unique identifier |
| Description | Free-text description of the expense |
| Type | e.g. lunch, dinner, train, etc. |
| Amount | Monetary amount |
| Currency | Currency of the amount |
| Region | Region of the expense |
| Receipt date | Date the expense was incurred |
| Submission date | Date the expense was submitted |
| Status | `submitted`, `approved`, or `flagged` |

**Status:**

- `submitted` — logged by a consultant, awaiting finance review.
- `approved` — reviewed by finance and accepted.
- `flagged` — reviewed by finance and not accepted because it breaks a rule (missing info, over the daily cap, etc.).

**Food receipt:** a receipt whose type is `breakfast`, `lunch`, or `dinner`.

### 4.2 Conversation

Each receipt has an associated **conversation** in which the person who registered the receipt and the finance people reviewing it can chat back and forth about problems with the receipt. (The current single text box is inadequate — see problem 7.)

## 5. Feature requirements

### 5.1 Expense list view

- All expenses, regardless of status, are loaded into a **single paginated table view**.
- A good set of filtering tools at the top of the table, e.g.:
  - Submitted date
  - Receipt date
  - Type
  - Amount
  - **Date range** filter
- The table should show a useful, minimal set of columns (no unnecessary columns).
- Clicking a list item opens the expense for review. (Editing will be added later — out of scope for now.)

### 5.2 Expense creation

- Users can create an expense with the details in the data model above.
- **Expense types (presets):** For most people, every expense is logged to a single project with the same project, currency, and region. Users should be able to create an **expense type** capturing those recurring details. When creating an expense, selecting a type with a single click prefills those details.
  - Frequently used types should be easy to reach: favourites sorted to the top, with type-and-autofill search.
- **Delivery:** Most expenses go to the same delivery. The app should reduce the friction of selecting it every time, while still allowing the user to change it (auto-selecting the last-used delivery risks it being the wrong delivery).
- **Country/region should not have to be re-entered on every receipt** (e.g. remembered from the last use or prefilled via the expense type).
- Opening the new-expense form must be fast (no long loading times).
- **Navigation must not be blocked by in-flight submits** — the user should be able to move to a new page while a previous page is still submitting.

### 5.3 Multi-receipt submission

- People often submit many receipts at the same time; this journey needs to be fast so users can cycle through them all.
- The app should provide a **multi-receipt function**:
  - The user can select multiple receipt images at once.
  - The user can **drag and drop selected images into selected "expense" boxes**, since some expenses have multiple receipts.

### 5.4 Daily food caps

- In the UK there is an expense cap of **£40 per day for food** (breakfast, lunch, dinner).
- Per-meal maximums:
  - Dinner: **£25**
  - Lunch: **£15**
  - Breakfast: **£10**
- When the user chooses the date of an expense, the app should show the food amount **already logged for that day**. Example:
  > Breakfast: £5, Lunch: £10, Remaining: £25
- The app should **flag** an expense that would take the user outside the cap rules before submission, since such a receipt will be rejected by finance.
- Related pain point (problem 6): when a receipt does exceed the cap, ideally only the excess should be rejected rather than the whole receipt.

### 5.5 Dashboard

- A clear view of **all flagged receipts**.
- When clicking into a flagged receipt, the view should show **other food receipts from the same day** so the reviewer can check the caps.

## 6. Open questions

- What exactly is "delivery" (the field selected on every receipt)? Is it the same as project/cost centre, or a separate field?
- Is "country" (problem 3) the same field as "region" in the data model?
- Should the £40/£25/£15/£10 caps be UK-only, or configurable per region?
- What happens to a receipt flagged for cap excess — is the within-cap portion auto-approved, or does it stay flagged pending finance decision?
- Can finance edit or partially accept a flagged receipt, or only approve/flag?
