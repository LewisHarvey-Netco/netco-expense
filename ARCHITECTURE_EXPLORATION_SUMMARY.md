# Netco Expense: Architecture & Implementation Patterns

**Date:** September 22, 2026  
**Purpose:** Comprehensive guide to existing patterns for breaking PRD into tickets.

---

## 1. Project Structure

### Directory Layout
```
src/
├── pages/                  # Route-level components (LoginPage, ExpensesPage, ReviewPage, ExpenseDetailPage)
├── components/
│   ├── expenses/          # Expense-domain components (ExpenseDetailCard, ExpenseReviewSection)
│   ├── ui/                # shadcn/ui generated primitives (vendored, not external package)
│   ├── Header.tsx         # App-wide header
│   ├── ProtectedRoute.tsx # Route guard component
│   ├── FilterPanel.tsx    # Expense list filtering UI
│   ├── ExpenseTable.tsx   # Expense list table
│   ├── ReviewDecisionForm.tsx  # Finance decision form
│   └── ...other shared components
├── context/               # React Context providers
│   ├── AuthContext.tsx    # Auth state + login
│   ├── RepositoryContext.tsx # Expense repository distribution
│   └── ...test files
├── lib/
│   ├── repositories/
│   │   ├── ExpenseRepository.ts # Interface (contract)
│   │   ├── MockExpenseRepository.ts # In-memory mock implementation
│   │   └── MockExpenseRepository.test.ts
│   ├── expense-validation.ts # AJV-based JSON Schema validation
│   ├── filterExpenses.ts  # Pure filter function
│   └── ...utilities
├── schemas/
│   ├── expense.schema.json # Authoritative JSON Schema (source of truth)
│   └── expense.ts         # Zod schema (mirrors JSON Schema for forms)
├── mocks/
│   ├── users.json         # Mock credentials (frontend auth only)
│   └── expenses.ts/.json  # Mock expense data
├── types.ts               # TypeScript interfaces (Expense, User, Role, etc.)
└── main.tsx               # Provider composition root
```

### Test Files (Collocated)
- **Vitest + RTL:** `.test.tsx` files in same directory as component
- **Storybook:** `.stories.tsx` files alongside components (visual testing)
- **E2E (Playwright):** `e2e/**/*.spec.ts` (full-browser workflows)

---

## 2. Existing Expense-Related Components

### **ExpenseDetailCard** (`src/components/expenses/ExpenseDetailCard.tsx`)
- **Purpose:** Renders full expense detail (all 11 fields)
- **Fields rendered:**
  - Amount, Currency (editable when `isEditable=true`)
  - Type, Receipt date, Region, Project, Description (editable)
  - Status (display only, as badge)
  - Submission date, Submitter, Internal notes (all display-only)
  - Receipt placeholder (display-only, no upload yet)
- **Form handling:**
  - Uses `react-hook-form` + `zodResolver(expenseSchema)` 
  - Validates on blur, shows inline field errors
  - Form disabled unless `isEditable` prop is true
- **Resubmit workflow:**
  - If `isEditable && onResubmit` provided, shows "Resubmit" button
  - Calls `onResubmit(updatedExpense)` with form values + id
  - Card owns submission feedback (loading/success/error states)
  - Success message auto-dismisses after 3s, shows "Back to Expenses" link
  - Error surfaces as inline alert, keeps button enabled for retry
- **Props:**
  - `expense: Expense` — data to display
  - `role?: Role` — user's role (mostly structural, stored for future use)
  - `isEditable?: boolean` — enables form fields
  - `onResubmit?: (updatedExpense: Expense) => Promise<void>` — mutation callback
- **Test patterns:** Renders all fields, validates form state, tests resubmit feedback

### **ExpenseReviewSection** (`src/components/expenses/ExpenseReviewSection.tsx`)
- **Purpose:** Finance-only review workflow UI
- **Contains:** `ReviewDecisionForm` + status message
- **Logic:**
  - Form enabled only when expense is in `DECIDABLE_STATUSES` (`Submitted`, `Resubmitted`)
  - Shows status message (Approved = terminal, Changes Requested = awaiting resubmit)
  - Message slot always reserved (no layout shift when decision recorded)
- **Props:**
  - `expense: Expense`
  - `disabled?: boolean` — additional disable (e.g., while submitting)
  - `onSubmit(decision, comment?)` — called with approve/request-changes + optional comment
- **No direct mutations:** Calls parent's handler; parent performs repo update

