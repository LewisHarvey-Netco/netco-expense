import { useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `py-1 text-sm md:py-0 ${
    isActive
      ? 'font-semibold underline underline-offset-4'
      : 'text-primary-foreground/70 hover:text-primary-foreground'
  }`
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <header className="flex flex-wrap items-center bg-primary text-primary-foreground px-4 py-3 md:px-6">
      <span className="text-lg font-semibold">Netco Expense</span>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto md:hidden"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="header-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <XIcon /> : <MenuIcon />}
      </Button>
      <div
        id="header-menu"
        className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-4 pt-3 md:ml-6 md:flex md:w-auto md:flex-1 md:flex-row md:items-center md:justify-between md:pt-0`}
      >
        <nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          {user.role === 'finance' && (
            <NavLink to="/review" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Review Expenses
            </NavLink>
          )}
          {user.role === 'consultant' && (
            <NavLink to="/expenses" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              My Expenses
            </NavLink>
          )}
          <NavLink to="/about" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            About
          </NavLink>
        </nav>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-primary-foreground/20 pt-3 md:border-t-0 md:pt-0">
          <span className="text-sm">{user.name}</span>
          <Badge variant="secondary">{user.role}</Badge>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
