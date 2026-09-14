import type { Expense, ExpenseStatus } from '@/types'
import type { ExpenseFormValues } from '@/schemas/expense'
import type { ExpenseRepository } from './ExpenseRepository'
import { validateAndParseExpense } from '@/lib/expense-validation'

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

  constructor(initialExpenses: unknown[]) {
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
    // Validate before persisting (write boundary)
    const validated = validateAndParseExpense(updated)
    this.expenses.set(id, validated)
    return validated
  }

  async updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense> {
    const expense = this.expenses.get(id)
    if (!expense) {
      throw new Error('Expense not found')
    }

    // Check if attempting to edit an approved (terminal) expense
    if (expense.status === 'Approved') {
      throw new Error('Cannot edit an approved expense')
    }

    // Merge partial updates with existing expense data
    const merged: Expense = { ...expense, ...updates }

    // Automatically transition status to 'Resubmitted'
    const updated: Expense = { ...merged, status: 'Resubmitted' }

    // Validate the merged object against the full schema
    const validated = validateAndParseExpense(updated)

    // Persist the validated update
    this.expenses.set(id, validated)

    return validated
  }

  /** Clears the in-memory state and repopulates it; used by tests for clean state between runs. */
  reset(initialExpenses: unknown[]): void {
    this.expenses.clear()
    for (const expense of initialExpenses) {
      // Store raw data as-is. Validation happens on write operations (mutations).
      // This allows the app to load and operate even with invalid data from the backend,
      // matching real-world scenarios where data corruption or incomplete migrations might occur.
      if (expense && typeof expense === 'object' && 'id' in expense) {
        this.expenses.set((expense as Record<string, unknown>).id as string, expense as Expense)
      }
    }
  }
}
