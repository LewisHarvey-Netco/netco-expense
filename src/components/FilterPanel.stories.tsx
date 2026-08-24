import type { Meta, StoryObj } from '@storybook/react'
import FilterPanel from '@/components/FilterPanel'
import type { FilterCriteria } from '@/lib/filterExpenses'

const meta: Meta<typeof FilterPanel> = {
  title: 'Components/FilterPanel',
  component: FilterPanel,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const submitters = [
  { id: 'u1', name: 'Alice Nielsen' },
  { id: 'u2', name: 'Bob Madsen' },
]

export const Default: Story = {
  args: {
    submitters,
    onApply: (criteria: FilterCriteria) => alert(`Applied filters: ${JSON.stringify(criteria)}`),
    onClear: () => alert('Filters cleared'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter form with status/type multi-select checkboxes, submitter dropdown, and date range. Filters apply only when "Apply Filters" is clicked.',
      },
    },
  },
}
