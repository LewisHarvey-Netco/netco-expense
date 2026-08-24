import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '@/components/ui/badge'

const meta: Meta<typeof Badge> = {
  title: 'Components/UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Badge',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
  },
}
