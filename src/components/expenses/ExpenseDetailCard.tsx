import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ReceiptIcon } from 'lucide-react'
import { Badge, STATUS_VARIANTS } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { expenseSchema, type ExpenseFormValues } from '@/schemas/expense'
import users from '@/mocks/users.json'
import { EXPENSE_TYPES, type Expense, type Role } from '@/types'

interface ExpenseDetailCardProps {
  expense: Expense
  /**
   * The role of the user viewing the card. Accepted so the card's API matches
   * the role-aware detail page; the card renders identically for every role
   * (internal notes are shown for all roles, with a placeholder when there are
   * none).
   */
  role?: Role
  /**
   * Enables the form fields for editing. Defaults to false (read-only), which
   * is the behaviour for finance viewers and for approved expenses.
   */
  isEditable?: boolean
}

function getSubmitterName(submitterId: string): string {
  return users.find((u) => u.id === submitterId)?.name ?? submitterId
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Expense detail card.
 *
 * Renders every expense field. The editable fields (amount, currency, type,
 * receipt date, region, project, description) are react-hook-form fields
 * validated by the Zod schema in `src/schemas/expense.ts`. They are disabled
 * (read-only) unless `isEditable` is true; validation errors are shown inline
 * as fields become invalid. Workflow-managed fields (status, submission date,
 * submitter, internal notes, receipt) are plain display elements.
 */
export default function ExpenseDetailCard({ expense, isEditable = false }: ExpenseDetailCardProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    mode: 'onBlur',
    defaultValues: expense,
  })

  const errors = form.formState.errors

  // Keep the form in sync if the expense is replaced (e.g. after a status
  // update re-renders the card). When not editable all fields are disabled, so
  // no user input is lost on reset.
  useEffect(() => {
    form.reset(expense)
  }, [expense, form])

  const hasNotes = expense.internalNotes !== null && expense.internalNotes !== ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Controller
                name="amount"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    disabled={!isEditable}
                    aria-invalid={!!errors.amount}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-currency">Currency</Label>
              <Controller
                name="currency"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="expense-currency"
                    disabled={!isEditable}
                    aria-invalid={!!errors.currency}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.currency && (
                <p className="text-xs text-destructive">{errors.currency.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-type">Type</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!isEditable}
                  >
                    <SelectTrigger
                      id="expense-type"
                      className="w-full"
                      aria-invalid={!!errors.type}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <Badge variant={STATUS_VARIANTS[expense.status]}>{expense.status}</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-receipt-date">Receipt date</Label>
              <Controller
                name="receiptDate"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="expense-receipt-date"
                    type="date"
                    disabled={!isEditable}
                    aria-invalid={!!errors.receiptDate}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.receiptDate && (
                <p className="text-xs text-destructive">{errors.receiptDate.message}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <div className="mt-1">{formatDate(expense.submittedAt)}</div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-region">Region</Label>
              <Controller
                name="region"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="expense-region"
                    disabled={!isEditable}
                    aria-invalid={!!errors.region}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.region && (
                <p className="text-xs text-destructive">{errors.region.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-project">Project</Label>
              <Controller
                name="project"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="expense-project"
                    disabled={!isEditable}
                    aria-invalid={!!errors.project}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.project && (
                <p className="text-xs text-destructive">{errors.project.message}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Submitted by</p>
              <div className="mt-1">{getSubmitterName(expense.submitterId)}</div>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="expense-description">Description</Label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    id="expense-description"
                    disabled={!isEditable}
                    aria-invalid={!!errors.description}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Internal notes</p>
              <div className="mt-1">
                {hasNotes ? (
                  expense.internalNotes
                ) : (
                  <span className="text-muted-foreground">No notes yet</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Receipt</p>
            <div className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-muted-foreground">
              <ReceiptIcon />
              <p className="text-sm">Receipt not yet uploaded</p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
