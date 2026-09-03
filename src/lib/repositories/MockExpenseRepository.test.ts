import { MockExpenseRepository } from './MockExpenseRepository'
import type { Expense } from '@/types'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
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
    const e1 = makeExpense()
    const repo = new MockExpenseRepository([e1])

    const expense = await repo.getExpense(e1.id)

    expect(expense).not.toBeNull()
    expect(expense?.id).toBe(e1.id)
  })

  describe('getExpense', () => {
    it('returns the correct expense when found', async () => {
      const e1 = makeExpense()
      const e2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002' })
      const repo = new MockExpenseRepository([e1, e2])

      const expense = await repo.getExpense(e2.id)

      expect(expense).toEqual(e2)
    })

    it('returns null when the expense is not found', async () => {
      const repo = new MockExpenseRepository([makeExpense()])

      expect(await repo.getExpense('nonexistent')).toBeNull()
    })
  })

  describe('updateExpenseStatus', () => {
    it('updates the status when no comment is given', async () => {
      const e1 = makeExpense()
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpenseStatus(e1.id, 'Approved')

      expect(updated.status).toBe('Approved')
      expect(updated.internalNotes).toBeNull()
    })

    it('updates both status and internalNotes when a comment is given', async () => {
      const e1 = makeExpense()
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpenseStatus(e1.id, 'Changes Requested', 'Receipt missing')

      expect(updated.status).toBe('Changes Requested')
      expect(updated.internalNotes).toBe('Receipt missing')
    })

    it('keeps the existing internalNotes when no comment is given', async () => {
      const e1 = makeExpense({ internalNotes: 'Old note' })
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpenseStatus(e1.id, 'Resubmitted')

      expect(updated.internalNotes).toBe('Old note')
    })

    it('persists the update so getExpense returns the new state', async () => {
      const e1 = makeExpense()
      const repo = new MockExpenseRepository([e1])

      await repo.updateExpenseStatus(e1.id, 'Approved')

      const fetched = await repo.getExpense(e1.id)
      expect(fetched?.status).toBe('Approved')
    })

    it('returns a new object and does not mutate the original expense', async () => {
      const original = makeExpense()
      const repo = new MockExpenseRepository([original])

      const updated = await repo.updateExpenseStatus(original.id, 'Approved')

      expect(updated).not.toBe(original)
      expect(original.status).toBe('Submitted')
      expect(original.internalNotes).toBeNull()
    })

    it('throws when the expense is not found', async () => {
      const repo = new MockExpenseRepository([makeExpense()])

      await expect(repo.updateExpenseStatus('nonexistent', 'Approved')).rejects.toThrow('Expense not found')
    })
  })

  describe('getExpenses', () => {
    it('returns all seeded expenses in order', async () => {
      const e1 = makeExpense({ description: 'First' })
      const e2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', description: 'Second' })
      const e3 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440003', description: 'Third' })
      const repo = new MockExpenseRepository([e1, e2, e3])

      const expenses = await repo.getExpenses()

      expect(expenses).toHaveLength(3)
      expect(expenses[0]).toEqual(e1)
      expect(expenses[1]).toEqual(e2)
      expect(expenses[2]).toEqual(e3)
    })

    it('reflects prior mutations in the returned list', async () => {
      const e1 = makeExpense({ status: 'Submitted' })
      const e2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', status: 'Submitted' })
      const repo = new MockExpenseRepository([e1, e2])

      await repo.updateExpenseStatus(e1.id, 'Approved')
      const expenses = await repo.getExpenses()

      expect(expenses).toHaveLength(2)
      expect(expenses[0].status).toBe('Approved')
      expect(expenses[1].status).toBe('Submitted')
    })

    it('returns a new array each time so external mutations do not affect internal state', async () => {
      const e1 = makeExpense()
      const repo = new MockExpenseRepository([e1])

      const firstCall = await repo.getExpenses()
      firstCall[0] = makeExpense({ description: 'Modified' })

      const secondCall = await repo.getExpenses()
      expect(secondCall[0].description).toBe(e1.description)
    })

    it('returns an empty array when no expenses are stored', async () => {
      const repo = new MockExpenseRepository([])

      const expenses = await repo.getExpenses()

      expect(expenses).toEqual([])
    })
  })

  describe('getExpensesBySubmitter', () => {
    it('returns an empty array when no expenses match the submitter ID', async () => {
      const repo = new MockExpenseRepository([makeExpense({ submitterId: 'u1' })])

      const expenses = await repo.getExpensesBySubmitter('u2')

      expect(expenses).toEqual([])
    })

    it('returns an empty array when no expenses are stored', async () => {
      const repo = new MockExpenseRepository([])

      const expenses = await repo.getExpensesBySubmitter('u1')

      expect(expenses).toEqual([])
    })

    it('returns all expenses when they all belong to the requested consultant', async () => {
      const e1 = makeExpense({ submitterId: 'u1' })
      const e2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', submitterId: 'u1' })
      const repo = new MockExpenseRepository([e1, e2])

      const expenses = await repo.getExpensesBySubmitter('u1')

      expect(expenses).toHaveLength(2)
      expect(expenses[0]).toEqual(e1)
      expect(expenses[1]).toEqual(e2)
    })

    it("returns only the requested consultant's expenses when multiple consultants are present", async () => {
      const alice1 = makeExpense({ submitterId: 'u1' })
      const bob1 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', submitterId: 'u2' })
      const alice2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440003', submitterId: 'u1' })
      const bob2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440004', submitterId: 'u2' })
      const repo = new MockExpenseRepository([alice1, bob1, alice2, bob2])

      const aliceExpenses = await repo.getExpensesBySubmitter('u1')
      const bobExpenses = await repo.getExpensesBySubmitter('u2')

      expect(aliceExpenses).toEqual([alice1, alice2])
      expect(bobExpenses).toEqual([bob1, bob2])
    })

    it('preserves insertion order of the filtered expenses', async () => {
      const e1 = makeExpense({ submitterId: 'u1', description: 'First' })
      const e2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', submitterId: 'u1', description: 'Second' })
      const other = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440003', submitterId: 'u2' })
      const e3 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440004', submitterId: 'u1', description: 'Third' })
      const repo = new MockExpenseRepository([e1, other, e2, e3])

      const expenses = await repo.getExpensesBySubmitter('u1')

      expect(expenses.map((e) => e.id)).toEqual([e1.id, e2.id, e3.id])
    })

    it('reflects prior mutations in the returned list', async () => {
      const e1 = makeExpense({ submitterId: 'u1', status: 'Submitted' })
      const e2 = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', submitterId: 'u2', status: 'Submitted' })
      const repo = new MockExpenseRepository([e1, e2])

      await repo.updateExpenseStatus(e1.id, 'Approved')
      const expenses = await repo.getExpensesBySubmitter('u1')

      expect(expenses).toHaveLength(1)
      expect(expenses[0].status).toBe('Approved')
    })

    it('returns a new array each time so external mutations do not affect internal state', async () => {
      const e1 = makeExpense({ submitterId: 'u1' })
      const repo = new MockExpenseRepository([e1])

      const firstCall = await repo.getExpensesBySubmitter('u1')
      firstCall[0] = makeExpense({ submitterId: 'u1', description: 'Modified' })

      const secondCall = await repo.getExpensesBySubmitter('u1')
      expect(secondCall[0].description).toBe(e1.description)
    })

    it('is async and returns a Promise (prepared for backend swap)', async () => {
      const repo = new MockExpenseRepository([makeExpense()])

      const pending = repo.getExpensesBySubmitter('u1')

      expect(pending).toBeInstanceOf(Promise)
      await expect(pending).resolves.toHaveLength(1)
    })
  })

  describe('reset', () => {
    it('restores baseline data after mutations', async () => {
      const e1 = makeExpense({ status: 'Submitted' })
      const baseline = [e1]
      const repo = new MockExpenseRepository(baseline)

      await repo.updateExpenseStatus(e1.id, 'Approved', 'A note')
      repo.reset(baseline)

      const fetched = await repo.getExpense(e1.id)
      expect(fetched?.status).toBe('Submitted')
      expect(fetched?.internalNotes).toBeNull()
    })

    it('loads new data when reset with different expenses', async () => {
      const e1 = makeExpense()
      const repo = new MockExpenseRepository([e1])
      const other = makeExpense({ id: '550e8400-e29b-41d4-a716-446655440002', description: 'Other expense' })

      repo.reset([other])

      expect(await repo.getExpense(e1.id)).toBeNull()
      expect(await repo.getExpense(other.id)).toEqual(other)
    })
  })

  describe('updateExpense', () => {
    it('merges partial updates with existing expense data', async () => {
      const e1 = makeExpense({ description: 'Old', amount: 100 })
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpense(e1.id, { description: 'New' })

      expect(updated.description).toBe('New')
      expect(updated.amount).toBe(100) // unchanged fields are preserved
    })

    it('automatically transitions status to Resubmitted on update', async () => {
      const e1 = makeExpense({ status: 'Submitted' })
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpense(e1.id, { description: 'Updated' })

      expect(updated.status).toBe('Resubmitted')
    })

    it('transitions status to Resubmitted even if currently Changes Requested', async () => {
      const e1 = makeExpense({ status: 'Changes Requested' })
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpense(e1.id, { description: 'Updated' })

      expect(updated.status).toBe('Resubmitted')
    })

    it('throws when attempting to update an Approved (terminal) expense', async () => {
      const e1 = makeExpense({ status: 'Approved' })
      const repo = new MockExpenseRepository([e1])

      await expect(repo.updateExpense(e1.id, { description: 'New' })).rejects.toThrow(
        'Cannot edit an approved expense'
      )
    })

    it('throws when attempting to update a non-existent expense', async () => {
      const repo = new MockExpenseRepository([makeExpense()])

      await expect(repo.updateExpense('nonexistent', { description: 'New' })).rejects.toThrow(
        'Expense not found'
      )
    })

    it('validates the merged object against the full schema and throws on invalid data', async () => {
      const e1 = makeExpense({ amount: 100 })
      const repo = new MockExpenseRepository([e1])

      // Negative amount violates schema
      await expect(repo.updateExpense(e1.id, { amount: -50 })).rejects.toThrow()
    })

    it('returns a new expense object and does not mutate the original', async () => {
      const original = makeExpense({ description: 'Original' })
      const repo = new MockExpenseRepository([original])

      const updated = await repo.updateExpense(original.id, { description: 'Updated' })

      expect(updated).not.toBe(original)
      expect(original.description).toBe('Original')
      expect(updated.description).toBe('Updated')
    })

    it('persists the update so subsequent getExpense calls reflect the new state', async () => {
      const e1 = makeExpense({ description: 'Old' })
      const repo = new MockExpenseRepository([e1])

      await repo.updateExpense(e1.id, { description: 'New' })

      const fetched = await repo.getExpense(e1.id)
      expect(fetched?.description).toBe('New')
      expect(fetched?.status).toBe('Resubmitted')
    })

    it('updates multiple fields in a single call', async () => {
      const e1 = makeExpense({ description: 'Old', amount: 100, region: 'EMEA' })
      const repo = new MockExpenseRepository([e1])

      const updated = await repo.updateExpense(e1.id, {
        description: 'New',
        amount: 150,
        region: 'APAC',
      })

      expect(updated.description).toBe('New')
      expect(updated.amount).toBe(150)
      expect(updated.region).toBe('APAC')
    })

    it('reflects the update in getExpenses', async () => {
      const e1 = makeExpense({ description: 'Old', status: 'Submitted' })
      const repo = new MockExpenseRepository([e1])

      await repo.updateExpense(e1.id, { description: 'New' })

      const expenses = await repo.getExpenses()
      expect(expenses[0].description).toBe('New')
      expect(expenses[0].status).toBe('Resubmitted')
    })

    it('reflects the update in getExpensesBySubmitter', async () => {
      const e1 = makeExpense({ submitterId: 'u1', description: 'Old', status: 'Submitted' })
      const repo = new MockExpenseRepository([e1])

      await repo.updateExpense(e1.id, { description: 'New' })

      const expenses = await repo.getExpensesBySubmitter('u1')
      expect(expenses[0].description).toBe('New')
      expect(expenses[0].status).toBe('Resubmitted')
    })

    it('throws validation error if invalid currency format', async () => {
      const e1 = makeExpense({ currency: 'EUR' })
      const repo = new MockExpenseRepository([e1])

      // Invalid currency format (not 3 letters)
      await expect(repo.updateExpense(e1.id, { currency: 'INVALID' })).rejects.toThrow()
    })

    it('throws validation error if receiptDate format is invalid', async () => {
      const e1 = makeExpense({ receiptDate: '2025-07-15' })
      const repo = new MockExpenseRepository([e1])

      // Invalid date format (not YYYY-MM-DD)
      await expect(repo.updateExpense(e1.id, { receiptDate: '15-07-2025' })).rejects.toThrow()
    })

    it('is async and returns a Promise', async () => {
      const e1 = makeExpense()
      const repo = new MockExpenseRepository([e1])

      const pending = repo.updateExpense(e1.id, { description: 'New' })

      expect(pending).toBeInstanceOf(Promise)
      await expect(pending).resolves.toBeDefined()
    })
  })
})
