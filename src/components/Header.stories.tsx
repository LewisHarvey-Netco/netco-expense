import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/Header'
import type { User } from '@/types'

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

function withUser(user: User, path: string) {
  return (Story: () => ReactNode) => {
    sessionStorage.setItem('netco-expense-auth', JSON.stringify(user))
    return (
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </MemoryRouter>
    )
  }
}

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const FinanceOnReview: Story = {
  render: () => <Header />,
  decorators: [withUser(financeUser, '/review')],
  parameters: {
    docs: {
      description: {
        story:
          'Finance user on /review. The "Review Expenses" link is visible and marked active.',
      },
    },
  },
}

export const FinanceOnExpenseDetail: Story = {
  render: () => <Header />,
  decorators: [withUser(financeUser, '/review/1')],
  parameters: {
    docs: {
      description: {
        story:
          'Finance user on an expense detail page (/review/:id). The "Review Expenses" link stays active on subpages.',
      },
    },
  },
}

export const ConsultantOnExpenses: Story = {
  render: () => <Header />,
  decorators: [withUser(consultantUser, '/expenses')],
  parameters: {
    docs: {
      description: {
        story:
          'Consultant user on /expenses. The "My Expenses" link is visible and marked active. The "Review Expenses" link is not shown for non-finance roles.',
      },
    },
  },
}

export const ConsultantOnExpenseDetail: Story = {
  render: () => <Header />,
  decorators: [withUser(consultantUser, '/expenses/1')],
  parameters: {
    docs: {
      description: {
        story:
          'Consultant user on an expense detail page (/expenses/:id). The "My Expenses" link stays active on subpages.',
      },
    },
  },
}
