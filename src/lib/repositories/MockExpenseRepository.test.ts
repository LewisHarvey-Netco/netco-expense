import { MockExpenseRepository } from './MockExpenseRepository'
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

describe('MockExpenseRepository', () => {
  it('can be created with initial expenses', async () => {
    const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])

    const expense = await repo.getExpense('e1')

    expect(expense).not.toBeNull()
    expect(expense?.id).toBe('e1')
  })

  describe('getExpense', () => {
    it('returns the correct expense when found', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' }), makeExpense({ id: 'e2' })])

      const expense = await repo.getExpense('e2')

      expect(expense).toEqual(makeExpense({ id: 'e2' }))
    })

    it('returns null when the expense is not found', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])

      expect(await repo.getExpense('nonexistent')).toBeNull()
    })
  })

  describe('updateExpenseStatus', () => {
    it('updates the status when no comment is given', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])

      const updated = await repo.updateExpenseStatus('e1', 'Approved')

      expect(updated.status).toBe('Approved')
      expect(updated.internalNotes).toBeNull()
    })

    it('updates both status and internalNotes when a comment is given', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])

      const updated = await repo.updateExpenseStatus('e1', 'Changes Requested', 'Receipt missing')

      expect(updated.status).toBe('Changes Requested')
      expect(updated.internalNotes).toBe('Receipt missing')
    })

    it('keeps the existing internalNotes when no comment is given', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1', internalNotes: 'Old note' })])

      const updated = await repo.updateExpenseStatus('e1', 'Resubmitted')

      expect(updated.internalNotes).toBe('Old note')
    })

    it('persists the update so getExpense returns the new state', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])

      await repo.updateExpenseStatus('e1', 'Approved')

      const fetched = await repo.getExpense('e1')
      expect(fetched?.status).toBe('Approved')
    })

    it('returns a new object and does not mutate the original expense', async () => {
      const original = makeExpense({ id: 'e1' })
      const repo = new MockExpenseRepository([original])

      const updated = await repo.updateExpenseStatus('e1', 'Approved')

      expect(updated).not.toBe(original)
      expect(original.status).toBe('Submitted')
      expect(original.internalNotes).toBeNull()
    })

    it('throws when the expense is not found', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])

      await expect(repo.updateExpenseStatus('nonexistent', 'Approved')).rejects.toThrow('Expense not found')
    })
  })

  describe('getExpenses', () => {
    it('returns all seeded expenses in order', async () => {
      const e1 = makeExpense({ id: 'e1', description: 'First' })
      const e2 = makeExpense({ id: 'e2', description: 'Second' })
      const e3 = makeExpense({ id: 'e3', description: 'Third' })
      const repo = new MockExpenseRepository([e1, e2, e3])

      const expenses = await repo.getExpenses()

      expect(expenses).toHaveLength(3)
      expect(expenses[0]).toEqual(e1)
      expect(expenses[1]).toEqual(e2)
      expect(expenses[2]).toEqual(e3)
    })

    it('reflects prior mutations in the returned list', async () => {
      const e1 = makeExpense({ id: 'e1', status: 'Submitted' })
      const e2 = makeExpense({ id: 'e2', status: 'Submitted' })
      const repo = new MockExpenseRepository([e1, e2])

      await repo.updateExpenseStatus('e1', 'Approved')
      const expenses = await repo.getExpenses()

      expect(expenses).toHaveLength(2)
      expect(expenses[0].status).toBe('Approved')
      expect(expenses[1].status).toBe('Submitted')
    })

    it('returns a new array each time so external mutations do not affect internal state', async () => {
      const e1 = makeExpense({ id: 'e1' })
      const repo = new MockExpenseRepository([e1])

      const firstCall = await repo.getExpenses()
      firstCall[0] = makeExpense({ id: 'e1', description: 'Modified' })

      const secondCall = await repo.getExpenses()
      expect(secondCall[0].description).toBe(e1.description)
    })

    it('returns an empty array when no expenses are stored', async () => {
      const repo = new MockExpenseRepository([])

      const expenses = await repo.getExpenses()

      expect(expenses).toEqual([])
    })
  })

  describe('reset', () => {
    it('restores baseline data after mutations', async () => {
      const baseline = [makeExpense({ id: 'e1', status: 'Submitted' })]
      const repo = new MockExpenseRepository(baseline)

      await repo.updateExpenseStatus('e1', 'Approved', 'A note')
      repo.reset(baseline)

      const fetched = await repo.getExpense('e1')
      expect(fetched?.status).toBe('Submitted')
      expect(fetched?.internalNotes).toBeNull()
    })

    it('loads new data when reset with different expenses', async () => {
      const repo = new MockExpenseRepository([makeExpense({ id: 'e1' })])
      const other = makeExpense({ id: 'e2', description: 'Other expense' })

      repo.reset([other])

      expect(await repo.getExpense('e1')).toBeNull()
      expect(await repo.getExpense('e2')).toEqual(other)
    })
  })
})
