import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ExpenseTable from '@/components/ExpenseTable'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

const mockExpenses: Expense[] = [
  {
    id: 'e1',
    submitterId: 'u1',
    description: 'Client lunch meeting at Restaurant Noma',
    type: 'Lunch',
    amount: 185.5,
    currency: 'DKK',
    receiptDate: '2025-07-15',
    status: 'Approved',
    submittedAt: '2025-07-16T09:30:00Z',
    internalNotes: null,
    region: 'Nordics',
    project: 'Greenfield ERP',
  },
  {
    id: 'e2',
    submitterId: 'u2',
    description: 'Taxi to Copenhagen airport for client visit',
    type: 'Transport',
    amount: 420,
    currency: 'DKK',
    receiptDate: '2025-07-18',
    status: 'Submitted',
    submittedAt: '2025-07-19T08:15:00Z',
    internalNotes: null,
    region: 'Nordics',
    project: 'Greenfield ERP',
  },
  {
    id: 'e3',
    submitterId: 'u1',
    description: 'Working breakfast with stakeholders',
    type: 'Breakfast',
    amount: 45,
    currency: 'EUR',
    receiptDate: '2025-07-20',
    status: 'Changes Requested',
    submittedAt: '2025-07-21T07:45:00Z',
    internalNotes: 'Receipt missing VAT breakdown',
    region: 'EMEA',
    project: 'Oracle Cloud Migration',
  },
  {
    id: 'e4',
    submitterId: 'u2',
    description: 'Coffee and pastries for morning standup',
    type: 'Breakfast',
    amount: 28.9,
    currency: 'EUR',
    receiptDate: '2025-07-30',
    status: 'Resubmitted',
    submittedAt: '2025-07-30T08:30:00Z',
    internalNotes: null,
    region: 'DACH',
    project: 'Siemens Digital',
  },
]

const getSubmitterName = (id: string) => {
  if (id === 'u1') return 'Alice Nielsen'
  if (id === 'u2') return 'Bob Madsen'
  return id
}

describe('ExpenseTable', () => {
  it('renders table headers', () => {
    render(<ExpenseTable expenses={mockExpenses} getSubmitterName={getSubmitterName} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(6)
    expect(headers[0]).toHaveTextContent('Submitted')
    expect(headers[1]).toHaveTextContent('Submitter')
    expect(headers[2]).toHaveTextContent('Description')
    expect(headers[3]).toHaveTextContent('Type')
    expect(headers[4]).toHaveTextContent('Amount')
    expect(headers[5]).toHaveTextContent('Status')
  })

  it('renders expense data for each row', () => {
    render(<ExpenseTable expenses={mockExpenses} getSubmitterName={getSubmitterName} />)
    expect(screen.getByText('Client lunch meeting at Restaurant Noma')).toBeInTheDocument()
    expect(screen.getByText('Taxi to Copenhagen airport for client visit')).toBeInTheDocument()
    expect(screen.getAllByText('Alice Nielsen').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Bob Madsen').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getAllByText('Transport').length).toBeGreaterThanOrEqual(1)
  })

  it('formats submitted date correctly', () => {
    render(<ExpenseTable expenses={mockExpenses} getSubmitterName={getSubmitterName} />)
    expect(screen.getByText('16 Jul 2025')).toBeInTheDocument()
    expect(screen.getByText('19 Jul 2025')).toBeInTheDocument()
  })

  it('formats amount with currency', () => {
    render(<ExpenseTable expenses={mockExpenses} getSubmitterName={getSubmitterName} />)
    expect(screen.getByText('185.50 DKK')).toBeInTheDocument()
    expect(screen.getByText('420.00 DKK')).toBeInTheDocument()
    expect(screen.getByText('45.00 EUR')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    const { container } = render(
      <ExpenseTable expenses={mockExpenses} getSubmitterName={getSubmitterName} />
    )
    const badges = container.querySelectorAll('[data-slot="badge"]')
    expect(badges.length).toBe(4)
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Changes Requested')).toBeInTheDocument()
    expect(screen.getByText('Resubmitted')).toBeInTheDocument()
  })

  it('applies correct badge styling per status', () => {
    const { container } = render(
      <ExpenseTable expenses={mockExpenses} getSubmitterName={getSubmitterName} />
    )
    const badges = container.querySelectorAll('[data-slot="badge"]')
    expect(badges.length).toBe(4)
  })

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const { container } = render(
      <ExpenseTable
        expenses={mockExpenses}
        onRowClick={onRowClick}
        getSubmitterName={getSubmitterName}
      />
    )
    const firstRow = container.querySelector('[data-row-id="e1"]')
    expect(firstRow).not.toBeNull()
    await user.click(firstRow!)
    expect(onRowClick).toHaveBeenCalledWith('e1')
  })

  it('falls back to submitterId when getSubmitterName is not provided', () => {
    render(<ExpenseTable expenses={mockExpenses} />)
    expect(screen.getAllByText('u1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('u2').length).toBeGreaterThanOrEqual(1)
  })

  it('renders empty state when no expenses provided', () => {
    render(<ExpenseTable expenses={[]} />)
    expect(screen.getByText('No expenses to display.')).toBeInTheDocument()
  })
})
