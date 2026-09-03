import { Alert, AlertDescription } from '@/components/ui/alert'
import ReviewDecisionForm, { type ReviewDecision } from '@/components/ReviewDecisionForm'
import type { Expense, ExpenseStatus } from '@/types'

interface ExpenseReviewSectionProps {
  expense: Expense
  /**
   * Disables the form in addition to the status-based disablement; used while
   * a decision is being submitted.
   */
  disabled?: boolean
  onSubmit: (decision: ReviewDecision, comment?: string) => void
}

// Finance can record a decision only while the expense is awaiting (re)review.
// "Approved" is terminal and "Changes Requested" is waiting on the consultant
// to resubmit, so neither accepts a new decision (see ADR-0007).
const DECIDABLE_STATUSES: readonly ExpenseStatus[] = ['Submitted', 'Resubmitted']

function isDecidable(status: ExpenseStatus): boolean {
  return DECIDABLE_STATUSES.includes(status)
}

function decisionMessage(status: ExpenseStatus): string {
  if (status === 'Approved') {
    return 'Decision recorded. This expense has been approved.'
  }
  return 'Changes have been requested. Waiting for the consultant to resubmit.'
}

/**
 * Finance-only expense review section.
 *
 * Renders the ReviewDecisionForm and, below it, the decision status message
 * (Approved is terminal; Changes Requested awaits a consultant resubmission —
 * see ADR-0007). The message is always rendered in a reserved slot and only
 * made invisible while the expense is decidable, so the layout does not shift
 * when a decision is recorded. The form is disabled when the expense is not
 * decidable or when `disabled` is set (e.g. while a decision is being
 * submitted).
 */
export default function ExpenseReviewSection({
  expense,
  disabled = false,
  onSubmit,
}: ExpenseReviewSectionProps) {
  const canDecide = isDecidable(expense.status)

  return (
    <div className="flex flex-col gap-4">
      <ReviewDecisionForm disabled={!canDecide || disabled} onSubmit={onSubmit} />
      <Alert className={canDecide ? 'invisible' : undefined}>
        <AlertDescription>{decisionMessage(expense.status)}</AlertDescription>
      </Alert>
    </div>
  )
}
