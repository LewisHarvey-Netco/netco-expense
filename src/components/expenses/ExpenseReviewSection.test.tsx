import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ExpenseReviewSection from '@/components/expenses/ExpenseReviewSection'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-d1e2f3a4b5c6',
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
    ...overrides,
  }
}

describe('ExpenseReviewSection', () => {
  describe('review form', () => {
    it('renders the decision form for a submitted expense', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Submitted' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Request Changes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeInTheDocument()
    })

    it('renders an enabled decision form for a resubmitted expense', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Resubmitted' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Request Changes' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeEnabled()
    })
  })

  describe('status message', () => {
    it('shows the approved message for an approved expense', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Approved' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(
        screen.getByText('Decision recorded. This expense has been approved.'),
      ).toBeInTheDocument()
    })

    it('shows the awaiting-resubmission message for a changes-requested expense', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Changes Requested' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(
        screen.getByText('Changes have been requested. Waiting for the consultant to resubmit.'),
      ).toBeInTheDocument()
    })

    it('does not show a status message for a submitted expense', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Submitted' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('does not show a status message for a resubmitted expense', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Resubmitted' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('disabled', () => {
    it('disables the form when the expense is not decidable', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Approved' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Request Changes' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeDisabled()
    })

    it('disables the form when disabled is set', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Submitted' })}
          onSubmit={vi.fn()}
          disabled
        />,
      )
      expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Request Changes' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeDisabled()
    })

    it('keeps the form enabled for a decidable expense when not disabled', () => {
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Submitted' })}
          onSubmit={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Request Changes' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeEnabled()
    })
  })

  describe('submit', () => {
    it('calls onSubmit with approve', async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Submitted' })}
          onSubmit={onSubmit}
        />,
      )
      await user.click(screen.getByRole('button', { name: 'Approve' }))
      await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit).toHaveBeenCalledWith('approve')
    })

    it('calls onSubmit with request-changes and the comment', async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Resubmitted' })}
          onSubmit={onSubmit}
        />,
      )
      await user.click(screen.getByRole('button', { name: 'Request Changes' }))
      await user.type(screen.getByLabelText('Comment'), 'Please add the VAT breakdown')
      await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit).toHaveBeenCalledWith('request-changes', 'Please add the VAT breakdown')
    })

    it('does not call onSubmit when the expense is not decidable', async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Approved' })}
          onSubmit={onSubmit}
        />,
      )
      await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('does not call onSubmit when disabled', async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(
        <ExpenseReviewSection
          expense={makeExpense({ status: 'Submitted' })}
          onSubmit={onSubmit}
          disabled
        />,
      )
      await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
