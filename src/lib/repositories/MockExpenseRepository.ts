import type { Expense, ExpenseStatus } from '@/types'
import type { ExpenseRepository } from './ExpenseRepository'

/**
 * In-memory implementation of `ExpenseRepository` (see ADR-0010).
 *
 * Loads a copy of the mock expenses on construction and mutates only that
 * in-memory state, so the original mock data module stays pristine.
 * Mutations always store and return new `Expense` objects; the originals
 * are never mutated in place.
 */
export class MockExpenseRepository implements ExpenseRepository {
  private expenses = new Map<string, Expense>()

  constructor(initialExpenses: Expense[]) {
    this.reset(initialExpenses)
  }

  async getExpense(id: string): Promise<Expense | null> {
    return this.expenses.get(id) ?? null
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values())
  }

  async getExpensesBySubmitter(submitterId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter((expense) => expense.submitterId === submitterId)
  }

  async updateExpenseStatus(id: string, status: ExpenseStatus, comment?: string): Promise<Expense> {
    const expense = this.expenses.get(id)
    if (!expense) {
      throw new Error('Expense not found')
    }
    const updated: Expense = { ...expense, status, internalNotes: comment ?? expense.internalNotes }
    this.expenses.set(id, updated)
    return updated
  }

  /** Clears the in-memory state and repopulates it; used by tests for clean state between runs. */
  reset(initialExpenses: Expense[]): void {
    this.expenses.clear()
    for (const expense of initialExpenses) {
      this.expenses.set(expense.id, expense)
    }
  }
}
