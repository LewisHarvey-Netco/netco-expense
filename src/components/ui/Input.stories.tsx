import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Input> = {
  title: 'Components/UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="email">Email</Label>
      <Input id="email" placeholder="you@example.com" type="email" />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const Password: Story = {
  args: {
    placeholder: 'Enter password',
    type: 'password',
  },
}
