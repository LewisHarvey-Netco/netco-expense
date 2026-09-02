import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import type { Expense } from '@/types'

const meta: Meta<typeof ExpenseDetailCard> = {
  title: 'Components/ExpenseDetailCard',
  component: ExpenseDetailCard,
  // The card uses useNavigate for the "Back to Expenses" link, so every story
  // needs a Router in scope.
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const baseExpense: Expense = {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-d1e2f3a4b5c6',
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
          'Read-only expense detail card (isEditable defaults to false). Every editable field (amount, currency, type, receipt date, region, project, description) is a disabled form field. Status, submitter, submission date and the receipt placeholder are plain display elements.',
      },
    },
  },
}

export const Editable: Story = {
  args: {
    expense: { ...baseExpense, status: 'Submitted' },
    role: 'consultant',
    isEditable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consultant editing their own expense while it awaits review (isEditable=true). All form fields are enabled; validation errors appear inline when a field becomes invalid (e.g. clear the currency and type a non-ISO code, then blur).',
      },
    },
  },
}

export const EditableChangesRequested: Story = {
  args: {
    expense: {
      ...baseExpense,
      status: 'Changes Requested',
      internalNotes:
        'Amount per person exceeds the policy limit. Please provide a business justification.',
    },
    role: 'consultant',
    isEditable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consultant addressing finance feedback: the form is editable and the internal notes are shown in full.',
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

export const EditableWithResubmit: Story = {
  args: {
    expense: { ...baseExpense, status: 'Submitted' },
    role: 'consultant',
    isEditable: true,
    // Resolves after a short delay so the "Resubmitting…" loading state is
    // visible; on fulfilment the success message and "Back to Expenses" link
    // appear (the success message auto-dismisses after ~3 seconds).
    onResubmit: () => new Promise<void>((resolve) => setTimeout(resolve, 1500)),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consultant with a wired onResubmit callback. The "Resubmit" button is shown; clicking it validates the form, shows a loading state while the (simulated) update is in flight, then an inline success message and a "Back to Expenses" link.',
      },
    },
  },
}

export const ResubmitFails: Story = {
  args: {
    expense: { ...baseExpense, status: 'Submitted' },
    role: 'consultant',
    isEditable: true,
    // Rejects so the inline error is shown and the button stays enabled for retry.
    onResubmit: () => Promise.reject(new Error('Network error')),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consultant whose resubmit fails. Clicking "Resubmit" shows an inline error message and keeps the button enabled so the user can retry immediately.',
      },
    },
  },
}
