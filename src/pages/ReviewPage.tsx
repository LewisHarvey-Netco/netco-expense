import Header from '@/components/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ReviewPage() {
  return (
    <div>
      <Header />
      <main className="flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Expense review queue coming soon.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
