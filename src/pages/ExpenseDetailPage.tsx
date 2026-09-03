import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from 'lucide-react'
import Header from '@/components/Header'
import PageTitle from '@/components/PageTitle'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import ExpenseReviewSection from '@/components/expenses/ExpenseReviewSection'
import type { ReviewDecision } from '@/components/ReviewDecisionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/context/AuthContext'
import { useRepository } from '@/context/RepositoryContext'
import NotFoundPage from '@/pages/NotFoundPage'
import type { Expense, ExpenseStatus } from '@/types'

/**
 * The statuses in which a consultant may edit their own expense. `Approved`
 * is terminal and never editable; finance never edits (the review workflow is
 * unchanged). See ADR-0013.
 */
const CONSULTANT_EDITABLE_STATUSES: readonly ExpenseStatus[] = [
  'Submitted',
  'Changes Requested',
  'Resubmitted',
]

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepository()
  const { user } = useAuth()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setExpense(null)
      setLoaded(true)
      return
    }
    let cancelled = false
    setLoaded(false)
    setLoadError(null)
    repo
      .getExpense(id)
      .then((result) => {
        if (cancelled) return
        setExpense(result)
        setLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('Failed to load the expense. Please try again.')
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [id, repo])

  if (!loaded) {
    return (
      <div className="min-h-svh bg-background">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
          <p className="text-sm text-muted-foreground">Loading expense…</p>
        </main>
      </div>
    )
  }

  // The page is served behind a ProtectedRoute, so a user is expected. Fail
  // closed to the 404 if, against expectation, there is none.
  if (!user) {
    return <NotFoundPage />
  }

  if (loadError) {
    return (
      <div className="min-h-svh bg-background">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
          <PageTitle className="mb-6">Expense Detail</PageTitle>
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  if (!expense) {
    return <NotFoundPage />
  }

  // Ownership check (consultants only): a consultant may only view their own
  // expenses. On a mismatch we render the same 404 as an unknown id so the
  // response doesn't reveal that the expense exists (see ADR-0012).
  if (user.role === 'consultant' && user.id !== expense.submitterId) {
    return <NotFoundPage />
  }

  const isFinance = user.role === 'finance'
  const backTo = isFinance ? '/review' : '/expenses'
  const backLabel = isFinance ? 'Back to All Expenses' : 'Back to My Expenses'

  // Consultants may edit their own expense while it is in a non-terminal
  // status; finance always sees a read-only card (review workflow unchanged).
  const isEditable =
    user.role === 'consultant' && CONSULTANT_EDITABLE_STATUSES.includes(expense.status)

  async function handleDecision(decision: ReviewDecision, comment?: string) {
    if (!id) return
    const status: ExpenseStatus = decision === 'approve' ? 'Approved' : 'Changes Requested'
    setSubmitting(true)
    setDecisionError(null)
    try {
      const updated = await repo.updateExpenseStatus(id, status, comment)
      setExpense(updated)
    } catch {
      setDecisionError('Failed to record the decision. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // A consultant resubmits their own expense. The card owns the submission
  // feedback (loading/success/error); the page only performs the data mutation
  // and refreshes the displayed expense. Rejections propagate to the card,
  // which surfaces the inline error and keeps the button enabled for retry.
  async function handleResubmit(updatedExpense: Expense) {
    if (!id) return
    const updated = await repo.updateExpense(id, updatedExpense)
    setExpense(updated)
  }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate(backTo)}
        >
          <ChevronLeftIcon />
          {backLabel}
        </Button>
        <PageTitle className="mb-6">Expense Detail</PageTitle>
        {isFinance ? (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <ExpenseDetailCard
              expense={expense}
              role={user.role}
              isEditable={isEditable}
              onResubmit={handleResubmit}
            />
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ExpenseReviewSection
                  expense={expense}
                  disabled={submitting}
                  onSubmit={handleDecision}
                />
                {decisionError && (
                  <Alert variant="destructive">
                    <AlertDescription>{decisionError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <ExpenseDetailCard
            expense={expense}
            role={user.role}
            isEditable={isEditable}
            onResubmit={handleResubmit}
          />
        )}
      </main>
    </div>
  )
}