### **ReviewDecisionForm** (`src/components/ReviewDecisionForm.tsx`)
- **Purpose:** Two-button decision form (Approve / Request Changes)
- **Form validation:**
  - Decision is required
  - Comment field required only if "Request Changes" selected
  - Uses `zod` superRefine for conditional validation
- **Props:**
  - `onSubmit(decision, comment?)` — callback with form values
  - `disabled?: boolean` — disables all controls
- **Pattern:** No direct mutations; passes decision to parent

---

## 3. Repository Pattern Implementation

### **ExpenseRepository Interface** (`src/lib/repositories/ExpenseRepository.ts`)
```typescript
export interface ExpenseRepository {
  getExpense(id: string): Promise<Expense | null>
  getExpenses(): Promise<Expense[]>
  getExpensesBySubmitter(submitterId: string): Promise<Expense[]>
  updateExpenseStatus(id: string, status: ExpenseStatus, comment?: string): Promise<Expense>
  updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense>
}
```

**Key design:**
- All methods return `Promise` so call sites shaped for real API
- Interface-based: swappable mock ↔ real API without component changes
- `getExpensesBySubmitter()` enforces consultant data boundary (scoped reads)

### **MockExpenseRepository** (`src/lib/repositories/MockExpenseRepository.ts`)
- **Storage:** In-memory `Map<string, Expense>`
- **Initialization:** Takes copy of mock expenses (preserves original data)
- **Read operations:**
  - Validate each expense before returning (filter invalid data)
  - Log warning if invalid (mimics API behavior)
  - Returns empty array if all filtered out
- **Write operations (mutations):**
  - `updateExpenseStatus(id, status, comment?)` — changes status, adds internal note
  - `updateExpense(id, updates)` — merges partial updates, auto-transitions to `Resubmitted`, rejects `Approved` edits
  - Both validate merged object via `validateAndParseExpense()` before persisting
  - Both return new object (never mutate in place)
  - Both throw on missing expense (caller must handle)
- **Utility:** `reset(initialExpenses)` — clear and reseed (used by tests)

**Validation boundaries:**
- **On read:** Filters invalid; logs warning
- **On write:** Validates before persist; throws on invalid

### **RepositoryContext** (`src/context/RepositoryContext.tsx`)
- **Provides:** Single `mockRepository` singleton to entire app
- **Creation:**
  ```typescript
  export const mockRepository = new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))
  ```
  - Copy ensures in-memory mutations don't touch original mock module
- **Hook:** `useRepository(): ExpenseRepository`
- **Injection in tests:** Pass different repo to `RepositoryProvider` (e.g., spy, isolated data)

**Data flow:**
- Page/component calls `repo.updateExpense(id, values)` → returns updated `Expense`
- Component stores result in local state → re-renders with new data
- On list navigation back, list refetches from repo (gets latest state including mutations)

---

## 4. Authentication & Routing Patterns

### **AuthContext** (`src/context/AuthContext.tsx`)
- **State:** `user: User | null` (logged-in user or null)
- **Persistence:** `sessionStorage` (key: `netco-expense-auth`)
- **On mount:** Hydrates user from `sessionStorage` if present (survives page refresh)
- **Login flow:**
  - Validates credentials against `mocks/users.json` (case-insensitive email, exact password)
  - On match: stores user (without password) to React state + sessionStorage
  - Returns `{ success, error?, user? }`
  - Generic error message ("Invalid email or password") — no email/password validation leakage
- **Logout:** Clears both React state + sessionStorage
- **Hook:** `useAuth()` — throws if called outside provider (fail-fast)

**Important:** Mock authentication only — real backend auth planned (TODO.md, Blocking).

### **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
- **Guard logic:**
  1. No user → redirect to `/login`
  2. User exists but role not in `allowedRoles` → redirect to user's role home (not login)
  3. Otherwise render children
- **Single reusable component:** All routes use this, no per-page auth checks
- **Used as:**
  ```tsx
  <Route path="/expenses" element={<ProtectedRoute allowedRoles={['consultant']}><ExpensesPage /></ProtectedRoute>} />
  ```

### **Routing** (`src/App.tsx`)
- **Routes:**
  - `/login` → LoginPage (public)
  - `/expenses` → ExpensesPage (consultant only)
  - `/expenses/:id` → ExpenseDetailPage (consultant only, role-aware)
  - `/review` → ReviewPage (finance only)
  - `/review/:id` → ExpenseDetailPage (finance only, role-aware)
  - `/` → RootRedirect (logs in → role home, else → login)
  - `*` → NotFoundPage (404, not silent redirect)
