import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EXPENSE_STATUSES,
  EXPENSE_TYPES,
  type ExpenseStatus,
  type ExpenseType,
} from '@/types'
import type { FilterCriteria } from '@/lib/filterExpenses'

const ALL_SUBMITTERS = 'all'
const ALL_SUBMITTERS_LABEL = 'All submitters'

const filterFormSchema = z
  .object({
    status: z.array(z.enum(EXPENSE_STATUSES)),
    submitterId: z.string(),
    type: z.array(z.enum(EXPENSE_TYPES)),
    dateFrom: z.string(),
    dateTo: z.string(),
  })
  .superRefine((values, ctx) => {
    if ((values.dateFrom === '') !== (values.dateTo === '')) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter both a from and a to date',
        path: [values.dateFrom === '' ? 'dateFrom' : 'dateTo'],
      })
    }
    if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
      ctx.addIssue({
        code: 'custom',
        message: 'From date must be on or before to date',
        path: ['dateTo'],
      })
    }
  })

type FilterFormValues = z.infer<typeof filterFormSchema>

interface FilterPanelProps {
  submitters: { id: string; name: string }[]
  onApply: (criteria: FilterCriteria) => void
  onClear: () => void
}

export default function FilterPanel({ submitters, onApply, onClear }: FilterPanelProps) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      status: [],
      submitterId: ALL_SUBMITTERS,
      type: [],
      dateFrom: '',
      dateTo: '',
    },
  })

  const statusValues = form.watch('status')
  const typeValues = form.watch('type')
  const submitterId = form.watch('submitterId')

  const submitterItems = [
    { value: ALL_SUBMITTERS, label: ALL_SUBMITTERS_LABEL },
    ...submitters.map((submitter) => ({ value: submitter.id, label: submitter.name })),
  ]

  function toggleStatus(value: ExpenseStatus, checked: boolean) {
    const current = form.getValues('status')
    form.setValue('status', checked ? [...current, value] : current.filter((s) => s !== value))
  }

  function toggleType(value: ExpenseType, checked: boolean) {
    const current = form.getValues('type')
    form.setValue('type', checked ? [...current, value] : current.filter((t) => t !== value))
  }

  function onSubmit(values: FilterFormValues) {
    const criteria: FilterCriteria = {}
    if (values.status.length > 0) {
      criteria.status = values.status
    }
    if (values.submitterId !== ALL_SUBMITTERS) {
      criteria.submitterId = values.submitterId
    }
    if (values.type.length > 0) {
      criteria.type = values.type
    }
    if (values.dateFrom && values.dateTo) {
      criteria.dateRange = {
        from: new Date(values.dateFrom),
        to: new Date(values.dateTo),
      }
    }
    onApply(criteria)
  }

  function handleClear() {
    form.reset()
    onClear()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {EXPENSE_STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2 whitespace-nowrap">
                  <Checkbox
                    aria-label={status}
                    checked={statusValues.includes(status)}
                    onCheckedChange={(checked) => toggleStatus(status, checked === true)}
                  />
                  <span className="text-sm">{status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Submitter</Label>
            <Select
              items={submitterItems}
              value={submitterId}
              onValueChange={(value) => form.setValue('submitterId', String(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBMITTERS}>{ALL_SUBMITTERS_LABEL}</SelectItem>
                {submitters.map((submitter) => (
                  <SelectItem key={submitter.id} value={submitter.id}>
                    {submitter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {EXPENSE_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2 whitespace-nowrap">
                  <Checkbox
                    aria-label={type}
                    checked={typeValues.includes(type)}
                    onCheckedChange={(checked) => toggleType(type, checked === true)}
                  />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Date range</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="dateFrom"
                type="date"
                aria-label="From date"
                {...form.register('dateFrom')}
                aria-invalid={!!form.formState.errors.dateFrom}
              />
              <Input
                id="dateTo"
                type="date"
                aria-label="To date"
                {...form.register('dateTo')}
                aria-invalid={!!form.formState.errors.dateTo}
              />
            </div>
            {(form.formState.errors.dateFrom || form.formState.errors.dateTo) && (
              <p className="text-xs text-destructive">
                {form.formState.errors.dateFrom?.message ?? form.formState.errors.dateTo?.message}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit">Apply Filters</Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear Filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
