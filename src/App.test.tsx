import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RepositoryProvider } from '@/context/RepositoryContext'
import { MockExpenseRepository } from '@/lib/repositories/MockExpenseRepository'
import mockExpenses from '@/mocks/expenses'
import App from '@/App'
import '@testing-library/jest-dom'

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
      expect(screen.getByText('Expenses')).toBeInTheDocument()
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
