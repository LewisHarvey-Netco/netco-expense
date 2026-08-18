import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import App from '@/App'
import '@testing-library/jest-dom'

let testLocation: string = '/login'

function LocationCapture() {
  const location = useLocation()
  testLocation = location.pathname
  return null
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LocationCapture />
        <App />
      </AuthProvider>
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
