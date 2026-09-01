import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ReviewDecisionForm from '@/components/ReviewDecisionForm'
import '@testing-library/jest-dom'

describe('ReviewDecisionForm', () => {
  it('renders Approve and Request Changes buttons', () => {
    render(<ReviewDecisionForm onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request Changes' })).toBeInTheDocument()
  })

  it('does not show the comment field by default', () => {
    render(<ReviewDecisionForm onSubmit={vi.fn()} />)
    expect(screen.queryByLabelText('Comment')).not.toBeInTheDocument()
  })

  it('selects Approve when clicked', async () => {
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={vi.fn()} />)
    const approve = screen.getByRole('button', { name: 'Approve' })
    await user.click(approve)
    expect(approve).toHaveAttribute('aria-pressed', 'true')
  })

  it('selects Request Changes when clicked and shows the comment field', async () => {
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Request Changes' }))
    expect(screen.getByRole('button', { name: 'Request Changes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Comment')).toBeInTheDocument()
  })

  it('allows only one action to be selected at a time', async () => {
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Request Changes' }))
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Request Changes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('hides the comment field when switching back to Approve', async () => {
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Request Changes' }))
    expect(screen.getByLabelText('Comment')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(screen.queryByLabelText('Comment')).not.toBeInTheDocument()
  })

  it('submits approve without a comment', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toBe('approve')
    expect(onSubmit.mock.calls[0][1]).toBeUndefined()
  })

  it('submits request-changes with the comment', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Request Changes' }))
    await user.type(screen.getByLabelText('Comment'), 'Please add the VAT breakdown')
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toBe('request-changes')
    expect(onSubmit.mock.calls[0][1]).toBe('Please add the VAT breakdown')
  })

  it('does not submit when no decision is selected', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Select a decision')).toBeInTheDocument()
  })

  it('does not submit request-changes without a comment', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Request Changes' }))
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('Comment is required when requesting changes'),
    ).toBeInTheDocument()
  })

  it('does not submit request-changes with a whitespace-only comment', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReviewDecisionForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Request Changes' }))
    await user.type(screen.getByLabelText('Comment'), '   ')
    await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('Comment is required when requesting changes'),
    ).toBeInTheDocument()
  })

  describe('disabled', () => {
    it('disables all controls when disabled', () => {
      render(<ReviewDecisionForm onSubmit={vi.fn()} disabled />)
      expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Request Changes' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Submit Decision' })).toBeDisabled()
    })

    it('cannot select a decision or submit when disabled', async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(<ReviewDecisionForm onSubmit={onSubmit} disabled />)
      await user.click(screen.getByRole('button', { name: 'Approve' }))
      expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
      await user.click(screen.getByRole('button', { name: 'Submit Decision' }))
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
