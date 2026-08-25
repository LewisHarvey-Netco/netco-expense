import { Badge, STATUS_VARIANTS } from '@/components/ui/badge'
import DataTable, { type Column } from '@/components/DataTable'
import type { Expense } from '@/types'

interface ExpenseTableProps {
  expenses: Expense[]
  onRowClick?: (id: string) => void
  getSubmitterName?: (submitterId: string) => string
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
      className: 'w-[110px]',
      render: (expense) => (
        <span className="text-muted-foreground">
          {formatDate(expense.submittedAt)}
        </span>
      ),
    },
    {
      key: 'submitter',
      label: 'Submitter',
      className: 'w-[130px] truncate',
      render: (expense) =>
        getSubmitterName
          ? getSubmitterName(expense.submitterId)
          : expense.submitterId,
    },
    {
      key: 'description',
      label: 'Description',
      className: 'truncate',
      render: (expense) => (
        <span title={expense.description}>{expense.description}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      className: 'w-[120px]',
      render: (expense) => expense.type,
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'w-[120px]',
      render: (expense) => (
        <span className="tabular-nums">
          {formatAmount(expense.amount, expense.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-[140px]',
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
      tableClassName="min-w-[760px]"
    />
  )
}
