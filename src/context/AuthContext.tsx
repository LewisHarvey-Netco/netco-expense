import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Role } from '@/types'
import rawUsersData from '@/mocks/users.json'

// MOCK DATA: hardcoded users for frontend-only demo. See TODO.md - replace with real backend auth.

const STORAGE_KEY = 'netco-expense-auth'

const usersData = rawUsersData as Array<{
  id: string
  name: string
  email: string
  password: string
  role: Role
}>

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => { success: boolean; error?: string; user?: User }
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) as User : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = (email: string, password: string) => {
    const found = usersData.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) {
      return { success: false, error: 'Invalid email or password' }
    }
    const { password: _pw, ...userWithoutPassword } = found
    setUser(userWithoutPassword)
    return { success: true, user: userWithoutPassword }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
