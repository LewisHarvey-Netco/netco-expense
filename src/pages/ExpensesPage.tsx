import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import PageTitle from '@/components/PageTitle'
import ExpenseTable from '@/components/ExpenseTable'
import FilterPanel from '@/components/FilterPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/context/AuthContext'
import { useRepository } from '@/context/RepositoryContext'
import { filterExpenses, type FilterCriteria } from '@/lib/filterExpenses'
import users from '@/mocks/users.json'
import type { Expense } from '@/types'

function getSubmitterName(submitterId: string): string {
  return users.find((u) => u.id === submitterId)?.name ?? submitterId
}

export default function ExpensesPage() {
  const navigate = useNavigate()
  const repo = useRepository()
  const { user } = useAuth()
  const [allExpenses, setAllExpenses] = useState<Expense[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({})

  useEffect(() => {
    if (!user) return
    let cancelled = false
    repo
      .getExpensesBySubmitter(user.id)
      .then((expenses) => {
        if (cancelled) return
        setAllExpenses(expenses)
      })
      .catch(() => {
        if (cancelled) return
        setError('Failed to load expenses. Please try again.')
      })
    return () => {
      cancelled = true
    }
  }, [repo, user])

  // The page is served behind a ProtectedRoute (consultant only), so a user is
  // expected. Fail closed to nothing if, against expectation, there is none.
  if (!user) {
    return null
  }

  // Loading state
  if (allExpenses === null && !error) {
    return (
      <div className="min-h-svh bg-background">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
          <PageTitle className="mb-6">My Expenses</PageTitle>
          <p className="text-sm text-muted-foreground">Loading expenses…</p>
        </main>
      </div>
    )
  }

  // Error state
  if (error !== null) {
    return (
      <div className="min-h-svh bg-background">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
          <PageTitle className="mb-6">My Expenses</PageTitle>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // Success state (allExpenses is guaranteed to be non-null here due to earlier guards)
  const filteredExpenses = filterExpenses(allExpenses!, filterCriteria)

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <PageTitle className="mb-6">My Expenses</PageTitle>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <FilterPanel
            submitters={[]}
            showSubmitterFilter={false}
            onApply={setFilterCriteria}
            onClear={() => setFilterCriteria({})}
          />
          <Card className="p-0">
            <CardContent className="p-0">
              <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
                Showing {filteredExpenses.length} of {allExpenses!.length} expenses
              </p>
              <ExpenseTable
                expenses={filteredExpenses}
                onRowClick={(id) => navigate(`/expenses/${id}`)}
                getSubmitterName={getSubmitterName}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
