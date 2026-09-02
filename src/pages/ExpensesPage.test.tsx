import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { RepositoryProvider } from '@/context/RepositoryContext'
import { MockExpenseRepository } from '@/lib/repositories/MockExpenseRepository'
import App from '@/App'
import mockExpenses from '@/mocks/expenses'
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

const aliceExpenses = mockExpenses.filter((expense) => expense.submitterId === 'u1')
const bobExpenses = mockExpenses.filter((expense) => expense.submitterId === 'u2')

let visitedPaths: string[] = []

function LocationRecorder() {
  const location = useLocation()
  visitedPaths.push(location.pathname)
  return null
}

function renderAppAt(
  path: string,
  repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e }))),
) {
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

async function renderAsConsultant() {
  seedSession(consultantUser)
  renderAppAt('/expenses')
  await screen.findByRole('heading', { name: 'My Expenses' })
}

beforeEach(() => {
  sessionStorage.clear()
  visitedPaths = []
})

describe('My Expenses page (/expenses)', () => {
  it('allows a consultant to access /expenses', async () => {
    await renderAsConsultant()

    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
  })

  it('redirects a non-consultant user to their role home', async () => {
    seedSession(financeUser)
    renderAppAt('/expenses')

    await waitFor(() => {
      expect(visitedPaths).toContain('/review')
    })
  })

  it("displays only the consultant's own expenses", async () => {
    await renderAsConsultant()

    for (const expense of aliceExpenses) {
      expect(screen.getByText(expense.description)).toBeInTheDocument()
    }
    for (const expense of bobExpenses) {
      expect(screen.queryByText(expense.description)).not.toBeInTheDocument()
    }
  })

  it("shows the count of the consultant's expenses", async () => {
    await renderAsConsultant()

    expect(
      screen.getByText(`Showing ${aliceExpenses.length} of ${aliceExpenses.length} expenses`),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(aliceExpenses.length + 1)
  })

  it('navigates to the expense detail page when a row is clicked', async () => {
    const user = userEvent.setup()
    await renderAsConsultant()

    const first = aliceExpenses[0]
    await user.click(screen.getByText(first.description))

    await waitFor(() => {
      expect(visitedPaths).toContain(`/expenses/${first.id}`)
    })
  })
})

describe('Loading and error states', () => {
  it('shows a loading message while expenses are being fetched', async () => {
    seedSession(consultantUser)
    const repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
    // Delay the getExpensesBySubmitter response to test loading state
    const originalGetExpensesBySubmitter = repository.getExpensesBySubmitter.bind(repository)
    let resolveExpenses: (expenses: Expense[]) => void
    repository.getExpensesBySubmitter = vi.fn(
      () =>
        new Promise<Expense[]>((resolve) => {
          resolveExpenses = resolve
        }),
    )
    renderAppAt('/expenses', repository)

    // Should show loading message while fetching
    expect(screen.getByText('Loading expenses…')).toBeInTheDocument()

    // Resolve the promise
    resolveExpenses!(await originalGetExpensesBySubmitter('u1'))

    // Should show expenses once loaded
    await screen.findByText('Client lunch meeting at Restaurant Noma')
    expect(screen.queryByText('Loading expenses…')).not.toBeInTheDocument()
  })

  it('shows an error alert if expenses fail to load', async () => {
    seedSession(consultantUser)
    const repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
    repository.getExpensesBySubmitter = vi.fn().mockRejectedValue(new Error('Network error'))
    renderAppAt('/expenses', repository)

    expect(
      await screen.findByText('Failed to load expenses. Please try again.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'My Expenses' })).toBeInTheDocument()
  })
})

describe('Empty state', () => {
  it('shows an empty state when the consultant has no expenses', async () => {
    seedSession(consultantUser)
    renderAppAt('/expenses', new MockExpenseRepository([]))

    await screen.findByRole('heading', { name: 'My Expenses' })
    expect(screen.getByText('Showing 0 of 0 expenses')).toBeInTheDocument()
    expect(screen.getByText('No expenses to display.')).toBeInTheDocument()
  })
})

describe('Filtering on the My Expenses page', () => {
  it('hides the submitter filter', async () => {
    await renderAsConsultant()

    expect(screen.queryByText('All submitters')).not.toBeInTheDocument()
  })

  it('shows the full count before any filters are applied', async () => {
    await renderAsConsultant()

    expect(
      screen.getByText(`Showing ${aliceExpenses.length} of ${aliceExpenses.length} expenses`),
    ).toBeInTheDocument()
  })

  it('updates the table and count when a status filter is applied', async () => {
    const user = userEvent.setup()
    await renderAsConsultant()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(await screen.findByText('Showing 1 of 6 expenses')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
    expect(screen.queryByText('Taxi to Copenhagen airport for client visit')).not.toBeInTheDocument()
  })

  it('updates the table and count when a type filter is applied', async () => {
    const user = userEvent.setup()
    await renderAsConsultant()

    await user.click(screen.getByRole('checkbox', { name: 'Transport' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(await screen.findByText('Showing 3 of 6 expenses')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.getByText('Taxi to Copenhagen airport for client visit')).toBeInTheDocument()
    expect(screen.getByText('Train ticket Copenhagen to Malmö')).toBeInTheDocument()
    expect(screen.getByText('Uber from office to client site in Amsterdam')).toBeInTheDocument()
    expect(screen.queryByText('Client lunch meeting at Restaurant Noma')).not.toBeInTheDocument()
  })

  it('updates the table and count when a date range filter is applied', async () => {
    const user = userEvent.setup()
    await renderAsConsultant()

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-20' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-07-31' } })
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(await screen.findByText('Showing 4 of 6 expenses')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(5)
    expect(screen.getByText('Working breakfast with stakeholders')).toBeInTheDocument()
    expect(screen.queryByText('Client lunch meeting at Restaurant Noma')).not.toBeInTheDocument()
  })

  it('restores the full dataset when filters are cleared', async () => {
    const user = userEvent.setup()
    await renderAsConsultant()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))
    await screen.findByText('Showing 1 of 6 expenses')

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(
      await screen.findByText(`Showing ${aliceExpenses.length} of ${aliceExpenses.length} expenses`),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(aliceExpenses.length + 1)
    for (const expense of aliceExpenses) {
      expect(screen.getByText(expense.description)).toBeInTheDocument()
    }
  })
})
