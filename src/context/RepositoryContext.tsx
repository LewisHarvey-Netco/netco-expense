import { createContext, useContext, type ReactNode } from 'react'
import type { ExpenseRepository } from '@/lib/repositories/ExpenseRepository'
import { MockExpenseRepository } from '@/lib/repositories/MockExpenseRepository'
import mockExpenses from '@/mocks/expenses'

// Singleton mock repository, loaded with a fresh copy of the mock expenses on
// startup. The copy keeps in-memory mutations from touching the original
// mock data module (see ADR-0010).
export const mockRepository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))

const RepositoryContext = createContext<ExpenseRepository | undefined>(undefined)

interface RepositoryProviderProps {
  children: ReactNode
  /** Defaults to the app-wide `mockRepository`; inject a different implementation (e.g. in tests). */
  repository?: ExpenseRepository
}

export function RepositoryProvider({ children, repository = mockRepository }: RepositoryProviderProps) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}

export function useRepository(): ExpenseRepository {
  const ctx = useContext(RepositoryContext)
  if (!ctx) {
    throw new Error('useRepository must be used within a RepositoryProvider')
  }
  return ctx
}
