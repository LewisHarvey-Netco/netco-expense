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
const financeUser = {
  id: 'u2',
  name: 'Bob Madsen',
  email: 'bob@netcompany.com',
  role: 'finance',
}

let testLocation = ''

function LocationCapture() {
  const location = useLocation()
  testLocation = location.pathname
  return null
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

beforeEach(() => {
  sessionStorage.clear()
  testLocation = ''
})

describe('404 page (catch-all route)', () => {
  it('shows the 404 page for an unknown route', async () => {
    renderAppAt('/this-does-not-exist')

    expect(await screen.findByText('Page not found')).toBeInTheDocument()
    expect(
      screen.getByText("The page you're looking for doesn't exist or may have moved.")
    ).toBeInTheDocument()
  })

  it('navigates to the role home when "Go home" is clicked', async () => {
    const user = userEvent.setup()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(financeUser))
    renderAppAt('/this-does-not-exist')

    await user.click(await screen.findByRole('button', { name: /go home/i }))

    await waitFor(() => {
      expect(testLocation).toBe('/review')
    })
  })

  it('shows the 404 page even when logged out', async () => {
    renderAppAt('/unknown')

    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })
})
