import type { Meta, StoryObj } from '@storybook/react'
import ExpenseReviewSection from '@/components/expenses/ExpenseReviewSection'
import type { Expense } from '@/types'

const meta: Meta<typeof ExpenseReviewSection> = {
  title: 'Components/ExpenseReviewSection',
  component: ExpenseReviewSection,
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
  amount: 45,
  currency: 'EUR',
  receiptDate: '2025-07-10',
  status: 'Submitted',
  submittedAt: '2025-07-11T14:00:00Z',
  internalNotes: null,
  region: 'DACH',
  project: 'Siemens Digital',
}

function logDecision(decision: string, comment?: string) {
  alert(comment ? `Decision: ${decision}\nComment: ${comment}` : `Decision: ${decision}`)
}

export const Decidable: Story = {
  args: {
    expense: baseExpense,
    onSubmit: logDecision,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A submitted expense is decidable: no status message is shown and the decision form is enabled.',
      },
    },
  },
}

export const Resubmitted: Story = {
  args: {
    expense: {
      ...baseExpense,
      status: 'Resubmitted',
      internalNotes: 'Please add the VAT breakdown to the receipt.',
    },
    onSubmit: logDecision,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A resubmitted expense is decidable again: finance can re-review it with the form enabled.',
      },
    },
  },
}

export const Approved: Story = {
  args: {
    expense: { ...baseExpense, status: 'Approved' },
    onSubmit: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Approved is a terminal state: the status message is shown and the form is disabled.',
      },
    },
  },
}

export const ChangesRequested: Story = {
  args: {
    expense: {
      ...baseExpense,
      status: 'Changes Requested',
      internalNotes: 'Please add the VAT breakdown to the receipt.',
    },
    onSubmit: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Changes Requested waits on the consultant: the status message is shown and the form is disabled.',
      },
    },
  },
}

export const Submitting: Story = {
  args: {
    expense: baseExpense,
    onSubmit: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The disabled prop (e.g. while a decision is being submitted) disables the form even for a decidable expense.',
      },
    },
  },
}
