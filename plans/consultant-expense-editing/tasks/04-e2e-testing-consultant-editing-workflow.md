# 04: E2E Testing for Consultant Editing Workflow

**What to build:** End-to-end Playwright tests validating the complete consultant editing flow across all scenarios: successful resubmit, changes requested cycle, error recovery, approved immutability, and finance re-review.

**Blocked by:** 03-add-resubmit-submission-and-feedback-ui

**Status:** ready-for-agent

- [ ] E2E: Consultant logs in, navigates to `/expenses`, clicks a `Submitted` expense, edits a field (e.g., amount), clicks "Resubmit", sees success message, sees status change to `Resubmitted`, clicks "Back to Expenses", verifies list shows updated expense with `Resubmitted` status
- [ ] E2E: Consultant opens a `Changes Requested` expense, verifies internal notes are visible, edits fields to address feedback, clicks "Resubmit", verifies status changes to `Resubmitted`
- [ ] E2E: Consultant opens a resubmitted expense (status `Resubmitted`), makes another edit, clicks "Resubmit" again, verifies status remains `Resubmitted` (multiple edits before finance re-review work)
- [ ] E2E: Consultant opens an `Approved` expense, verifies form fields are disabled, verifies "Resubmit" button is not visible, cannot edit or submit
- [ ] E2E: Error recovery—attempt resubmit with network failure or invalid data, verify error message appears, verify "Resubmit" button remains clickable, correct the issue, retry, verify success
- [ ] E2E: Finance logs in, navigates to `/review`, clicks a `Resubmitted` expense, verifies form fields are disabled, verifies review decision form is present, approves the expense, verifies status changes to `Approved`, verifies consultant cannot edit the approved expense on subsequent visits
