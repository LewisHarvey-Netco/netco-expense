import { Badge, type badgeVariants } from '@/components/ui/badge'
import DataTable, { type Column } from '@/components/DataTable'
import type { Expense, ExpenseStatus } from '@/types'
import type { VariantProps } from 'class-variance-authority'

interface ExpenseTableProps {
  expenses: Expense[]
  onRowClick?: (id: string) => void
  getSubmitterName?: (submitterId: string) => string
}

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

// Reuses the shared Badge variants (tied to Netcompany's CSS tokens) rather than
// hardcoding arbitrary Tailwind colors. See DESIGN-GUIDELINES.md.
const STATUS_VARIANTS: Record<ExpenseStatus, BadgeVariant> = {
  Approved: 'default',
  Submitted: 'secondary',
  'Changes Requested': 'destructive',
  Resubmitted: 'outline',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`
}

export default function ExpenseTable({
  expenses,
  onRowClick,
  getSubmitterName,
}: ExpenseTableProps) {
  const columns: Column<Expense>[] = [
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (expense) => (
        <span className="text-muted-foreground">
          {formatDate(expense.submittedAt)}
        </span>
      ),
    },
    {
      key: 'submitter',
      label: 'Submitter',
      render: (expense) =>
        getSubmitterName
          ? getSubmitterName(expense.submitterId)
          : expense.submitterId,
    },
    {
      key: 'description',
      label: 'Description',
      render: (expense) => (
        <span className="max-w-[240px] truncate" title={expense.description}>
          {expense.description}
        </span>
      ),
      className: 'max-w-[240px]',
    },
    {
      key: 'type',
      label: 'Type',
      render: (expense) => expense.type,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (expense) => (
        <span className="tabular-nums">
          {formatAmount(expense.amount, expense.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (expense) => (
        <Badge variant={STATUS_VARIANTS[expense.status]}>{expense.status}</Badge>
      ),
    },
  ]

  return (
    <DataTable<Expense>
      data={expenses}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage="No expenses to display."
    />
  )
}
