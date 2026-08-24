import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import ExpenseTable from '@/components/ExpenseTable'
import { Card, CardContent } from '@/components/ui/card'
import mockExpenses from '@/mocks/expenses'
import users from '@/mocks/users.json'
import type { Expense } from '@/types'

function getSubmitterName(submitterId: string): string {
  return users.find((u) => u.id === submitterId)?.name ?? submitterId
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const [allExpenses] = useState<Expense[]>(() => [...mockExpenses])

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-semibold">All Expenses</h2>
        <Card className="p-0">
          <CardContent className="p-0">
            <ExpenseTable
              expenses={allExpenses}
              onRowClick={(id) => navigate(`/review/${id}`)}
              getSubmitterName={getSubmitterName}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
