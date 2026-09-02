import type { Meta, StoryObj } from '@storybook/react'
import PageTitle from '@/components/PageTitle'

const meta: Meta<typeof PageTitle> = {
  title: 'Components/PageTitle',
  component: PageTitle,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'All Expenses',
  },
}

export const Compact: Story = {
  args: {
    children: 'Page not found',
    className: 'text-xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller title for compact contexts such as the 404 card.',
      },
    },
  },
}
