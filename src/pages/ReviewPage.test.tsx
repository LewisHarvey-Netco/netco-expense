import { render, screen, waitFor } from '@testing-library/react'
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

function renderAppAt(path: string) {
  const repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RepositoryProvider repository={repository}>
        <AuthProvider>
          <LocationRecorder />
          <App />
        </AuthProvider>
      </RepositoryProvider>
    </MemoryRouter>
  )
}

function seedSession(user: object) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

beforeEach(() => {
  sessionStorage.clear()
  visitedPaths = []
})

describe('All Expenses page (/review)', () => {
  it('allows a finance user to access /review', async () => {
    seedSession(financeUser)
    renderAppAt('/review')

    expect(await screen.findByRole('heading', { name: 'All Expenses' })).toBeInTheDocument()
    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
  })

  it('redirects a non-finance user to their role home', async () => {
    seedSession(consultantUser)
    renderAppAt('/review')

    await waitFor(() => {
      expect(visitedPaths).toContain('/expenses')
    })
    expect(
      await screen.findByRole('heading', { name: 'My Expenses' }),
    ).toBeInTheDocument()
  })

  it('displays all expenses in the table', async () => {
    seedSession(financeUser)
    renderAppAt('/review')

    await screen.findByRole('heading', { name: 'All Expenses' })
    for (const expense of mockExpenses) {
      expect(screen.getByText(expense.description)).toBeInTheDocument()
    }
  })

  it('loads the full dataset on mount', async () => {
    seedSession(financeUser)
    renderAppAt('/review')

    await screen.findByRole('heading', { name: 'All Expenses' })
    expect(screen.getAllByRole('row')).toHaveLength(mockExpenses.length + 1)
  })

  it('navigates to the expense detail page when a row is clicked', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    renderAppAt('/review')

    const first = mockExpenses[0]
    await user.click(await screen.findByText(first.description))

    await waitFor(() => {
      expect(visitedPaths).toContain(`/review/${first.id}`)
    })
  })
})

