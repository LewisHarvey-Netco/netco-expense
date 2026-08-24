import type { Expense, ExpenseStatus, ExpenseType } from '@/types'

export interface FilterCriteria {
  status?: ExpenseStatus[]
  submitterId?: string
  type?: ExpenseType[]
  dateRange?: { from: Date; to: Date }
}

export function filterExpenses(expenses: Expense[], filters: FilterCriteria): Expense[] {
  return expenses.filter((expense) => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(expense.status)) {
      return false
    }
    if (filters.submitterId && expense.submitterId !== filters.submitterId) {
      return false
    }
    if (filters.type && filters.type.length > 0 && !filters.type.includes(expense.type)) {
      return false
    }
    if (filters.dateRange && !isWithinDateRange(expense.receiptDate, filters.dateRange)) {
      return false
    }
    return true
  })
}

function isWithinDateRange(receiptDate: string, range: { from: Date; to: Date }): boolean {
  const day = receiptDateToUtcDay(receiptDate)
  return day >= startOfUtcDay(range.from) && day <= startOfUtcDay(range.to)
}

function receiptDateToUtcDay(receiptDate: string): number {
  const [year, month, day] = receiptDate.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}
