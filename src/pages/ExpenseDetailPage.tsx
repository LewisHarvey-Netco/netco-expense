import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ChevronLeftIcon, ReceiptIcon } from 'lucide-react'
import Header from '@/components/Header'
import PageTitle from '@/components/PageTitle'
import ReviewDecisionForm, { type ReviewDecision } from '@/components/ReviewDecisionForm'
import { Badge, STATUS_VARIANTS } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRepository } from '@/context/RepositoryContext'
import users from '@/mocks/users.json'
import NotFoundPage from '@/pages/NotFoundPage'
import type { Expense, ExpenseStatus } from '@/types'

function getSubmitterName(submitterId: string): string {
  return users.find((u) => u.id === submitterId)?.name ?? submitterId
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
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

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepository()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setExpense(null)
      setLoaded(true)
      return
    }
    let cancelled = false
    setLoaded(false)
    repo.getExpense(id).then((result) => {
      if (cancelled) return
      setExpense(result)
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

  if (!expense) {
    return <NotFoundPage />
  }

  const canDecide = isDecidable(expense.status)

  async function handleDecision(decision: ReviewDecision, comment?: string) {
    if (!id) return
    const status: ExpenseStatus = decision === 'approve' ? 'Approved' : 'Changes Requested'
    setSubmitting(true)
    setError(null)
    try {
      const updated = await repo.updateExpenseStatus(id, status, comment)
      setExpense(updated)
    } catch {
      setError('Failed to record the decision. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate('/review')}
        >
          <ChevronLeftIcon />
          Back to All Expenses
        </Button>
        <PageTitle className="mb-6">Expense Detail</PageTitle>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {formatAmount(expense.amount, expense.currency)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Type">
                  <Badge variant="secondary">{expense.type}</Badge>
                </DetailField>
                <DetailField label="Status">
                  <Badge variant={STATUS_VARIANTS[expense.status]}>{expense.status}</Badge>
                </DetailField>
                <DetailField label="Receipt date">{formatDate(expense.receiptDate)}</DetailField>
                <DetailField label="Submitted by">
                  {getSubmitterName(expense.submitterId)}
                </DetailField>
                <DetailField label="Region">{expense.region}</DetailField>
                <DetailField label="Project">{expense.project}</DetailField>
                <DetailField label="Description" className="sm:col-span-2">
                  {expense.description}
                </DetailField>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receipt</p>
                <div className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-muted-foreground">
                  <ReceiptIcon />
                  <p className="text-sm">Receipt not yet uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review Decision</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!canDecide && (
                <Alert>
                  <AlertDescription>{decisionMessage(expense.status)}</AlertDescription>
                </Alert>
              )}
              <ReviewDecisionForm
                disabled={!canDecide || submitting}
                onSubmit={handleDecision}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
