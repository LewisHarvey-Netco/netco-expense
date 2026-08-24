import rawExpenses from '@/mocks/expenses.json'
import { validateAndParseExpense } from '@/lib/expense-validation'
import type { Expense } from '@/types'

const expenses: Expense[] = rawExpenses.map((e) => validateAndParseExpense(e))

export default expenses