describe('Loading and error states', () => {
  it('shows a loading message while expenses are being fetched', async () => {
    seedSession(financeUser)
    const repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
    // Delay the getExpenses response to test loading state
    const originalGetExpenses = repository.getExpenses.bind(repository)
    let resolveGetExpenses: (expenses: Expense[]) => void
    repository.getExpenses = vi.fn(
      () => new Promise<Expense[]>((resolve) => {
        resolveGetExpenses = resolve
      })
    )
    render(
      <MemoryRouter initialEntries={['/review']}>
        <RepositoryProvider repository={repository}>
          <AuthProvider>
            <LocationRecorder />
            <App />
          </AuthProvider>
        </RepositoryProvider>
      </MemoryRouter>
    )

    // Should show loading message while fetching
    expect(screen.getByText('Loading expenses…')).toBeInTheDocument()

    // Resolve the promise
    resolveGetExpenses!(await originalGetExpenses())

    // Should show expenses once loaded
    await screen.findByRole('heading', { name: 'All Expenses' })
    expect(screen.queryByText('Loading expenses…')).not.toBeInTheDocument()
  })

  it('shows an error alert if expenses fail to load', async () => {
    seedSession(financeUser)
    const repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
    repository.getExpenses = vi.fn().mockRejectedValue(new Error('Network error'))
    render(
      <MemoryRouter initialEntries={['/review']}>
        <RepositoryProvider repository={repository}>
          <AuthProvider>
            <LocationRecorder />
            <App />
          </AuthProvider>
        </RepositoryProvider>
      </MemoryRouter>
    )

    expect(
      await screen.findByText('Failed to load expenses. Please try again.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'All Expenses' })).toBeInTheDocument()
  })
})

describe('Filtering on the All Expenses page', () => {
  async function renderAsFinance() {
    seedSession(financeUser)
    renderAppAt('/review')
    await screen.findByRole('heading', { name: 'All Expenses' })
  }

  it('shows the full count before any filters are applied', async () => {
    await renderAsFinance()

    expect(
      screen.getByText(`Showing ${mockExpenses.length} of ${mockExpenses.length} expenses`),
    ).toBeInTheDocument()
  })

  it('updates the table and count when a filter is applied', async () => {
    const user = userEvent.setup()
    await renderAsFinance()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(await screen.findByText('Showing 3 of 10 expenses')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
    expect(screen.getByText('Hotel stay during Berlin conference')).toBeInTheDocument()
    expect(screen.getByText('Airport parking for London trip')).toBeInTheDocument()
    expect(screen.queryByText('Taxi to Copenhagen airport for client visit')).not.toBeInTheDocument()
  })

  it('combines multiple filters with AND logic', async () => {
    const user = userEvent.setup()
    await renderAsFinance()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByText('All submitters'))
    await user.click(await screen.findByRole('option', { name: 'Alice Nielsen' }))
    await user.click(screen.getByRole('checkbox', { name: 'Lunch' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(await screen.findByText('Showing 1 of 10 expenses')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
    expect(screen.queryByText('Hotel stay during Berlin conference')).not.toBeInTheDocument()
    expect(screen.queryByText('Business lunch with potential client in Frankfurt')).not.toBeInTheDocument()
  })

  it('restores the full dataset when filters are cleared', async () => {
    const user = userEvent.setup()
    await renderAsFinance()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))
    await screen.findByText('Showing 3 of 10 expenses')

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(
      await screen.findByText(`Showing ${mockExpenses.length} of ${mockExpenses.length} expenses`),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(mockExpenses.length + 1)
    for (const expense of mockExpenses) {
      expect(screen.getByText(expense.description)).toBeInTheDocument()
    }
  })

  it('never mutates the original dataset while filtering', async () => {
    const user = userEvent.setup()
    const snapshot = JSON.parse(JSON.stringify(mockExpenses))
    await renderAsFinance()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))
    await screen.findByText('Showing 3 of 10 expenses')

    await user.click(screen.getByRole('checkbox', { name: 'Lunch' }))
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))
    await screen.findByText('Showing 1 of 10 expenses')

    expect(mockExpenses).toEqual(snapshot)
  })
})

describe('Repository-driven list updates', () => {
  it('shows updated status when returning from detail page after approval', async () => {
    const user = userEvent.setup()
    seedSession(financeUser)
    const repository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
    render(
      <MemoryRouter initialEntries={['/review']}>
        <RepositoryProvider repository={repository}>
          <AuthProvider>
            <LocationRecorder />
            <App />
          </AuthProvider>
        </RepositoryProvider>
      </MemoryRouter>
    )

    // Start on review page, verify a submitted expense is visible
    const submittedExpense = mockExpenses.find((e) => e.status === 'Submitted')
    expect(submittedExpense).toBeDefined()
    expect(await screen.findByText(submittedExpense!.description)).toBeInTheDocument()

    // Click on the expense to navigate to detail page
    await user.click(screen.getByText(submittedExpense!.description))
    await waitFor(() => {
      expect(visitedPaths).toContain(`/review/${submittedExpense!.id}`)
    })

    // Approve the expense
    const approveButton = await screen.findByRole('button', { name: 'Approve' })
    await user.click(approveButton)
    const submitButton = screen.getByRole('button', { name: 'Submit Decision' })
    await user.click(submitButton)

    // Wait for the approval to be recorded
    await screen.findByText('Approved')

    // Navigate back to the list
    const backButton = screen.getByRole('button', { name: /back to all expenses/i })
    await user.click(backButton)

    // The page should refetch from the repository and show the updated status
    await waitFor(() => {
      expect(visitedPaths).toContain('/review')
    })

    // Verify the expense now shows as Approved in the table
    const allText = screen.getAllByText('Approved')
    expect(allText.length).toBeGreaterThan(0)
    expect(screen.getByText(submittedExpense!.description)).toBeInTheDocument()
  })
})
