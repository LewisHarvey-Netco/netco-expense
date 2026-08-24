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

    expect(await screen.findByText('All Expenses')).toBeInTheDocument()
    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
  })

  it('redirects a non-finance user to their role home', async () => {
    seedSession(consultantUser)
    renderAppAt('/review')

    await waitFor(() => {
      expect(visitedPaths).toContain('/expenses')
    })
    expect(await screen.findByText('Expenses')).toBeInTheDocument()
  })

  it('displays all expenses in the table', async () => {
    seedSession(financeUser)
    renderAppAt('/review')

    await screen.findByText('All Expenses')
    for (const expense of mockExpenses) {
      expect(screen.getByText(expense.description)).toBeInTheDocument()
    }
  })

  it('loads the full dataset on mount', async () => {
    seedSession(financeUser)
    renderAppAt('/review')

    await screen.findByText('All Expenses')
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
