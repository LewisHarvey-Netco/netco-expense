import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import FilterPanel from '@/components/FilterPanel'
import '@testing-library/jest-dom'

const submitters = [
  { id: 'u1', name: 'Alice Nielsen' },
  { id: 'u2', name: 'Bob Madsen' },
]

function renderPanel(onApply = vi.fn(), onClear = vi.fn(), showSubmitterFilter?: boolean) {
  return {
    onApply,
    onClear,
    ...render(
      <FilterPanel
        submitters={submitters}
        onApply={onApply}
        onClear={onClear}
        showSubmitterFilter={showSubmitterFilter}
      />,
    ),
  }
}

describe('FilterPanel', () => {
  it('renders all filter fields', () => {
    renderPanel()

    expect(screen.getByText('Filters')).toBeInTheDocument()
    for (const status of ['Submitted', 'Approved', 'Changes Requested', 'Resubmitted']) {
      expect(screen.getByRole('checkbox', { name: status })).toBeInTheDocument()
    }
    expect(screen.getByRole('checkbox', { name: 'Breakfast' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Accommodation' })).toBeInTheDocument()
    expect(screen.getByText('All submitters')).toBeInTheDocument()
    expect(screen.getByLabelText('From date')).toBeInTheDocument()
    expect(screen.getByLabelText('To date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument()
  })

  it('applies an empty criteria when no filters are selected', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(onApply).toHaveBeenCalledWith({})
  })

  it('applies the selected filters as criteria', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel()

    await user.click(screen.getByRole('checkbox', { name: 'Submitted' }))
    await user.click(screen.getByRole('checkbox', { name: 'Resubmitted' }))
    await user.click(screen.getByText('All submitters'))
    await user.click(await screen.findByRole('option', { name: 'Alice Nielsen' }))
    await user.click(screen.getByRole('checkbox', { name: 'Lunch' }))
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-01' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-07-31' } })

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(onApply).toHaveBeenCalledWith({
      status: ['Submitted', 'Resubmitted'],
      submitterId: 'u1',
      type: ['Lunch'],
      dateRange: { from: new Date('2025-07-01'), to: new Date('2025-07-31') },
    })
  })

  it('omits unselected filter dimensions from the criteria', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel()

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(onApply).toHaveBeenCalledWith({ status: ['Approved'] })
  })

  it('removes a status from the criteria when its checkbox is unchecked', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel()

    await user.click(screen.getByRole('checkbox', { name: 'Submitted' }))
    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('checkbox', { name: 'Submitted' }))

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(onApply).toHaveBeenCalledWith({ status: ['Approved'] })
  })

  it('clears the form and notifies the parent on Clear Filters', async () => {
    const user = userEvent.setup()
    const { onClear } = renderPanel()

    await user.click(screen.getByRole('checkbox', { name: 'Submitted' }))
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-01' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-07-31' } })

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('checkbox', { name: 'Submitted' })).not.toBeChecked()
    expect(screen.getByLabelText('From date')).toHaveValue('')
    expect(screen.getByLabelText('To date')).toHaveValue('')
    expect(screen.getByText('All submitters')).toBeInTheDocument()
  })

  it('does not apply when only one date is set', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel()

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-01' } })
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(screen.getByText('Enter both a from and a to date')).toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('does not apply when the from date is after the to date', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel()

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-31' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-07-01' } })
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(screen.getByText('From date must be on or before to date')).toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('shows the submitter filter by default', () => {
    renderPanel()

    expect(screen.getByText('Submitter')).toBeInTheDocument()
    expect(screen.getByText('All submitters')).toBeInTheDocument()
  })

  it('shows the submitter filter when showSubmitterFilter is true', () => {
    renderPanel(undefined, undefined, true)

    expect(screen.getByText('Submitter')).toBeInTheDocument()
    expect(screen.getByText('All submitters')).toBeInTheDocument()
  })

  it('hides the submitter filter when showSubmitterFilter is false', () => {
    renderPanel(undefined, undefined, false)

    expect(screen.queryByText('Submitter')).not.toBeInTheDocument()
    expect(screen.queryByText('All submitters')).not.toBeInTheDocument()
  })

  it('applies the other filters when the submitter filter is hidden', async () => {
    const user = userEvent.setup()
    const { onApply } = renderPanel(undefined, undefined, false)

    await user.click(screen.getByRole('checkbox', { name: 'Approved' }))
    await user.click(screen.getByRole('checkbox', { name: 'Transport' }))
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-01' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-07-31' } })

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(onApply).toHaveBeenCalledWith({
      status: ['Approved'],
      type: ['Transport'],
      dateRange: { from: new Date('2025-07-01'), to: new Date('2025-07-31') },
    })
  })

  it('still clears all filters when the submitter filter is hidden', async () => {
    const user = userEvent.setup()
    const { onClear } = renderPanel(undefined, undefined, false)

    await user.click(screen.getByRole('checkbox', { name: 'Submitted' }))
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-07-01' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-07-31' } })

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('checkbox', { name: 'Submitted' })).not.toBeChecked()
    expect(screen.getByLabelText('From date')).toHaveValue('')
    expect(screen.getByLabelText('To date')).toHaveValue('')
  })
})
