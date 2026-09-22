import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from 'lucide-react'
import Header from '@/components/Header'
import PageTitle from '@/components/PageTitle'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useRepository } from '@/context/RepositoryContext'
import NotFoundPage from '@/pages/NotFoundPage'
import type { Expense } from '@/types'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The "New Expense" page: a consultant creates a new expense from a blank
 * template. The template is initialized once on mount (UUID, current user,
 * today's date, USD, Submitted status) and rendered in the shared
 * `ExpenseDetailCard` with `isEditable` and a "Submit" button label.
 * Submission calls `repo.createExpense()`; the card owns the loading/
 * success/error feedback, and the page navigates to the new expense's
 * detail page after a short delay. On failure the form data is retained
 * for retry.
 */
export default function ExpenseCreatePage() {
  const navigate = useNavigate()
  const repo = useRepository()
  const { user } = useAuth()

  // The page is served behind a ProtectedRoute, so a user is expected. The
  // template is memoized so the UUID and dates are stable across re-renders.
  const template = useMemo<Expense | null>(() => {
    if (!user) return null
    return {
      id: crypto.randomUUID(),
      submitterId: user.id,
      description: '',
      type: 'Breakfast',
      amount: 0,
      currency: 'USD',
      receiptDate: todayISO(),
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      internalNotes: null,
      region: '',
      project: '',
    }
  }, [user])

  if (!user || !template) {
    return <NotFoundPage />
  }

  // Creates the expense via the repository and navigates to the detail page
  // after a short delay so the success message is visible. Rejections
  // propagate to the card, which surfaces the inline error and keeps the
  // form data intact for retry.
  async function handleCreate(expense: Expense) {
    const created = await repo.createExpense(expense)
    setTimeout(() => navigate(`/expenses/${created.id}`), 1500)
  }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => navigate('/expenses')}
        >
          <ChevronLeftIcon />
          Back to My Expenses
        </Button>
        <PageTitle className="mb-6">New Expense</PageTitle>
        <ExpenseDetailCard
          expense={template}
          role={user.role}
          isEditable
          buttonLabel="Submit"
          onResubmit={handleCreate}
        />
      </main>
    </div>
  )
}
