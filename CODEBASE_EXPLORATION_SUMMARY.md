# Netco Expense App - Codebase Exploration Summary

## Overview
The Netco Expense App is a Vite + React 19 + TypeScript expense management system with two user roles: consultants (who submit expenses) and finance staff (who review/approve them). The app uses a layered architecture with repositories, contexts, and components, following patterns documented in `docs/architecture.md` (ADR-0010, ADR-0011, ADR-0012, ADR-0013).

---

## 1. ExpenseRepository Interface & MockExpenseRepository Implementation

### Location
- Interface: `src/lib/repositories/ExpenseRepository.ts`
- Implementation: `src/lib/repositories/MockExpenseRepository.ts`

### ExpenseRepository Interface (Data-Access Boundary)
**Interface Contract** (`ExpenseRepository.ts`):
```typescript
export interface ExpenseRepository {
  getExpense(id: string): Promise<Expense | null>
  getExpenses(): Promise<Expense[]>
  getExpensesBySubmitter(submitterId: string): Promise<Expense[]>
  updateExpenseStatus(id: string, status: ExpenseStatus, comment?: string): Promise<Expense>
  updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense>
}
```

**Key Points:**
- All methods are async to allow future API integration without component changes
- Designed as a data-access boundary (see ADR-0010, ADR-0011)
- Components depend on this interface, not concrete implementations
- Supports role-based workflows: status updates (finance), expense edits (consultants)

### MockExpenseRepository Implementation
**Architecture:**
- Implements `ExpenseRepository` interface for in-memory expense management
- Loads a copy of mock expenses on construction to preserve original mock data
- In-memory Map<string, Expense> for storage
- All mutations create new objects (no in-place mutations)

**Key Behaviors:**
1. **Validation on Read** (`validateExpenseOnRead`):
   - Validates expenses before returning, mimicking potential API data corruption
   - Filters out invalid expenses (warning logged if found)
   - Prevents bad data from propagating through the app

2. **Status Updates** (`updateExpenseStatus`):
   - Updates status and internal notes (comment)
   - Validates before persisting
   - Throws if expense not found

3. **Expense Updates** (`updateExpense`):
   - Prevents editing of 'Approved' (terminal) expenses
   - Automatically transitions status to 'Resubmitted' on edit
   - Validates merged object against full Zod schema before persisting
   - Throws if expense not found

4. **Reset Capability**:
   - `reset(initialExpenses)` clears and repopulates state for test isolation
   - Stores raw data as-is; validation happens on mutations

---

## 2. ExpenseDetailCard Component

### Location
`src/components/expenses/ExpenseDetailCard.tsx`

### Props Interface
```typescript
interface ExpenseDetailCardProps {
  expense: Expense
  role?: Role                                    // For API consistency with detail page
  isEditable?: boolean                           // Enables form fields (default: false)
  onResubmit?: (updatedExpense: Expense) => Promise<void>  // Submission callback
}
```

### Behavior
**Rendering:**
- Renders all expense fields in a form layout
- Editable fields: amount, currency, type, receiptDate, region, project, description
- Read-only fields: status (Badge), submissionDate, submitter name, internalNotes, receipt
- Uses react-hook-form + Zod schema validation (from `src/schemas/expense.ts`)
- Form validation mode: 'onBlur' (validates when fields lose focus)
- Inline error messages only shown when `isEditable` is true

**State Management:**
- Form keeps in sync with expense prop (via `useEffect` + `form.reset()`)
- Tracks submission feedback: 'success' | 'error' | null
- Success message auto-dismisses after 3 seconds
- After successful resubmit, shows persistent "Back to Expenses" link

**Resubmit Workflow:**
- "Resubmit" button only appears when `isEditable && onResubmit` both true
- On submit:
  - Calls `onResubmit({ ...formValues, id: expense.id })`
  - Shows loading state on button while pending
  - On success: shows inline success alert + back link
  - On error: shows inline error alert, button remains enabled for retry

**Accessibility:**
- All inputs have `aria-invalid` attributes
- Labels linked to inputs via htmlFor

---

## 3. Current Routing Setup

### Location
- App routes: `src/App.tsx`
- Bootstrap: `src/main.tsx`

### Router Configuration (`App.tsx`)
```typescript
BrowserRouter structure with Routes:
  /login                          → LoginPage (public)
  /expenses                       → ExpensesPage (consultant only)
  /expenses/:id                   → ExpenseDetailPage (consultant only)
  /review                         → ReviewPage (finance only)
  /review/:id                     → ExpenseDetailPage (finance only, shows review widget)
  /                               → RootRedirect (redirects to role home)
  *                               → NotFoundPage (404)
```

### Provider Stack (`main.tsx`)
```
BrowserRouter (top-level)
  ↓
RepositoryProvider (data-access boundary, outermost)
  ↓
AuthProvider (authentication state)
  ↓
App (route configuration)
```

### Role-Based Routing
- Two user roles: 'consultant' | 'finance'
- Consultant home: `/expenses`
- Finance home: `/review`
- `RootRedirect` component determines initial destination based on `user.role`

---

## 4. ProtectedRoute Component (Role-Based Access Control)

