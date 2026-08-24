import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

const meta: Meta<typeof Card> = {
  title: 'Components/UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        This is the main content of the card.
      </CardContent>
      <CardFooter>
        Footer content
      </CardFooter>
    </Card>
  ),
}

export const Simple: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
      </CardHeader>
      <CardContent>
        Just a title and content, no footer.
      </CardContent>
    </Card>
  ),
}
