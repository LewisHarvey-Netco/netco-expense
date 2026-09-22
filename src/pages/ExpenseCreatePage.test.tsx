import { render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { RepositoryProvider } from '@/context/RepositoryContext'
import type { ExpenseRepository } from '@/lib/repositories/ExpenseRepository'
import App from '@/App'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

const STORAGE_KEY = 'netco-expense-auth'

const consultantUser = {
  id: 'u1',
  name: 'Alice Nielsen',
  email: 'alice@netcompany.com',
  role: 'consultant',
}

const financeUser = {
  id: 'u2',
  name: 'Bob Madsen',
  email: 'bob@netcompany.com',
  role: 'finance',
}

let visitedPaths: string[] = []

function LocationRecorder() {
  const location = useLocation()
  visitedPaths.push(location.pathname)
  return null
}

function renderAppAt(path: string, repository: ExpenseRepository = createMockRepository()) {
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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function createMockRepository() {
  return {
    getExpense: vi.fn().mockResolvedValue(null),
    getExpenses: vi.fn().mockResolvedValue([]),
    getExpensesBySubmitter: vi.fn().mockResolvedValue([]),
    createExpense: vi.fn(),
    updateExpenseStatus: vi.fn(),
    updateExpense: vi.fn(),
  }
}

beforeEach(() => {
  sessionStorage.clear()
  visitedPaths = []
})

describe('Expense create page (/expenses/new)', () => {
  it('renders the form with the default template', async () => {
    seedSession(consultantUser)
    renderAppAt('/expenses/new')

    const main = await screen.findByRole('main')
    expect(within(main).getByText('New Expense')).toBeInTheDocument()
    expect(within(main).getByLabelText('Amount')).toHaveValue(0)
    expect(within(main).getByLabelText('Currency')).toHaveValue('USD')
    expect(within(main).getByLabelText('Receipt date')).toHaveValue(todayISO())
    expect(within(main).getByLabelText('Region')).toHaveValue('')
    expect(within(main).getByLabelText('Project')).toHaveValue('')
    expect(within(main).getByLabelText('Description')).toHaveValue('')
    // Status badge shows Submitted (scoped to the badge element: the
    // "Submitted" field label would also match a plain text query).
    const badge = within(main)
      .getAllByText('Submitted')
      .find((el) => el.getAttribute('data-slot') === 'badge')
    expect(badge).toBeDefined()
    expect(within(main).getByText('Alice Nielsen')).toBeInTheDocument()
    // "Submitted" section displays today's date (en-GB format, e.g. "22 Sep 2026")
    const submittedLabel = within(main).getByText('Submitted', { selector: 'p' })
    expect(submittedLabel.parentElement).toHaveTextContent(
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    )
  })

  it('renders an editable form', async () => {
    seedSession(consultantUser)
    renderAppAt('/expenses/new')

    const main = await screen.findByRole('main')
    expect(within(main).getByLabelText('Amount')).toBeEnabled()
    expect(within(main).getByLabelText('Currency')).toBeEnabled()
    expect(within(main).getByLabelText('Type')).toBeEnabled()
    expect(within(main).getByLabelText('Receipt date')).toBeEnabled()
    expect(within(main).getByLabelText('Region')).toBeEnabled()
    expect(within(main).getByLabelText('Project')).toBeEnabled()
    expect(within(main).getByLabelText('Description')).toBeEnabled()
  })

  it('navigates back to the consultant expense list', async () => {
    const user = userEvent.setup()
    seedSession(consultantUser)
    renderAppAt('/expenses/new')

    await user.click(await screen.findByText('Back to My Expenses'))

    await waitFor(() => {
      expect(visitedPaths).toContain('/expenses')
    })
  })

  it('redirects a finance user to their role home', async () => {
    seedSession(financeUser)
    renderAppAt('/expenses/new')

    await waitFor(() => {
      expect(visitedPaths).toContain('/review')
    })
    expect(await screen.findByRole('heading', { name: 'All Expenses' })).toBeInTheDocument()
  })

  it('redirects an unauthenticated user to /login', async () => {
    renderAppAt('/expenses/new')

    await waitFor(() => {
      expect(visitedPaths).toContain('/login')
    })
  })

  it('does not shadow the /expenses/:id detail route', async () => {
    seedSession(consultantUser)
    const expense: Expense = {
      id: 'e1a2b3c4-d5e6-4f7a-8b9c-d1e2f3a4b5c6',
      submitterId: 'u1',
      description: 'Hotel stay during Berlin conference',
      type: 'Accommodation',
      amount: 320,
      currency: 'EUR',
      receiptDate: '2025-07-10',
      status: 'Submitted',
      submittedAt: '2025-07-11T14:00:00Z',
      internalNotes: null,
      region: 'DACH',
      project: 'Siemens Digital',
    }
    const repo = createMockRepository()
    repo.getExpense.mockResolvedValue(expense)
    renderAppAt('/expenses/e1a2b3c4-d5e6-4f7a-8b9c-d1e2f3a4b5c6', repo)

    expect(await screen.findByText('Expense Detail')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toHaveValue(320)
  })
})