### Location
`src/components/ProtectedRoute.tsx`

### Implementation
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]  // If not provided, only checks auth
}
```

### Logic
1. **Unauthenticated**: Redirect to `/login`
2. **Authenticated but wrong role**: Redirect to `roleHome(user.role)` (same-role home page)
3. **Authenticated with correct role**: Render children

### Usage Pattern
```typescript
<Route
  path="/expenses"
  element={
    <ProtectedRoute allowedRoles={['consultant']}>
      <ExpensesPage />
    </ProtectedRoute>
  }
/>
```

---

## 5. Expense Pages & Page Structure

### ExpensesPage (Consultant Expenses List)

**Location:** `src/pages/ExpensesPage.tsx`

**Route:** `/expenses` (consultant only)

**Responsibilities:**
- Fetches all expenses for the logged-in consultant via `repo.getExpensesBySubmitter(user.id)`
- Manages filter state (`FilterCriteria`)
- Renders filtered expense table with navigation to detail view
- Handles loading, error, and success states

**Layout:**
```
Header
Main (max-width: 6xl)
  PageTitle: "My Expenses"
  Grid: [FilterPanel (280px, lg) | Card with ExpenseTable]
    FilterPanel: status, type, dateRange filters
    ExpenseTable: clickable rows → navigate to /expenses/:id
```

**Data Flow:**
- `useEffect` loads expenses by submitter once on mount
- Cleanup function cancels request if component unmounts
- Error state shown as Alert if fetch fails

### ExpenseDetailPage (Expense Detail & Review)

**Location:** `src/pages/ExpenseDetailPage.tsx`

**Routes:** 
- `/expenses/:id` (consultant - editable if status allows)
- `/review/:id` (finance - read-only + review workflow)

**Key Features:**
1. **Role-Based Editing**:
   - Consultant can edit their own expense only if status is 'Submitted', 'Changes Requested', or 'Resubmitted'
   - Finance always sees read-only view
   - 'Approved' status is terminal (never editable)

2. **Ownership Checks**:
   - Consultant can only view their own expenses (404 if mismatch)
   - Returns 404 (not 403) to avoid revealing expense existence

3. **Dual Layout**:
   - **Finance view**: 2-column grid
     - Left: ExpenseDetailCard (read-only)
     - Right: Review decision section (approve/request changes + comment)
   - **Consultant view**: Single column
     - ExpenseDetailCard (editable if status allows)

4. **State Management**:
   - Loads expense by ID from repository
   - Tracks loading, error, and submission states
   - On successful resubmit/decision, updates displayed expense in-place

5. **Handlers**:
   - `handleResubmit`: Called when consultant resubmits → updates repository + local state
   - `handleDecision`: Called when finance makes decision → calls `updateExpenseStatus` + updates local state

---

## 6. Expense Types, Schema & Validation

### Type Definitions

**Location:** `src/types.ts`

```typescript
// Role
type Role = 'consultant' | 'finance'

// User
interface User {
  id: string
  name: string
  email: string
  role: Role
}

// Expense Types & Statuses
type ExpenseType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Transport' | 'Accommodation'
type ExpenseStatus = 'Submitted' | 'Approved' | 'Changes Requested' | 'Resubmitted'