- **ExpenseDetailPage is role-aware:** Single component serves both `/expenses/:id` and `/review/:id`
  - Reads role via `useAuth()`
  - Finance sees review section + read-only card
  - Consultant sees read-only (or editable if status permits) card + back link
  - Ownership check: consultant must match `submitterId` (404 on mismatch, same as unknown ID)

---

## 5. Test Structure & Patterns

### **Vitest + React Testing Library** (`.test.tsx` files)
- **Setup:** `src/setupTests.ts` imports `@testing-library/jest-dom`
- **Test helpers:** Shared `renderApp()` / `renderAppAt(path)` wrappers
  - Wrap `<MemoryRouter>` + `<RepositoryProvider>` + `<AuthProvider>` around `<App>`
  - Create fresh `MockExpenseRepository` per test
- **Patterns:**
  - **Integration-style:** Render real App tree, drive via user events (typing, clicking)
  - **No component unit tests:** Coverage via integration tests
  - **State seeding:** `seedSession(user)` to pre-populate sessionStorage
  - **Location capture:** Wrap app in `<LocationCapture>` component to read `useLocation()` and assert final route
- **Example test:**
  ```typescript
  it('logs in as finance and lands on /review', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText(/email/i), 'bob@netcompany.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(testLocation).toBe('/review')
    })
  })
  ```

### **Storybook** (`.stories.tsx` files)
- **Purpose:** Visual component development + manual testing
- **Pattern:** `.stories.tsx` alongside component
- **Renders:** Component in isolation with different prop combinations
- **Note:** First-run "Failed to fetch dynamically imported module" errors are Vite optimization race; re-run or clear `node_modules/.cache/storybook`

### **Playwright E2E** (`e2e/**/*.spec.ts`)
- **Scope:** Full-browser workflows through real dev server
- **Helpers:** `e2e/helpers.ts`
  - `loginAs(page, email)` — full page navigation (re-seeds mock repo)
  - `loginAsSpa(page, email)` — SPA login (preserves in-memory state)
  - `expectDetailPageLoaded(page)` — waits for detail card to render (prevents stale list assertions)
  - `statusBadge(page, status)` — scoped badge locator (avoids ambiguity with labels)
- **Coverage:**
  - **Finance workflow:** login → All Expenses → filter → view detail → approve/request changes → verify status
  - **Consultant workflow:** login → own-expenses list → view detail → ownership boundary (404)
  - **Consultant editing:** resubmit Submitted → Resubmitted, address feedback, edit before re-review, Approved immutability, error recovery
- **Test data:** Mock expenses in `src/mocks/expenses.json`; each full-page load re-seeds from JSON
- **Important:** `toHaveTextContent()` removed in Playwright 1.62+; use `toHaveText()` (exact) or `toContainText()` (substring)

---

## 6. Form Building Patterns

### **Stack:** react-hook-form + zod + shadcn

### **Three forms in the app:**

#### **1. LoginPage** (`src/pages/LoginPage.tsx`)
- **Schema:**
  ```typescript
  const loginSchema = z.object({
    email: z.string().email('Invalid email or password'),
    password: z.string().min(1, 'Invalid email or password'),
  })
  ```
- **Form setup:**
  ```typescript
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  ```
- **Fields:** `register()` on input elements
- **Error display:** Generic message hides whether email is malformed or credential mismatch
- **Submission:**
  - Calls `AuthContext.login()`
  - Failure → displays Alert alert (field-level errors from zod, credential failure as Alert)
  - Success → navigates to role home

#### **2. ReviewDecisionForm** (`src/components/ReviewDecisionForm.tsx`)
- **Schema:**
  ```typescript
  const decisionFormSchema = z
    .object({
      decision: z.enum(['approve', 'request-changes']),
      comment: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.decision === 'request-changes' && values.comment.trim() === '') {
        ctx.addIssue({ code: 'custom', message: '...', path: ['comment'] })
      }
    })
  ```
- **Custom validation:** Conditional comment requirement via `superRefine`
- **UI:** Two buttons (toggle-style), comment textarea appears only if "Request Changes" selected
- **Submission:** Calls parent's `onSubmit(decision, comment?)`

#### **3. ExpenseDetailCard** (`src/components/expenses/ExpenseDetailCard.tsx`)
- **Schema:** `expenseSchema` from `src/schemas/expense.ts` (shared Zod schema)
  ```typescript
  export const expenseSchema = z.object({
    id: z.string().uuid(),
    submitterId: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(EXPENSE_TYPES),
    amount: z.number().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(EXPENSE_STATUSES),
    submittedAt: z.string().datetime({ offset: true }),
    internalNotes: z.string().nullable(),
    region: z.string().min(1),
    project: z.string().min(1),
  })
  export type ExpenseFormValues = z.infer<typeof expenseSchema>
  ```
