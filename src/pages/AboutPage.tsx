import Header from '@/components/Header'
import PageTitle from '@/components/PageTitle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <PageTitle className="mb-6">About</PageTitle>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What is Netco Expense?</CardTitle>
              <CardDescription>
                A demo expense management app built to experiment with Feniks AI
                capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Consultants submit their business expenses, and finance staff
                review and approve them. The app demonstrates a simple
                two-role workflow with role-based access control.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                <span className="font-semibold">Consultants</span> can create
                expenses, track their status, and view the full history of
                their submissions.
              </p>
              <p className="text-sm">
                <span className="font-semibold">Finance</span> staff review
                pending expenses and approve or reject them with a decision
                note.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tech stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Built with Vite, React, and TypeScript. Styling uses Tailwind
                CSS with shadcn/ui components following the Netcompany design
                system.
              </p>
              <p className="text-sm">
                Testing is multi-layered: Vitest and React Testing Library for
                unit and component tests, Playwright for end-to-end browser
                tests, and Storybook for visual component development.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
