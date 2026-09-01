import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/Header'
import type { User } from '@/types'
import '@testing-library/jest-dom'

const financeUser: User = {
  id: 'u2',
  name: 'Bob Madsen',
  email: 'bob@netcompany.com',
  role: 'finance',
}

const consultantUser: User = {
  id: 'u1',
  name: 'Alice Nielsen',
  email: 'alice@netcompany.com',
  role: 'consultant',
}

function renderHeader(user: User, initialPath: string) {
  sessionStorage.setItem('netco-expense-auth', JSON.stringify(user))

  let currentPath = initialPath
  function LocationCapture() {
    const location = useLocation()
    currentPath = location.pathname
    return null
  }

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <LocationCapture />
        <Header />
      </AuthProvider>
    </MemoryRouter>
  )

  return {
    getCurrentPath: () => currentPath,
  }
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('Header navigation', () => {
  it('shows the All Expenses link for finance users', () => {
    renderHeader(financeUser, '/review')

    expect(screen.getByRole('link', { name: 'All Expenses' })).toBeInTheDocument()
  })

  it('does not show the All Expenses link for consultant users', () => {
    renderHeader(consultantUser, '/expenses')

    expect(screen.queryByRole('link', { name: 'All Expenses' })).not.toBeInTheDocument()
  })

  it('links to /review', () => {
    renderHeader(financeUser, '/review')

    expect(screen.getByRole('link', { name: 'All Expenses' })).toHaveAttribute('href', '/review')
  })

  it('navigates to /review when clicked', async () => {
    const user = userEvent.setup()
    const { getCurrentPath } = renderHeader(financeUser, '/review/1')

    await user.click(screen.getByRole('link', { name: 'All Expenses' }))

    expect(getCurrentPath()).toBe('/review')
  })

  it('marks the link active on /review', () => {
    renderHeader(financeUser, '/review')

    expect(screen.getByRole('link', { name: 'All Expenses' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('marks the link active on /review/:id', () => {
    renderHeader(financeUser, '/review/1')

    expect(screen.getByRole('link', { name: 'All Expenses' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('does not mark the link active outside /review', () => {
    renderHeader(financeUser, '/expenses')

    expect(screen.getByRole('link', { name: 'All Expenses' })).not.toHaveAttribute(
      'aria-current'
    )
  })
})