- **Form setup:**
  ```typescript
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    mode: 'onBlur',
    defaultValues: expense,
  })
  ```
- **Validation:** On blur (not on change)
- **Fields:**
  - Editable fields use `<Controller>` for custom inputs (number field, select, textarea)
  - Display-only fields are plain `<div>` + formatted values
- **Resubmit submission:**
  - Form validation passes → calls `onResubmit({ ...formValues, id: expense.id })`
  - Parent performs `repo.updateExpense()` mutation
  - Card manages submission feedback (loading/success/error)
- **Effect pattern:** Resets form when expense prop changes (keeps synced if expense re-fetched)

### **Form patterns summary:**
- **Schema first:** Define Zod schema → derive FormValues type → pass to useForm
- **Validation:** On blur (or custom mode)
- **Errors:** Inline under each field, scoped `<p>` with `text-destructive`
- **Submission:** Never mutate directly; call context/parent handler; parent does mutation
- **Feedback:** Loading state on button, error/success messages in Alert or inline

---

## 7. Data Model & Validation

### **Expense Data Model**
- **Source of truth:** `src/schemas/expense.schema.json` (JSON Schema Draft 2020-12)
- **TypeScript interfaces:** `src/types.ts` (derived from schema)
  ```typescript
  export interface Expense {
    id: string
    submitterId: string
    description: string
    type: ExpenseType  // Breakfast | Lunch | Dinner | Transport | Accommodation
    amount: number
    currency: string   // 3-letter ISO 4217
    receiptDate: string  // YYYY-MM-DD
    status: ExpenseStatus  // Submitted | Approved | Changes Requested | Resubmitted
    submittedAt: string  // ISO 8601 datetime
    internalNotes: string | null
    region: string
    project: string
  }
  ```
- **Zod schema:** `src/schemas/expense.ts` (mirrors JSON Schema for react-hook-form)

### **Validation Strategy**
- **On read:** No validation; accept invalid data (mirrors backend scenarios)
  - Components use defensive checks + error boundaries
  - Invalid expenses filtered out when loading (logged as warning)
- **On write:** Validate before persist
  - `validateAndParseExpense(data)` — validates via AJV, returns typed Expense or throws
  - `isValidExpense(data)` — type guard (no throw)
  - Used by `MockExpenseRepository.updateExpenseStatus()` and `updateExpense()`
- **Runtime validator:** `src/lib/expense-validation.ts` using AJV

---

## 8. State Management

### **No external library** (Redux, Zustand, React Query, etc.)
- **Local component state** (`useState`) — ephemeral page-level concerns (filters, error messages, form state)
- **AuthContext** — one cross-cutting piece of state (logged-in user)
- **RepositoryContext** — NOT state; distributes service object (repository singleton)

### **In-memory filtering:**
- Pure function `filterExpenses()` returns new filtered array
- Full dataset stays in component state
- Clearing filters resets criteria, not data

### **Why plain Context is sufficient:**
- App is small; no shared expense list consumed by multiple pages
- If more cross-cutting state added, re-evaluate before adding another provider

---

## 9. Architectural Boundaries & Principles

### **One owner per concern:**
- **Auth:** `AuthContext` only (no component reads sessionStorage directly)
- **Route access:** `ProtectedRoute` only (no per-page redirect logic)
- **Role-aware rendering:** Page level (guard decides who enters, page decides what they see)

### **Consultant data boundary:**
- Repository layer: `getExpensesBySubmitter(userId)` returns only matching expenses
- Page layer: Detail page checks ownership on load (404 on mismatch)
- Boundary is UX only; real auth enforcement must be server-side post-backend

### **No premature abstraction:**
- No service layer, feature folders, or state management lib yet (code is small)
- Introduce deliberately with documented reason (ADR)

### **Mock data is temporary:**
- Anything reading `src/mocks/` will be replaced when backend exists
- Tracked in TODO.md (Blocking Go-Live tier)

### **Mutations through repository:**
- Components never mutate data directly
- All writes flow through repository → return new object → component stores result

### **Status workflow is state machine:**
- Four statuses with defined transitions (see ADR-0007)
- `Submitted` ↔ `Resubmitted` (consultant edits)
- Approve → `Approved` (terminal)
- Request changes → `Changes Requested` (awaiting resubmit)

