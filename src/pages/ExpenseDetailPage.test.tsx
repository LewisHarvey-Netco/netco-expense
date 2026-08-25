import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import App from '@/App'
import mockExpenses from '@/mocks/expenses'
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
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <LocationRecorder />
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function seedSession(user: object) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
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
