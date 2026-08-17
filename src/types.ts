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
