import { useNavigate } from 'react-router-dom'
import PageTitle from '@/components/PageTitle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">404</p>
          <PageTitle className="text-xl">Page not found</PageTitle>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <Button onClick={() => navigate('/')}>Go home</Button>
        </CardContent>
      </Card>
    </div>
  )
}
