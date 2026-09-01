import type { Meta, StoryObj } from '@storybook/react'
import ReviewDecisionForm from '@/components/ReviewDecisionForm'

const meta: Meta<typeof ReviewDecisionForm> = {
  title: 'Components/ReviewDecisionForm',
  component: ReviewDecisionForm,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: (decision, comment) =>
      alert(comment ? `Decision: ${decision}\nComment: ${comment}` : `Decision: ${decision}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Select a decision (Approve or Request Changes) — only one can be selected at a time. Selecting "Request Changes" reveals a required comment field. Submitting calls the onSubmit callback with the decision and, when requesting changes, the comment.',
      },
    },
  },
}
