import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { RepositoryProvider } from '@/context/RepositoryContext'
import { MockExpenseRepository } from '@/lib/repositories/MockExpenseRepository'
import type { ExpenseRepository } from '@/lib/repositories/ExpenseRepository'
import App from '@/App'
import mockExpenses from '@/mocks/expenses'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

const STORAGE_KEY = 'netco-expense-auth'

const financeUser = {
  id: 'u2',
  name: 'Bob Madsen',
  email: 'bob@netcompany.com',
  role: 'finance',
}

const consultantUser = {
  id: 'u1',
  name: 'Alice Nielsen',
  email: 'alice@netcompany.com',
  role: 'consultant',
}

let visitedPaths: string[] = []

function LocationRecorder() {
  const location = useLocation()
  visitedPaths.push(location.pathname)
  return null
}

function renderAppAt(path: string, repository: ExpenseRepository = freshRepository()) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RepositoryProvider repository={repository}>
        <AuthProvider>
          <LocationRecorder />
          <App />
        </AuthProvider>
      </RepositoryProvider>
    </MemoryRouter>,
  )
}

function seedSession(user: object) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

/** A real in-memory repository seeded with a fresh copy of the mock expenses. */
function freshRepository(): ExpenseRepository {
  return new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
}

/** A mock repository whose methods are spies, for asserting on the calls the page makes. */
function createMockRepository(initialExpense: Expense) {
  return {
    getExpense: vi.fn().mockResolvedValue(initialExpense),
    getExpenses: vi.fn().mockResolvedValue([initialExpense]),
    updateExpenseStatus: vi.fn(),
  }
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'test-expense-id',
    submitterId: 'u1',
    description: 'Test expense description',
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

beforeEach(() => {
  sessionStorage.clear()
  visitedPaths = []
})

describe('Expense detail page (/review/:id)', () => {
  it('displays the full details of an expense', async () => {
    seedSession(financeUser)
    const expense = mockExpenses[0]
    renderAppAt(`/review/${expense.id}`)

    expect(await screen.findByText('Expense Detail')).toBeInTheDocument()
    expect(screen.getByText(expense.description)).toBeInTheDocument()
    expect(screen.getByText('185.50 DKK')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('15 Jul 2025')).toBeInTheDocument()
    expect(screen.getByText('Alice Nielsen')).toBeInTheDocument()
    expect(screen.getByText('Nordics')).toBeInTheDocument()
    expect(screen.getByText('Greenfield ERP')).toBeInTheDocument()
  })

  it('displays the status of the expense', async () => {
    seedSession(financeUser)
    renderAppAt(`/review/${mockExpenses[0].id}`)

    expect(await screen.findByText('Expense Detail')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('displays a receipt placeholder when no receipt is available', async () => {
    seedSession(financeUser)
    renderAppAt(`/review/${mockExpenses[0].id}`)

    expect(await screen.findByText('Receipt not yet uploaded')).toBeInTheDocument()
  })

  it('displays the internal notes when present', async () => {
    seedSession(financeUser)
    const initial = makeExpense({
      status: 'Changes Requested',
      internalNotes: 'Receipt missing VAT breakdown. Please resubmit.',
    })
    const repo = createMockRepository(initial)
    renderAppAt(`/review/${initial.id}`, repo)

    expect(await screen.findByText('Receipt missing VAT breakdown. Please resubmit.')).toBeInTheDocument()
  })

  it('does not show an internal notes field when there are no notes', async () => {
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Submitted', internalNotes: null })
    const repo = createMockRepository(initial)
    renderAppAt(`/review/${initial.id}`, repo)

    expect(await screen.findByText('Expense Detail')).toBeInTheDocument()
    expect(screen.queryByText('Internal notes')).not.toBeInTheDocument()
  })

  it('shows a 404 page for an unknown expense id', async () => {
    seedSession(financeUser)
    renderAppAt('/review/does-not-exist')

    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })

  it('redirects a non-finance user to their role home', async () => {
    seedSession(consultantUser)
    renderAppAt(`/review/${mockExpenses[0].id}`)

    await waitFor(() => {
      expect(visitedPaths).toContain('/expenses')
    })
    expect(await screen.findByText('Expenses')).toBeInTheDocument()
  })

  it('redirects an unauthenticated user to /login', async () => {
    renderAppAt(`/review/${mockExpenses[0].id}`)

    await waitFor(() => {
      expect(visitedPaths).toContain('/login')
    })
  })

  it('navigates back to the all expenses page', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    renderAppAt(`/review/${mockExpenses[0].id}`)

    await user.click(await screen.findByText('Back to All Expenses'))

    await waitFor(() => {
      expect(visitedPaths).toContain('/review')
    })
  })
})

describe('review decision form integration', () => {
  it('approving calls updateExpenseStatus with Approved and updates the displayed status', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Submitted' })
    const repo = createMockRepository(initial)
    repo.updateExpenseStatus.mockResolvedValue({ ...initial, status: 'Approved' })
    renderAppAt(`/review/${initial.id}`, repo)

    await user.click(await screen.findByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))

    expect(repo.updateExpenseStatus).toHaveBeenCalledWith(initial.id, 'Approved', undefined)
    expect(await screen.findByText('Approved')).toBeInTheDocument()
  })

  it('requesting changes calls updateExpenseStatus with the status and the comment', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Submitted' })
    const repo = createMockRepository(initial)
    repo.updateExpenseStatus.mockResolvedValue({
      ...initial,
      status: 'Changes Requested',
      internalNotes: 'Add the VAT breakdown',
    })
    renderAppAt(`/review/${initial.id}`, repo)

    await user.click(await screen.findByRole('button', { name: 'Request Changes' }))
    await user.type(screen.getByLabelText('Comment'), 'Add the VAT breakdown')
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))

    expect(repo.updateExpenseStatus).toHaveBeenCalledWith(
      initial.id,
      'Changes Requested',
      'Add the VAT breakdown',
    )
    expect(await screen.findByText('Changes Requested')).toBeInTheDocument()
  })

  it('disables the form after a successful submission', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Submitted' })
    const repo = createMockRepository(initial)
    repo.updateExpenseStatus.mockResolvedValue({ ...initial, status: 'Approved' })
    renderAppAt(`/review/${initial.id}`, repo)

    await user.click(await screen.findByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))

    await screen.findByText('Approved')
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeDisabled()
  })

  it('disables the form when the expense is already approved', async () => {
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Approved' })
    const repo = createMockRepository(initial)
    renderAppAt(`/review/${initial.id}`, repo)

    await screen.findByText('Approved')
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
    expect(repo.updateExpenseStatus).not.toHaveBeenCalled()
  })

  it('disables the form when changes have already been requested', async () => {
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Changes Requested' })
    const repo = createMockRepository(initial)
    renderAppAt(`/review/${initial.id}`, repo)

    await screen.findByText('Changes Requested')
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
  })

  it('keeps the form enabled while the expense is awaiting (re)review', async () => {
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Resubmitted' })
    const repo = createMockRepository(initial)
    renderAppAt(`/review/${initial.id}`, repo)

    await screen.findByText('Resubmitted')
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeEnabled()
  })

  it('shows an error and keeps the form enabled when the update fails', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    const initial = makeExpense({ status: 'Submitted' })
    const repo = createMockRepository(initial)
    repo.updateExpenseStatus.mockRejectedValue(new Error('Network error'))
    renderAppAt(`/review/${initial.id}`, repo)

    await user.click(await screen.findByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))

    expect(
      await screen.findByText('Failed to record the decision. Please try again.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeEnabled()
  })
})
