import rawExpenses from '@/mocks/expenses.json'

// Load raw mock expenses without validation.
// The frontend should be resilient to invalid data from the backend (real or mock).
// Validation happens at write boundaries (form submissions, mutations) via the repository,
// not at load time. Read operations may encounter invalid data and should handle it gracefully.
export default rawExpenses
