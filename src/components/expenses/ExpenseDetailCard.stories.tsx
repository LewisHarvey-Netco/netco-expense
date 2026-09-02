import type { Meta, StoryObj } from '@storybook/react'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import type { Expense } from '@/types'

const meta: Meta<typeof ExpenseDetailCard> = {
  title: 'Components/ExpenseDetailCard',
  component: ExpenseDetailCard,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const baseExpense: Expense = {
  id: 'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
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
}

export const Default: Story = {
  args: {
    expense: baseExpense,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Read-only expense detail card. Every editable field (amount, currency, type, receipt date, region, project, description) is a disabled form field, ready to be enabled for inline editing in a later phase. Status, submitter, submission date and the receipt placeholder are plain display elements.',
      },
    },
  },
}

export const ConsultantNoNotes: Story = {
  args: {
    expense: baseExpense,
    role: 'consultant',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consultant viewing their own expense with no finance feedback yet. The internal notes field is shown with a "No notes yet" placeholder when empty — the same behaviour for every role.',
      },
    },
  },
}

export const ConsultantWithNotes: Story = {
  args: {
    expense: {
      ...baseExpense,
      status: 'Changes Requested',
      internalNotes:
        'Amount per person exceeds the policy limit. Please provide a business justification.',
    },
    role: 'consultant',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consultant viewing their own expense with finance feedback. The internal notes are shown in full.',
      },
    },
  },
}

export const Finance: Story = {
  args: {
    expense: baseExpense,
    role: 'finance',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Viewed by finance. Identical to the default card; the internal notes field is shown with a "No notes yet" placeholder when empty — the same behaviour for every role.',
      },
    },
  },
}
