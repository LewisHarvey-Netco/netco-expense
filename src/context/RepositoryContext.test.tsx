import { useEffect, useState } from 'react'
import { render, screen } from '@testing-library/react'
import { RepositoryProvider, useRepository, mockRepository } from './RepositoryContext'
import { MockExpenseRepository } from '@/lib/repositories/MockExpenseRepository'
import mockExpenses from '@/mocks/expenses'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    submitterId: 'u1',
    description: 'Test expense',
    type: 'Lunch',
    amount: 100,
    currency: 'EUR',
    receiptDate: '2025-07-15',
    status: 'Submitted',
    submittedAt: '2025-07-16T09:30:00Z',
    internalNotes: null,
    region: 'EMEA',
    project: 'Test Project',
    ...overrides,
  }
}

function RepositoryProbe() {
  const repo = useRepository()
  return <div data-testid="probe">{repo === mockRepository ? 'singleton' : 'custom'}</div>
}

function SeededProbe({ id }: { id: string }) {
  const repo = useRepository()
  const [found, setFound] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    repo.getExpense(id).then((e) => {
      if (!cancelled) setFound(e !== null ? 'found' : 'missing')
    })
    return () => {
      cancelled = true
    }
  }, [repo, id])
  return <div data-testid="probe">{found}</div>
}

describe('RepositoryContext', () => {
  it('returns the repository instance inside the provider', () => {
    render(
      <RepositoryProvider>
        <RepositoryProbe />
      </RepositoryProvider>,
    )

    expect(screen.getByTestId('probe')).toHaveTextContent('singleton')
  })

  it('returns the default mock repository, seeded with the mock expenses', async () => {
    render(
      <RepositoryProvider>
        <SeededProbe id={mockExpenses[0].id} />
      </RepositoryProvider>,
    )

    expect(await screen.findByText('found')).toBeInTheDocument()
  })

  it('allows injecting a custom repository implementation', async () => {
    const custom = new MockExpenseRepository([makeExpense({ id: 'custom-1' })])

    render(
      <RepositoryProvider repository={custom}>
        <SeededProbe id="custom-1" />
      </RepositoryProvider>,
    )

    expect(await screen.findByText('found')).toBeInTheDocument()
  })

  it('throws a descriptive error when useRepository is called outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<RepositoryProbe />)).toThrow(/useRepository must be used within a RepositoryProvider/)

    spy.mockRestore()
  })

  it('renders children inside the provider', () => {
    render(
      <RepositoryProvider>
        <div>child content</div>
      </RepositoryProvider>,
    )

    expect(screen.getByText('child content')).toBeInTheDocument()
  })
})
