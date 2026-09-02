import type { Expense, ExpenseStatus } from '@/types'
import type { ExpenseFormValues } from '@/schemas/expense'

/**
 * Data-access boundary for expense reads and mutations (see ADR-0010, extended by ADR-0011).
 *
 * Components depend on this interface, never on a concrete implementation.
 * Today the implementation is `MockExpenseRepository` (in-memory); when a real
 * backend is introduced, an `ApiRepository` implementing this same interface
 * replaces it without any component changes.
 *
 * All methods are async so call sites are already shaped for real API calls.
 */
export interface ExpenseRepository {
  getExpense(id: string): Promise<Expense | null>
  getExpenses(): Promise<Expense[]>
  getExpensesBySubmitter(submitterId: string): Promise<Expense[]>
  updateExpenseStatus(id: string, status: ExpenseStatus, comment?: string): Promise<Expense>
  updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense>
}
