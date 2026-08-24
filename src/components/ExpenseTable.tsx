import { Badge } from '@/components/ui/badge'
import DataTable, { type Column } from '@/components/DataTable'
import { cn } from '@/lib/utils'
import type { Expense, ExpenseStatus } from '@/types'

interface ExpenseTableProps {
  expenses: Expense[]
  onRowClick?: (id: string) => void
  getSubmitterName?: (submitterId: string) => string
}

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Submitted: 'bg-sky-50 text-sky-700 border-sky-200',
  'Changes Requested': 'bg-amber-50 text-amber-700 border-amber-200',
  Resubmitted: 'bg-violet-50 text-violet-700 border-violet-200',
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
        <Badge
          variant="outline"
          className={cn('inline-flex', STATUS_STYLES[expense.status])}
        >
          {expense.status}
        </Badge>
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
