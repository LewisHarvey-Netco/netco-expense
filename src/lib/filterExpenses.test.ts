import { filterExpenses } from './filterExpenses'
import type { Expense } from '@/types'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    submitterId: 'u1',
    description: 'Test expense',
    type: 'Lunch',
    amount: 100,
    currency: 'EUR',
    receiptDate: '2025-07-15',
    status: 'Submitted',
    submittedAt: '2025-07-16T09:30:00Z',
    internalNotes: null,
    region: 'EMEA',
    project: 'Test Project',
    ...overrides,
  }
}

describe('filterExpenses', () => {
  it('returns all expenses when no filters are active', () => {
    const expenses = [makeExpense({ id: 'e1' }), makeExpense({ id: 'e2' })]

    const result = filterExpenses(expenses, {})

    expect(result.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('filters by exact status match', () => {
    const expenses = [
      makeExpense({ id: 'e1', status: 'Submitted' }),
      makeExpense({ id: 'e2', status: 'Approved' }),
      makeExpense({ id: 'e3', status: 'Submitted' }),
    ]

    const result = filterExpenses(expenses, { status: ['Submitted'] })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e3'])
  })

  it('matches any of the selected statuses', () => {
    const expenses = [
      makeExpense({ id: 'e1', status: 'Submitted' }),
      makeExpense({ id: 'e2', status: 'Approved' }),
      makeExpense({ id: 'e3', status: 'Resubmitted' }),
    ]

    const result = filterExpenses(expenses, { status: ['Submitted', 'Resubmitted'] })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e3'])
  })

  it('treats an empty status selection as no filter', () => {
    const expenses = [
      makeExpense({ id: 'e1', status: 'Submitted' }),
      makeExpense({ id: 'e2', status: 'Approved' }),
    ]

    const result = filterExpenses(expenses, { status: [] })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('filters by submitterId', () => {
    const expenses = [
      makeExpense({ id: 'e1', submitterId: 'u1' }),
      makeExpense({ id: 'e2', submitterId: 'u2' }),
      makeExpense({ id: 'e3', submitterId: 'u1' }),
    ]

    const result = filterExpenses(expenses, { submitterId: 'u2' })

    expect(result.map((e) => e.id)).toEqual(['e2'])
  })

  it('filters by exact type match', () => {
    const expenses = [
      makeExpense({ id: 'e1', type: 'Lunch' }),
      makeExpense({ id: 'e2', type: 'Transport' }),
      makeExpense({ id: 'e3', type: 'Lunch' }),
    ]

    const result = filterExpenses(expenses, { type: ['Lunch'] })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e3'])
  })

  it('matches any of the selected types', () => {
    const expenses = [
      makeExpense({ id: 'e1', type: 'Lunch' }),
      makeExpense({ id: 'e2', type: 'Dinner' }),
      makeExpense({ id: 'e3', type: 'Transport' }),
    ]

    const result = filterExpenses(expenses, { type: ['Lunch', 'Dinner'] })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('treats an empty type selection as no filter', () => {
    const expenses = [
      makeExpense({ id: 'e1', type: 'Lunch' }),
      makeExpense({ id: 'e2', type: 'Dinner' }),
    ]

    const result = filterExpenses(expenses, { type: [] })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('filters by receipt date range, inclusive of both bounds', () => {
    const expenses = [
      makeExpense({ id: 'e1', receiptDate: '2025-07-10' }),
      makeExpense({ id: 'e2', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e3', receiptDate: '2025-07-20' }),
      makeExpense({ id: 'e4', receiptDate: '2025-07-25' }),
    ]

    const result = filterExpenses(expenses, {
      dateRange: { from: new Date('2025-07-15'), to: new Date('2025-07-20') },
    })

    expect(result.map((e) => e.id)).toEqual(['e2', 'e3'])
  })

  it('matches a single-day range where from equals to', () => {
    const expenses = [
      makeExpense({ id: 'e1', receiptDate: '2025-07-14' }),
      makeExpense({ id: 'e2', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e3', receiptDate: '2025-07-16' }),
    ]

    const result = filterExpenses(expenses, {
      dateRange: { from: new Date('2025-07-15'), to: new Date('2025-07-15') },
    })

    expect(result.map((e) => e.id)).toEqual(['e2'])
  })

  it('normalizes range dates to UTC calendar days regardless of time component', () => {
    const expenses = [
      makeExpense({ id: 'e1', receiptDate: '2025-07-14' }),
      makeExpense({ id: 'e2', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e3', receiptDate: '2025-07-20' }),
      makeExpense({ id: 'e4', receiptDate: '2025-07-21' }),
    ]

    const result = filterExpenses(expenses, {
      dateRange: { from: new Date('2025-07-15T13:00:00Z'), to: new Date('2025-07-20T08:00:00Z') },
    })

    expect(result.map((e) => e.id)).toEqual(['e2', 'e3'])
  })

  it('combines multiple filters with AND logic', () => {
    const expenses = [
      makeExpense({ id: 'e1', status: 'Submitted', submitterId: 'u1', type: 'Lunch', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e2', status: 'Approved', submitterId: 'u1', type: 'Lunch', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e3', status: 'Submitted', submitterId: 'u2', type: 'Lunch', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e4', status: 'Submitted', submitterId: 'u1', type: 'Dinner', receiptDate: '2025-07-15' }),
      makeExpense({ id: 'e5', status: 'Submitted', submitterId: 'u1', type: 'Lunch', receiptDate: '2025-08-15' }),
      makeExpense({ id: 'e6', status: 'Submitted', submitterId: 'u1', type: 'Lunch', receiptDate: '2025-07-15' }),
    ]

    const result = filterExpenses(expenses, {
      status: ['Submitted'],
      submitterId: 'u1',
      type: ['Lunch'],
      dateRange: { from: new Date('2025-07-01'), to: new Date('2025-07-31') },
    })

    expect(result.map((e) => e.id)).toEqual(['e1', 'e6'])
  })

  it('returns an empty array when no expenses match', () => {
    const expenses = [makeExpense({ id: 'e1', status: 'Approved' })]

    const result = filterExpenses(expenses, { status: ['Submitted'] })

    expect(result).toEqual([])
  })

  it('returns a new array without mutating the input', () => {
    const expenses = [
      makeExpense({ id: 'e1', status: 'Submitted' }),
      makeExpense({ id: 'e2', status: 'Approved' }),
    ]
    const originalOrder = expenses.map((e) => e.id)

    const result = filterExpenses(expenses, { status: ['Submitted'] })

    expect(result).not.toBe(expenses)
    expect(expenses).toHaveLength(2)
    expect(expenses.map((e) => e.id)).toEqual(originalOrder)
    expect(result[0]).toBe(expenses[0])
  })
})
