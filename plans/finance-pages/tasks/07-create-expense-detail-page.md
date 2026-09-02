# 07: Create Expense Detail Page (/review/:id)

**What to build:** Build the `/review/:id` route page that displays a single expense's full details in a structured layout. Left column shows expense info and receipt placeholder; right column is ready for the review decision form (implemented in next ticket).

**Blocked by:** 02 - Create Mock Expenses Dataset

**Status:** done

- [x] Create `src/pages/ExpenseDetailPage.tsx` as route-level component
- [x] Add route to `src/App.tsx`: `<Route path="/review/:id" element={<ProtectedRoute role="finance"><ExpenseDetailPage /></ProtectedRoute>} />`
- [x] Load expense by ID from mock data (or route param)
- [x] Left column display (styled card or section):
  - Amount (prominent, formatted with currency)
  - Type (badge)
  - Date (receiptDate, formatted)
  - Submitter (name or "Submitted by: Alice Nielsen")
  - Region
  - Project
  - Description
  - Receipt image placeholder (static image or "Receipt not yet uploaded" message)
- [x] Right column placeholder (empty space or "Loading..." — review form added in next ticket)
- [x] Handle missing/invalid expense ID gracefully (404 or redirect)
- [x] Apply styling per DESIGN-GUIDELINES (restrained, Netcompany palette)
- [x] Write component tests verifying:
  - Correct expense details are displayed
  - Invalid expense ID shows error or redirects
  - All fields render with correct formatting
