import { describe, it, expect } from 'vitest'
import { validateAndParseExpense, isValidExpense } from '@/lib/expense-validation'

const validExpense = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  submitterId: 'u1',
  description: 'Client dinner',
  type: 'Dinner',
  amount: 62,
  currency: 'GBP',
  receiptDate: '2025-08-15',
  status: 'Submitted',
  submittedAt: '2025-08-15T14:30:00Z',
  internalNotes: null,
  region: 'UK — London',
  project: 'Acme Corp',
}

describe('Expense Validation', () => {
  it('validates a correct expense object', () => {
    expect(() => validateAndParseExpense(validExpense)).not.toThrow()
    const expense = validateAndParseExpense(validExpense)
    expect(expense.id).toBe(validExpense.id)
  })

  it('isValidExpense type guard returns true for valid expense', () => {
    expect(isValidExpense(validExpense)).toBe(true)
  })

  it('throws on invalid UUID', () => {
    const badId = { ...validExpense, id: 'not-a-uuid' }
    expect(() => validateAndParseExpense(badId)).toThrow(/Invalid expense/)
  })

  it('throws on zero amount', () => {
    const badAmount = { ...validExpense, amount: 0 }
    expect(() => validateAndParseExpense(badAmount)).toThrow(/Invalid expense/)
  })

  it('throws on negative amount', () => {
    const badAmount = { ...validExpense, amount: -10 }
    expect(() => validateAndParseExpense(badAmount)).toThrow(/Invalid expense/)
  })

  it('throws on invalid currency', () => {
    const badCurrency = { ...validExpense, currency: 'Gbp' }
    expect(() => validateAndParseExpense(badCurrency)).toThrow(/Invalid expense/)
  })

  it('throws on invalid date format', () => {
    const badDate = { ...validExpense, receiptDate: '15-08-2025' }
    expect(() => validateAndParseExpense(badDate)).toThrow(/Invalid expense/)
  })

  it('throws on unknown expense type', () => {
    const badType = { ...validExpense, type: 'Snack' }
    expect(() => validateAndParseExpense(badType)).toThrow(/Invalid expense/)
  })

  it('throws on unknown status', () => {
    const badStatus = { ...validExpense, status: 'Rejected' }
    expect(() => validateAndParseExpense(badStatus)).toThrow(/Invalid expense/)
  })

  it('throws on missing required field', () => {
    const { amount, ...missing } = validExpense
    expect(() => validateAndParseExpense(missing)).toThrow(/Invalid expense/)
  })

  it('isValidExpense type guard returns false for invalid expense', () => {
    const badId = { ...validExpense, id: 'not-a-uuid' }
    expect(isValidExpense(badId)).toBe(false)
  })
})