---

## 10. Key Files for Reference

### **Architecture Docs**
- `docs/architecture.md` — comprehensive (start here)
- `docs/decisions/architecture/` — individual ADRs (rationale for patterns)
- Notable ADRs:
  - ADR-0010: Mock Repository Pattern
  - ADR-0011: Expense List Reads via Repository
  - ADR-0012: Role-aware Expense Detail Page
  - ADR-0013: Consultant Editing (Resubmit workflow)
  - ADR-0014: Resubmit Form Submission & Feedback

### **Configuration**
- `vite.config.ts` — dev server, `@` alias
- `vitest.config.ts` — test runner (jsdom, globals)
- `tsconfig.app.json` — TypeScript for app source
- `.oxlintrc.json` — linter rules
- `components.json` — shadcn/ui CLI config (New York style, lucide icons)
- `playwright.config.ts` — E2E runner

### **Type Definitions**
- `src/types.ts` — Role, User, Expense, ExpenseStatus, ExpenseType, roleHome()
- `src/schemas/expense.ts` — expenseSchema, ExpenseFormValues

### **Testing Setup**
- `src/setupTests.ts` — jest-dom matchers
- `src/App.test.tsx` — integration test template
- `e2e/helpers.ts` — E2E test utilities

---

## 11. Design Guidelines

See `DESIGN-GUIDELINES.md`:
- **Colors:** Only defined Netcompany palette (green variants, dark-green, white, coral)
- **Coral:** Max one per page (accent only)
- **Typography:** Studio 6 fallback Arial, Regular default, Demibold/Bold for hierarchy
- **Style:** Clean, technical, restrained (no gradients, heavy shadows)

### **CSS variables (use, don't hardcode):**
- `--primary`, `--foreground`, etc. (defined in `index.css`)

### **shadcn components:**
- Add new ones via `npx shadcn@latest add <name>`
- Extend variants in component's `cva` config if needed
- Don't hand-edit primitives beyond variant configs

---

## 12. Commands & Dev Workflow

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript check + production build
npm run lint         # Run oxlint
npm run test         # Vitest + RTL (unit/integration)
npm run test:ui      # Vitest UI dashboard
npm run storybook    # Visual component development
npm run test:e2e     # Playwright E2E (headless)
npm run test:e2e:headed  # Playwright E2E (visible browser)
npm run preview      # Preview production build
```

**E2E debugging:**
```powershell
$env:PLAYWRIGHT_SLOW_MO=800; npm run test:e2e:headed
```
(PowerShell: slows operations to 800ms for visual inspection)

---

## 13. Summary: Key Takeaways for PRD Breakdown

### **Know before writing tickets:**

1. **Repository pattern shields components from data source.**
   - Interface → Mock today → API tomorrow.
   - Mutations return new objects; components store results locally.

2. **ExpenseDetailCard is highly reusable.**
   - Shared between consultant (with edit capability) and finance (read-only) views.
   - Props control editability + callback behavior.
   - Form validation & feedback handled internally.

3. **Three-layer testing is the pattern.**
   - Integration (Vitest RTL): App tree, user events, route assertions.
   - Visual (Storybook): Component props combinations.
   - E2E (Playwright): Full-browser workflows.

4. **Forms are schema-first.**
   - Zod schema → type → useForm + zodResolver.
   - Validation on blur (customizable).
   - Errors inline; submission through context/parent.

5. **No premature abstraction.**
   - No Redux, Zustand, service layer, or feature folders yet.
   - Add deliberately when actual complexity warrants.

6. **Consultant data boundary spans layers.**
   - Repository enforces scoped reads (`getExpensesBySubmitter`).
   - Page enforces ownership on detail load (404 on mismatch).
   - UX boundary only; real auth server-side post-backend.

7. **Status workflow is a state machine.**
   - Four states with defined transitions.
   - `Submitted` ↔ `Resubmitted` (editable by consultant).
   - `Approved` is terminal (read-only).

8. **Mock data is placeholder.**
   - Anything touching `src/mocks/` will be replaced by backend auth + API.
   - Tracked as Blocking Go-Live in TODO.md.

---

## 14. Windows Development Notes

From AGENTS.md:
- Use **Read** and **Glob** tools instead of PowerShell cmdlets (`Get-ChildItem`, `Test-Path`, etc.)
- Use **Grep** for content search (not PowerShell `grep`)
- Avoid pipes, redirections in commands; use Grep for filtering output
- Example: Instead of `npm run test -- file.tsx | head -30`, run the command alone and use Grep on the output file
