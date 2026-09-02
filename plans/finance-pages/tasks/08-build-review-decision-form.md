# 08: Build Review Decision Form Component

**What to build:** Create a `ReviewDecisionForm` component with "Approve" and "Request Changes" buttons. When "Request Changes" is selected, a comment field appears and becomes required. Form submission should call a callback with the decision and optional comment.

**Blocked by:** 02 - Create Mock Expenses Dataset

**Status:** done

- [x] Create `src/components/ReviewDecisionForm.tsx` 
- [x] Use react-hook-form + zod for form state
- [x] Form has two buttons: "Approve" and "Request Changes"
- [x] Only one action can be selected at a time (radio or conditional rendering)
- [x] When "Request Changes" is selected:
  - Comment field appears (text area)
  - Comment is marked as required in validation
  - User cannot submit form without entering comment text
- [x] When "Approve" is selected:
  - Comment field is hidden
  - Form can be submitted without comment
- [x] On form submission, call `onSubmit(decision: 'approve' | 'request-changes', comment?: string)`
- [x] Styling: "Approve" button uses primary (green) style, "Request Changes" uses secondary or outline style
- [x] Apply DESIGN-GUIDELINES (Coral for one prominent action max — use for Approve if needed)
- [x] Write component tests verifying:
  - "Approve" button appears and can be selected
  - "Request Changes" button appears and can be selected
  - Comment field is hidden by default, appears when "Request Changes" selected
  - Comment is required when "Request Changes" is selected
  - Form submission calls callback with correct values
  - Form validation prevents submission without required comment
