import type { Meta, StoryObj } from '@storybook/react'
import ExpenseTable from '@/components/ExpenseTable'
import type { Expense } from '@/types'

const meta: Meta<typeof ExpenseTable> = {
  title: 'Components/ExpenseTable',
  component: ExpenseTable,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

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
    description: 'Working breakfast with stakeholders at the conference hall',
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

export const Default: Story = {
  args: {
    expenses: mockExpenses,
    getSubmitterName,
    onRowClick: (id) => alert(`Clicked expense: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows all four expense statuses using the shared Badge variants: Approved (default), Submitted (secondary), Changes Requested (destructive), Resubmitted (outline). Click any row to test navigation.',
      },
    },
  },
}

export const Empty: Story = {
  args: {
    expenses: [],
  },
}
