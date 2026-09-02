import { z } from 'zod'
import { EXPENSE_STATUSES, EXPENSE_TYPES } from '@/types'

/**
 * Zod schema for the Expense data model.
 *
 * Mirrors the authoritative JSON Schema in `src/schemas/expense.schema.json`
 * (see ADR-0004). Used by react-hook-form (via `@hookform/resolvers/zod`) in
 * form components such as `ExpenseDetailCard`, keeping validation rules in one
 * place and ready for reuse when fields become editable.
 */
export const expenseSchema = z.object({
  id: z.string().uuid(),
  submitterId: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(EXPENSE_TYPES),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive({ error: 'Amount must be greater than 0' }),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO 4217 code'),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(EXPENSE_STATUSES),
  submittedAt: z.string().datetime({ offset: true }),
  internalNotes: z.string().nullable(),
  region: z.string().min(1),
  project: z.string().min(1),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
