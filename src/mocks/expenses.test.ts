import { describe, it, expect } from 'vitest'
import expenses from '@/mocks/expenses'
import { validateAndParseExpense } from '@/lib/expense-validation'
import type { ExpenseType, ExpenseStatus } from '@/types'

describe('mock expenses', () => {
  it('has at least 10 expenses', () => {
    expect(expenses.length).toBeGreaterThanOrEqual(10)
  })

  it('each expense validates against the schema', () => {
    for (const e of expenses) {
      expect(() => validateAndParseExpense(e)).not.toThrow()
    }
  })

  it('covers all four statuses', () => {
    const statuses: ExpenseStatus[] = ['Submitted', 'Approved', 'Changes Requested', 'Resubmitted']
    const found = new Set(expenses.map((e) => e.status))
    for (const s of statuses) {
      expect(found).toContain(s)
    }
  })

  it('covers all five types', () => {
    const types: ExpenseType[] = ['Breakfast', 'Lunch', 'Dinner', 'Transport', 'Accommodation']
    const found = new Set(expenses.map((e) => e.type))
    for (const t of types) {
      expect(found).toContain(t)
    }
  })

  it('has multiple submitters', () => {
    const submitters = new Set(expenses.map((e) => e.submitterId))
    expect(submitters.size).toBeGreaterThanOrEqual(2)
  })

  it('has multiple regions', () => {
    const regions = new Set(expenses.map((e) => e.region))
    expect(regions.size).toBeGreaterThanOrEqual(2)
  })

  it('has multiple currencies', () => {
    const currencies = new Set(expenses.map((e) => e.currency))
    expect(currencies.size).toBeGreaterThanOrEqual(2)
  })

  it('has internalNotes on Changes Requested expenses', () => {
    const changesRequested = expenses.filter((e) => e.status === 'Changes Requested')
    for (const e of changesRequested) {
      expect(e.internalNotes).not.toBeNull()
      expect(e.internalNotes?.length).toBeGreaterThan(0)
    }
  })

  it('has varied amounts', () => {
    const amounts = new Set(expenses.map((e) => e.amount))
    expect(amounts.size).toBeGreaterThanOrEqual(5)
  })
})
