import { useAuth } from '@/context/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm ${
    isActive
      ? 'font-semibold underline underline-offset-4'
      : 'text-primary-foreground/70 hover:text-primary-foreground'
  }`
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <header className="flex items-center justify-between bg-primary text-primary-foreground px-6 py-3">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold">Netco Expense</span>
        {user.role === 'finance' && (
          <NavLink to="/review" className={navLinkClass}>
            Review Expenses
          </NavLink>
        )}
        {user.role === 'consultant' && (
          <NavLink to="/expenses" className={navLinkClass}>
            My Expenses
          </NavLink>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">{user.name}</span>
        <Badge variant="secondary">{user.role}</Badge>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
