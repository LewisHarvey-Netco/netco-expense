# 07: Create Expense Detail Page (/review/:id)

**What to build:** Build the `/review/:id` route page that displays a single expense's full details in a structured layout. Left column shows expense info and receipt placeholder; right column is ready for the review decision form (implemented in next ticket).

**Blocked by:** 02 - Create Mock Expenses Dataset

**Status:** ready-for-agent

- [ ] Create `src/pages/ExpenseDetailPage.tsx` as route-level component
- [ ] Add route to `src/App.tsx`: `<Route path="/review/:id" element={<ProtectedRoute role="finance"><ExpenseDetailPage /></ProtectedRoute>} />`
- [ ] Load expense by ID from mock data (or route param)
- [ ] Left column display (styled card or section):
  - Amount (prominent, formatted with currency)
  - Type (badge)
  - Date (receiptDate, formatted)
  - Submitter (name or "Submitted by: Alice Nielsen")
  - Region
  - Project
  - Description
  - Receipt image placeholder (static image or "Receipt not yet uploaded" message)
- [ ] Right column placeholder (empty space or "Loading..." — review form added in next ticket)
- [ ] Handle missing/invalid expense ID gracefully (404 or redirect)
- [ ] Apply styling per DESIGN-GUIDELINES (restrained, Netcompany palette)
- [ ] Write component tests verifying:
  - Correct expense details are displayed
  - Invalid expense ID shows error or redirects
  - All fields render with correct formatting