// Expense
interface Expense {
  id: string (UUID)
  submitterId: string
  description: string
  type: ExpenseType
  amount: number (positive)
  currency: string (3-letter ISO 4217 code, e.g., 'EUR', 'USD')
  receiptDate: string (YYYY-MM-DD format)
  status: ExpenseStatus
  submittedAt: string (ISO 8601 datetime)
  internalNotes: string | null (finance-only notes)
  region: string
  project: string
}
```

### Schema Validation

**Location:** `src/schemas/expense.ts` (Zod)

```typescript
export const expenseSchema = z.object({
  id: z.string().uuid(),
  submitterId: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(EXPENSE_TYPES),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO 4217 code'),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(EXPENSE_STATUSES),
  submittedAt: z.string().datetime({ offset: true }),
  internalNotes: z.string().nullable(),
  region: z.string().min(1),
  project: z.string().min(1),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
```

**Used by:**
- `ExpenseDetailCard` form (react-hook-form + @hookform/resolvers/zod)
- `MockExpenseRepository` (validates on writes via `validateAndParseExpense`)

### JSON Schema Validation

**Location:** `src/lib/expense-validation.ts` (Ajv validator)

**Functions:**
- `validateAndParseExpense(data)`: Validates and returns `Expense`, or throws with formatted errors
- `isValidExpense(data)`: Type guard, returns boolean

**Features:**
- Uses Ajv with JSON Schema Draft 2020-12
- Custom format validators: uuid, date, date-time
- Used by `MockExpenseRepository` to validate on mutations
- Separate from Zod for CLI/server-side validation scenarios

**Authoritative Source:**
- JSON Schema file: `src/schemas/expense.schema.json` (mirrored by Zod schema)

### Filter Utilities

**Location:** `src/lib/filterExpenses.ts`

```typescript
interface FilterCriteria {
  status?: ExpenseStatus[]
  submitterId?: string
  type?: ExpenseType[]
  dateRange?: { from: Date; to: Date }
}

function filterExpenses(expenses: Expense[], filters: FilterCriteria): Expense[]
```

**Filtering Logic:**
- AND operation: all criteria must match
- Date range: UTC day comparison (ignores time component)

---

## 7. Authentication & Context Management

### AuthContext

**Location:** `src/context/AuthContext.tsx`

**Features:**
- Mock authentication (frontend-only, hardcoded users from `src/mocks/users.json`)
- Session storage (`sessionStorage.getItem/setItem`)
- Storage key: `auth_user_session_data`

**Interface:**
```typescript
interface AuthContextType {
  user: User | null
  login(email: string, password: string): { success: boolean; error?: string; user?: User }
  logout(): void
}
```

**Login Logic:**
- Finds user by email (case-insensitive) + password (exact match)
- Returns error if no match
- Stores user (without password) in state and sessionStorage on success
- Restores user from sessionStorage on provider mount

### RepositoryContext

**Location:** `src/context/RepositoryContext.tsx`

**Architecture:**
- App-wide singleton `mockRepository` created on startup
- Context provides `ExpenseRepository` interface (supports dependency injection)
- Default: `mockRepository`, but tests can inject different implementation

**Singleton Creation:**
```typescript
export const mockRepository = new MockExpenseRepository(
  mockExpenses.map((e) => ({ ...e }))  // Copy preserves original mock data
)
```

**Hook:**
```typescript
export function useRepository(): ExpenseRepository {
  // Throws if used outside RepositoryProvider
}
```

---

## 8. Key Architectural Patterns

### Data-Access Boundary (Repository Pattern)
- `ExpenseRepository` interface decouples components from data source
- Allows swapping mock ↔ API implementation without component changes
- See ADR-0010 (repository pattern), ADR-0011 (extended interface)

### Role-Based Access Control
- `ProtectedRoute` component guards all role-specific routes
- Ownership checks in `ExpenseDetailPage` prevent cross-consultant access
- Returns 404 on mismatch to avoid information leakage (ADR-0012)

### Editable Status Rules (ADR-0013)
- Consultants can edit only in non-terminal statuses: 'Submitted', 'Changes Requested', 'Resubmitted'
- 'Approved' is terminal (never editable)
- Finance never edits (review workflow is separate)
- Auto-transition to 'Resubmitted' on edit

### Form Validation Strategy
- Zod schema for client-side react-hook-form validation
- JSON Schema (Ajv) for server/CLI validation
- Mirror Zod/JSON Schema to keep validation rules in sync

### Data Immutability
- `MockExpenseRepository` creates new objects on mutations
- Form values + expense ID passed to callbacks (not mutated in-place)

---

## 9. File Structure Reference

```
src/
├── main.tsx                          # App entry, provider stack
├── App.tsx                           # Router configuration
├── types.ts                          # User, Expense, Role types
├── index.css                         # Global Tailwind styles
├── pages/
│   ├── LoginPage.tsx
│   ├── ExpensesPage.tsx             # Consultant expense list
│   ├── ExpenseDetailPage.tsx        # Detail + review (role-dependent)
│   ├── ReviewPage.tsx               # Finance review list
│   └── NotFoundPage.tsx
├── components/
│   ├── ProtectedRoute.tsx           # RBAC guard
│   ├── Header.tsx
│   ├── PageTitle.tsx
│   ├── ExpenseTable.tsx
│   ├── FilterPanel.tsx
│   ├── expenses/
│   │   ├── ExpenseDetailCard.tsx    # Main detail form/display
│   │   ├── ExpenseReviewSection.tsx # Finance decision widget
│   │   └── ReviewDecisionForm.tsx
│   └── ui/                          # shadcn/ui components
├── context/
│   ├── AuthContext.tsx              # User authentication state
│   └── RepositoryContext.tsx        # Data-access boundary provider
├── lib/
│   ├── repositories/
│   │   ├── ExpenseRepository.ts     # Interface
│   │   └── MockExpenseRepository.ts # In-memory implementation
│   ├── expense-validation.ts        # Ajv JSON Schema validator
│   └── filterExpenses.ts            # Filter utility
├── schemas/
│   ├── expense.ts                   # Zod schema
│   └── expense.schema.json          # JSON Schema (source of truth)
└── mocks/
    ├── expenses.ts
    ├── users.json
    └── expenses.json
```

---

## 10. Key Takeaways for Future Development

1. **Repository Pattern**: Always use `useRepository()` hook, never import `MockExpenseRepository` directly in components
2. **Role-Based Views**: Use `user.role` to conditionally render; `ProtectedRoute` ensures auth at the route level
3. **Editing Logic**: Consultant edits auto-transition to 'Resubmitted'; Finance never edits; 'Approved' is terminal
4. **Validation**: Zod for client-side forms, JSON Schema for server/CLI; keep both in sync
5. **Data Immutability**: Always create new objects on mutations; the repository handles this
6. **Routing**: Use `roleHome(role)` utility for back navigation; preserve ownership checks in detail page
7. **Context API Pattern**: Both `AuthContext` and `RepositoryContext` follow the same provider + hook pattern
