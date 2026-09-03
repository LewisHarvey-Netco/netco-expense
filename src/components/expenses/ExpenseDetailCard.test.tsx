import type { ReactElement } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, afterEach } from 'vitest'
import ExpenseDetailCard from '@/components/expenses/ExpenseDetailCard'
import type { Expense } from '@/types'
import '@testing-library/jest-dom'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-d1e2f3a4b5c6',
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

function renderCard(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ExpenseDetailCard', () => {
  describe('renders all expense fields with correct data', () => {
    it('renders the amount and currency', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Amount')).toHaveValue(320)
      expect(screen.getByLabelText('Currency')).toHaveValue('EUR')
    })

    it('renders the type', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Type')).toHaveTextContent('Accommodation')
    })

    it('renders the status', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense({ status: 'Changes Requested' })} />)
      expect(screen.getByText('Changes Requested')).toBeInTheDocument()
    })

    it('renders the receipt date', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Receipt date')).toHaveValue('2025-07-10')
    })

    it('renders the submission date', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByText('11 Jul 2025')).toBeInTheDocument()
    })

    it('renders the submitter name', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByText('Alice Nielsen')).toBeInTheDocument()
    })

    it('renders the region and project', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Region')).toHaveValue('DACH')
      expect(screen.getByLabelText('Project')).toHaveValue('Siemens Digital')
    })

    it('renders the description', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Hotel stay during Berlin conference',
      )
    })

    it('renders a receipt placeholder', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByText('Receipt not yet uploaded')).toBeInTheDocument()
    })
  })

  it('updates the form fields when the expense prop changes', () => {
    const { rerender } = renderCard(<ExpenseDetailCard expense={makeExpense({ amount: 320 })} />)
    expect(screen.getByLabelText('Amount')).toHaveValue(320)

    rerender(
      <MemoryRouter>
        <ExpenseDetailCard expense={makeExpense({ amount: 500, region: 'EMEA' })} />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Amount')).toHaveValue(500)
    expect(screen.getByLabelText('Region')).toHaveValue('EMEA')
  })

  describe('internal notes', () => {
    it('renders the internal notes when present', () => {
      renderCard(
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
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Amount')).toBeDisabled()
      expect(screen.getByLabelText('Currency')).toBeDisabled()
      expect(screen.getByLabelText('Receipt date')).toBeDisabled()
      expect(screen.getByLabelText('Region')).toBeDisabled()
      expect(screen.getByLabelText('Project')).toBeDisabled()
      expect(screen.getByLabelText('Description')).toBeDisabled()
    })

    it('disables the type field', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.getByLabelText('Type')).toBeDisabled()
    })
  })

  describe('isEditable prop', () => {
    it('enables all form fields when isEditable is true', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} isEditable />)
      expect(screen.getByLabelText('Amount')).toBeEnabled()
      expect(screen.getByLabelText('Currency')).toBeEnabled()
      expect(screen.getByLabelText('Type')).toBeEnabled()
      expect(screen.getByLabelText('Receipt date')).toBeEnabled()
      expect(screen.getByLabelText('Region')).toBeEnabled()
      expect(screen.getByLabelText('Project')).toBeEnabled()
      expect(screen.getByLabelText('Description')).toBeEnabled()
    })

    it('keeps all form fields disabled when isEditable is explicitly false', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense()} isEditable={false} />)
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
      renderCard(<ExpenseDetailCard expense={makeExpense()} isEditable />)

      const currency = screen.getByLabelText('Currency')
      await user.clear(currency)
      await user.type(currency, 'xx')
      await user.tab()

      expect(screen.getByText('Currency must be a 3-letter ISO 4217 code')).toBeInTheDocument()
    })

    it('clears the validation error once the field is valid again', async () => {
      const user = userEvent.setup()
      renderCard(<ExpenseDetailCard expense={makeExpense()} isEditable />)

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
      renderCard(<ExpenseDetailCard expense={makeExpense()} />)
      expect(screen.queryByText(/must be/i)).not.toBeInTheDocument()
    })
  })

  describe('internal notes render identically for all roles', () => {
    it('shows the notes for a consultant when present', () => {
      renderCard(
        <ExpenseDetailCard
          expense={makeExpense({ internalNotes: 'Please add the VAT breakdown.' })}
          role="consultant"
        />,
      )
      expect(screen.getByText('Please add the VAT breakdown.')).toBeInTheDocument()
    })

    it('shows the notes for finance when present', () => {
      renderCard(
        <ExpenseDetailCard
          expense={makeExpense({ internalNotes: 'Please add the VAT breakdown.' })}
          role="finance"
        />,
      )
      expect(screen.getByText('Please add the VAT breakdown.')).toBeInTheDocument()
    })

    it('shows the notes when the role is undefined', () => {
      renderCard(
        <ExpenseDetailCard expense={makeExpense({ internalNotes: 'Please add the VAT breakdown.' })} />,
      )
      expect(screen.getByText('Please add the VAT breakdown.')).toBeInTheDocument()
    })

    it('shows a placeholder for a consultant when there are no notes', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense({ internalNotes: null })} role="consultant" />)
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })

    it('shows a placeholder for finance when there are no notes', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense({ internalNotes: null })} role="finance" />)
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })

    it('shows a placeholder when the role is undefined and there are no notes', () => {
      renderCard(<ExpenseDetailCard expense={makeExpense({ internalNotes: null })} />)
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })
  })

  describe('resubmit', () => {
    // Safety net: a test that times out mid-way through vi.useFakeTimers() would
    // otherwise leak fake timers into the following tests and hang them.
    afterEach(() => {
      vi.useRealTimers()
    })

    describe('Resubmit button visibility', () => {
      it('shows the Resubmit button when isEditable and onResubmit are provided', () => {
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={vi.fn().mockResolvedValue(undefined)}
          />,
        )
        expect(screen.getByRole('button', { name: 'Resubmit' })).toBeInTheDocument()
      })

      it('hides the Resubmit button when isEditable is false', () => {
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense()}
            isEditable={false}
            onResubmit={vi.fn().mockResolvedValue(undefined)}
          />,
        )
        expect(screen.queryByRole('button', { name: 'Resubmit' })).not.toBeInTheDocument()
      })

      it('hides the Resubmit button when onResubmit is not provided', () => {
        renderCard(<ExpenseDetailCard expense={makeExpense({ status: 'Submitted' })} isEditable />)
        expect(screen.queryByRole('button', { name: 'Resubmit' })).not.toBeInTheDocument()
      })
    })

    describe('valid submission', () => {
      it('calls onResubmit with the form values and the expense id', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        const expense = makeExpense({ status: 'Submitted' })
        renderCard(<ExpenseDetailCard expense={expense} isEditable onResubmit={onResubmit} />)

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        await waitFor(() => expect(onResubmit).toHaveBeenCalledTimes(1))
        expect(onResubmit).toHaveBeenCalledWith(expense)
      })

      it('sends the edited form values, including a numeric amount', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        const expense = makeExpense({ status: 'Submitted' })
        renderCard(<ExpenseDetailCard expense={expense} isEditable onResubmit={onResubmit} />)

        const amount = screen.getByLabelText('Amount')
        await user.clear(amount)
        await user.type(amount, '500')
        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        await waitFor(() => expect(onResubmit).toHaveBeenCalledTimes(1))
        expect(onResubmit).toHaveBeenCalledWith({ ...expense, amount: 500 })
      })
    })

    describe('invalid submission', () => {
      it('does not call onResubmit and shows the inline validation error once', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        const currency = screen.getByLabelText('Currency')
        await user.clear(currency)
        await user.type(currency, 'xx')
        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        expect(onResubmit).not.toHaveBeenCalled()
        expect(screen.getAllByText('Currency must be a 3-letter ISO 4217 code')).toHaveLength(1)
      })

      it('shows an amount error when the amount is cleared', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        await user.clear(screen.getByLabelText('Amount'))
        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        expect(onResubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Amount must be a number')).toBeInTheDocument()
      })
    })

    describe('loading state', () => {
      it('disables the button with loading text while submitting; fields stay enabled', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn(() => new Promise<void>(() => {}))
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        const button = await screen.findByRole('button', { name: /Resubmitting/ })
        expect(button).toBeDisabled()
        expect(screen.getByLabelText('Amount')).toBeEnabled()
        expect(screen.getByLabelText('Description')).toBeEnabled()
      })
    })

    describe('success feedback', () => {
      it('shows a success message and a Back to Expenses link', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        expect(await screen.findByText('Expense resubmitted successfully.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Back to Expenses' })).toBeInTheDocument()
      })

      it('auto-dismisses the success message after 3 seconds but keeps the Back link', async () => {
        vi.useFakeTimers()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Resubmit' }))

        // Let the async validation + onResubmit + state update settle. The
        // submit is promise-based, so advanceTimersByTimeAsync (which flushes
        // microtasks as it advances the clock) is required; loop a few times to
        // let the whole promise chain resolve.
        for (let i = 0; i < 20; i++) {
          await act(async () => {
            await vi.advanceTimersByTimeAsync(0)
          })
          if (screen.queryByText('Expense resubmitted successfully.')) break
        }

        expect(onResubmit).toHaveBeenCalledTimes(1)
        expect(screen.getByText('Expense resubmitted successfully.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Back to Expenses' })).toBeInTheDocument()

        // Advance past the 3s auto-dismiss.
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3000)
        })

        expect(screen.queryByText('Expense resubmitted successfully.')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Back to Expenses' })).toBeInTheDocument()
      })

      it('updates the displayed status when the expense prop changes after resubmit', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockResolvedValue(undefined)
        const { rerender } = renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )
        expect(screen.queryByText('Resubmitted')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))
        await screen.findByText('Expense resubmitted successfully.')

        rerender(
          <MemoryRouter>
            <ExpenseDetailCard
              expense={makeExpense({ status: 'Resubmitted' })}
              isEditable
              onResubmit={onResubmit}
            />
          </MemoryRouter>,
        )
        expect(screen.getByText('Resubmitted')).toBeInTheDocument()
      })
    })

    describe('error feedback', () => {
      it('shows an error message and keeps the button enabled for retry', async () => {
        const user = userEvent.setup()
        const onResubmit = vi.fn().mockRejectedValue(new Error('Network error'))
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))

        expect(
          await screen.findByText('Failed to resubmit the expense. Please try again.'),
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Resubmit' })).toBeEnabled()
      })

      it('succeeds on retry after a failed submission', async () => {
        const user = userEvent.setup()
        const onResubmit = vi
          .fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(undefined)
        renderCard(
          <ExpenseDetailCard
            expense={makeExpense({ status: 'Submitted' })}
            isEditable
            onResubmit={onResubmit}
          />,
        )

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))
        expect(
          await screen.findByText('Failed to resubmit the expense. Please try again.'),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Resubmit' }))
        expect(await screen.findByText('Expense resubmitted successfully.')).toBeInTheDocument()
        expect(onResubmit).toHaveBeenCalledTimes(2)
      })
    })
  })
})
