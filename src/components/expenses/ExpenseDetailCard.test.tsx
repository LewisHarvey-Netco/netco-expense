import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    submitterId: 'u1',
    description: 'Hotel stay during Berlin conference',
    type: 'Accommodation',
    amount: 320,
    currency: 'EUR',
    receiptDate: '2025-07-10',
    status: 'Approved',
    submittedAt: '2025-07-11T14:00:00Z',
    internalNotes: null,
    region: 'DACH',
    project: 'Siemens Digital',
    ...overrides,
  }
}

describe('ExpenseDetailCard', () => {
  describe('renders all expense fields with correct data', () => {
    it('renders the amount and currency', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Amount')).toHaveValue(320)
      expect(screen.getByLabelText('Currency')).toHaveValue('EUR')
    })

    it('renders the type', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Type')).toHaveTextContent('Accommodation')
    })

    it('renders the status', () => {
      render(<ExpenseDetailCard expense={makeExpense({ status: 'Changes Requested' })} />)
      expect(screen.getByText('Changes Requested')).toBeInTheDocument()
    })

    it('renders the receipt date', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Receipt date')).toHaveValue('2025-07-10')
    })

    it('renders the submission date', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByText('11 Jul 2025')).toBeInTheDocument()
    })

    it('renders the submitter name', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByText('Alice Nielsen')).toBeInTheDocument()
    })

    it('renders the region and project', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Region')).toHaveValue('DACH')
      expect(screen.getByLabelText('Project')).toHaveValue('Siemens Digital')
    })

    it('renders the description', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Hotel stay during Berlin conference',
      )
    })

    it('renders a receipt placeholder', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByText('Receipt not yet uploaded')).toBeInTheDocument()
    })
  })

  it('updates the form fields when the expense prop changes', () => {
    const { rerender } = render(<ExpenseDetailCard expense={makeExpense({ amount: 320 })} />)
    expect(screen.getByLabelText('Amount')).toHaveValue(320)

    rerender(<ExpenseDetailCard expense={makeExpense({ amount: 500, region: 'EMEA' })} />)
    expect(screen.getByLabelText('Amount')).toHaveValue(500)
    expect(screen.getByLabelText('Region')).toHaveValue('EMEA')
  })

  describe('internal notes', () => {
    it('renders the internal notes when present', () => {
      render(
        <ExpenseDetailCard
          expense={makeExpense({
            status: 'Changes Requested',
            internalNotes: 'Receipt missing VAT breakdown.',
          })}
        />,
      )
      expect(screen.getByText('Receipt missing VAT breakdown.')).toBeInTheDocument()
    })
  })

  describe('all form fields are disabled by default (read-only)', () => {
    it('disables the amount, currency, receipt date, region, project and description fields', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Amount')).toBeDisabled()
      expect(screen.getByLabelText('Currency')).toBeDisabled()
      expect(screen.getByLabelText('Receipt date')).toBeDisabled()
      expect(screen.getByLabelText('Region')).toBeDisabled()
      expect(screen.getByLabelText('Project')).toBeDisabled()
      expect(screen.getByLabelText('Description')).toBeDisabled()
    })

    it('disables the type field', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Type')).toBeDisabled()
    })
  })

  describe('isEditable prop', () => {
    it('enables all form fields when isEditable is true', () => {
      render(<ExpenseDetailCard expense={makeExpense()} isEditable />)
      expect(screen.getByLabelText('Amount')).toBeEnabled()
      expect(screen.getByLabelText('Currency')).toBeEnabled()
      expect(screen.getByLabelText('Type')).toBeEnabled()
      expect(screen.getByLabelText('Receipt date')).toBeEnabled()
      expect(screen.getByLabelText('Region')).toBeEnabled()
      expect(screen.getByLabelText('Project')).toBeEnabled()
      expect(screen.getByLabelText('Description')).toBeEnabled()
    })

    it('keeps all form fields disabled when isEditable is explicitly false', () => {
      render(<ExpenseDetailCard expense={makeExpense()} isEditable={false} />)
      expect(screen.getByLabelText('Amount')).toBeDisabled()
      expect(screen.getByLabelText('Currency')).toBeDisabled()
      expect(screen.getByLabelText('Type')).toBeDisabled()
      expect(screen.getByLabelText('Receipt date')).toBeDisabled()
      expect(screen.getByLabelText('Region')).toBeDisabled()
      expect(screen.getByLabelText('Project')).toBeDisabled()
      expect(screen.getByLabelText('Description')).toBeDisabled()
    })
  })

  describe('validation errors', () => {
    it('shows a validation error when an editable field becomes invalid', async () => {
      const user = userEvent.setup()
      render(<ExpenseDetailCard expense={makeExpense()} isEditable />)

      const currency = screen.getByLabelText('Currency')
      await user.clear(currency)
      await user.type(currency, 'xx')
      await user.tab()

      expect(screen.getByText('Currency must be a 3-letter ISO 4217 code')).toBeInTheDocument()
    })

    it('clears the validation error once the field is valid again', async () => {
      const user = userEvent.setup()
      render(<ExpenseDetailCard expense={makeExpense()} isEditable />)

      const currency = screen.getByLabelText('Currency')
      await user.clear(currency)
      await user.type(currency, 'xx')
      await user.tab()
      expect(screen.getByText('Currency must be a 3-letter ISO 4217 code')).toBeInTheDocument()

      await user.clear(currency)
      await user.type(currency, 'EUR')
      await user.tab()
      expect(
        screen.queryByText('Currency must be a 3-letter ISO 4217 code'),
      ).not.toBeInTheDocument()
    })

    it('shows no validation errors when the form is not editable', () => {
      render(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.queryByText(/must be/i)).not.toBeInTheDocument()
    })
  })

  describe('internal notes render identically for all roles', () => {
    it('shows the notes for a consultant when present', () => {
      render(
        <ExpenseDetailCard
          expense={makeExpense({ internalNotes: 'Please add the VAT breakdown.' })}
          role="consultant"
        />,
      )
      expect(screen.getByText('Please add the VAT breakdown.')).toBeInTheDocument()
    })

    it('shows the notes for finance when present', () => {
      render(
        <ExpenseDetailCard
          expense={makeExpense({ internalNotes: 'Please add the VAT breakdown.' })}
          role="finance"
        />,
      )
      expect(screen.getByText('Please add the VAT breakdown.')).toBeInTheDocument()
    })

    it('shows the notes when the role is undefined', () => {
      render(
        <ExpenseDetailCard expense={makeExpense({ internalNotes: 'Please add the VAT breakdown.' })} />,
      )
      expect(screen.getByText('Please add the VAT breakdown.')).toBeInTheDocument()
    })

    it('shows a placeholder for a consultant when there are no notes', () => {
      render(<ExpenseDetailCard expense={makeExpense({ internalNotes: null })} role="consultant" />)
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })

    it('shows a placeholder for finance when there are no notes', () => {
      render(<ExpenseDetailCard expense={makeExpense({ internalNotes: null })} role="finance" />)
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })

    it('shows a placeholder when the role is undefined and there are no notes', () => {
      render(<ExpenseDetailCard expense={makeExpense({ internalNotes: null })} />)
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })
  })
})
