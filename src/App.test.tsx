import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RepositoryProvider } from '@/context/RepositoryContext'
import { MockExpenseRepository } from '@/lib/repositories/MockExpenseRepository'
import mockExpenses from '@/mocks/expenses'
import App from '@/App'
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

let testLocation: string = '/login'

function LocationCapture() {
  const location = useLocation()
  testLocation = location.pathname
  return null
}

function renderApp() {
  const repo = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <RepositoryProvider repository={repo}>
        <AuthProvider>
          <LocationCapture />
          <App />
        </AuthProvider>
      </RepositoryProvider>
    </MemoryRouter>
  )
}

function renderAppAt(path: string) {
  const repo = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RepositoryProvider repository={repo}>
        <AuthProvider>
          <LocationCapture />
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
})

describe('Login flow', () => {
  it('logs in as finance and lands on /review', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/email/i), 'bob@netcompany.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(testLocation).toBe('/review')
    })
  })

  it('logs in as consultant and lands on /expenses', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/email/i), 'alice@netcompany.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(testLocation).toBe('/expenses')
    })
  })

  it('redirects / to correct role page when logged in', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/email/i), 'alice@netcompany.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Expenses' })).toBeInTheDocument()
    })
  })

  it('shows validation error on failed login', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/email/i), 'alice@netcompany.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })
})

describe('Consultant expense detail route (/expenses/:id)', () => {
  const aliceExpense = mockExpenses.find((e) => e.submitterId === consultantUser.id)!

  it('allows a consultant to access /expenses/:id', async () => {
    seedSession(consultantUser)
    renderAppAt(`/expenses/${aliceExpense.id}`)

    expect(await screen.findByRole('heading', { name: 'Expense Detail' })).toBeInTheDocument()
    expect(screen.getByText('Back to My Expenses')).toBeInTheDocument()
  })

  it('redirects a finance user from /expenses/:id to their role home', async () => {
    seedSession(financeUser)
    renderAppAt(`/expenses/${aliceExpense.id}`)

    await waitFor(() => {
      expect(testLocation).toBe('/review')
    })
    expect(await screen.findByRole('heading', { name: 'All Expenses' })).toBeInTheDocument()
  })

  it('redirects an unauthenticated user from /expenses/:id to /login', async () => {
    renderAppAt(`/expenses/${aliceExpense.id}`)

    await waitFor(() => {
      expect(testLocation).toBe('/login')
    })
  })
})
