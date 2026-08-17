import Header from '@/components/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ExpensesPage() {
  return (
    <div>
      <Header />
      <main className="flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Expense submission form coming soon.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
