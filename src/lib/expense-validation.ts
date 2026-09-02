import Ajv from 'ajv'
import schema from '@/schemas/expense.schema.json'
import type { Expense } from '@/types'

/**
 * Validator for Expense data model, using the authoritative JSON Schema from src/schemas/expense.schema.json
 * This ensures all expense data (from API, forms, mocks) conforms to the schema constraints.
 */

// Initialize ajv with JSON Schema Draft 2020-12 support and format validation
const ajv = new Ajv({
  formats: {
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}$/,
    'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  },
})

// Compile the schema once for reuse
// Remove $schema to avoid meta-schema lookup; we're validating against the expense schema directly
const schemaForValidation = { ...schema, $schema: undefined }
const validateExpense = ajv.compile(schemaForValidation as any)

/**
 * Validates an expense object against the JSON Schema.
 * @param data - The data to validate (typically untrusted from external sources)
 * @returns The validated expense if valid
 * @throws Error if validation fails with detailed constraint violations
 */
export function validateAndParseExpense(data: unknown): Expense {
  if (validateExpense(data)) {
    return data as Expense
  }

  // Format validation errors for debugging
  const errors = validateExpense.errors
    ?.map((err) => `${err.instancePath || 'root'} ${err.message}`)
    .join('; ')

  throw new Error(`Invalid expense: ${errors || 'unknown validation error'}`)
}

/**
 * Type guard for safely checking if data is a valid Expense.
 * @param data - The data to check
 * @returns true if data is a valid Expense, false otherwise (does not throw)
 */
export function isValidExpense(data: unknown): data is Expense {
  return validateExpense(data)
}
