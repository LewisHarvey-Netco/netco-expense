import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import ExpenseTable from '@/components/ExpenseTable'
import FilterPanel from '@/components/FilterPanel'
import { Card, CardContent } from '@/components/ui/card'
import { filterExpenses, type FilterCriteria } from '@/lib/filterExpenses'
import mockExpenses from '@/mocks/expenses'
import users from '@/mocks/users.json'
import type { Expense } from '@/types'

function getSubmitterName(submitterId: string): string {
  return users.find((u) => u.id === submitterId)?.name ?? submitterId
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const [allExpenses] = useState<Expense[]>(() => [...mockExpenses])
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({})

  const filteredExpenses = filterExpenses(allExpenses, filterCriteria)
  const submitters = [...new Set(allExpenses.map((expense) => expense.submitterId))].map(
    (submitterId) => ({ id: submitterId, name: getSubmitterName(submitterId) }),
  )

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-semibold">All Expenses</h2>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <FilterPanel
            submitters={submitters}
            onApply={setFilterCriteria}
            onClear={() => setFilterCriteria({})}
          />
          <Card className="p-0">
            <CardContent className="p-0">
              <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
                Showing {filteredExpenses.length} of {allExpenses.length} expenses
              </p>
              <ExpenseTable
                expenses={filteredExpenses}
                onRowClick={(id) => navigate(`/review/${id}`)}
                getSubmitterName={getSubmitterName}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
