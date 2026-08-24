export type Role = 'consultant' | 'finance'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export function roleHome(role: Role): string {
  if (role === 'consultant') return '/expenses'
  return '/review'
}

export type ExpenseType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Transport' | 'Accommodation'

export type ExpenseStatus = 'Submitted' | 'Approved' | 'Changes Requested' | 'Resubmitted'

export interface Expense {
  id: string
  submitterId: string
  description: string
  type: ExpenseType
  amount: number
  currency: string
  receiptDate: string
  status: ExpenseStatus
  submittedAt: string
  internalNotes: string | null
  region: string
  project: string
}
