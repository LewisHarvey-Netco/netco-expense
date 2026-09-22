import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from 'lucide-react'
import Header from '@/components/Header'
import PageTitle from '@/components/PageTitle'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import NotFoundPage from '@/pages/NotFoundPage'
import type { Expense } from '@/types'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The "New Expense" page: a consultant creates a new expense from a blank
 * template. The template is initialized once on mount (UUID, current user,
 * today's date, USD, Submitted status) and rendered in the shared
 * `ExpenseDetailCard` with `isEditable` and a "Submit" button label. The
 * submission flow (loading/success/error feedback, navigation on success)
 * is implemented in a follow-up ticket.
 */
export default function ExpenseCreatePage() {
  const navigate = useNavigate()
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
        />
      </main>
    </div>
  )
}
