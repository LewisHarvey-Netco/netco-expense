import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ReviewDecision = 'approve' | 'request-changes'

const decisionFormSchema = z
  .object({
    decision: z.enum(['approve', 'request-changes'], 'Select a decision'),
    comment: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.decision === 'request-changes' && values.comment.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Comment is required when requesting changes',
        path: ['comment'],
      })
    }
  })

type DecisionFormValues = z.infer<typeof decisionFormSchema>

interface ReviewDecisionFormProps {
  onSubmit: (decision: ReviewDecision, comment?: string) => void
  /** Disables all controls; used when no decision can be recorded for the expense. */
  disabled?: boolean
}

export default function ReviewDecisionForm({ onSubmit, disabled = false }: ReviewDecisionFormProps) {
  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: {
      comment: '',
    },
  })

  const decision = form.watch('decision')

  function selectDecision(value: ReviewDecision) {
    if (disabled) return
    form.setValue('decision', value, { shouldValidate: true })
  }

  function handleSubmit(values: DecisionFormValues) {
    if (values.decision === 'request-changes') {
      onSubmit('request-changes', values.comment.trim())
    } else {
      onSubmit('approve')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Decision</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={decision === 'approve' ? 'default' : 'outline'}
            aria-pressed={decision === 'approve'}
            disabled={disabled}
            onClick={() => selectDecision('approve')}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant={decision === 'request-changes' ? 'secondary' : 'outline'}
            aria-pressed={decision === 'request-changes'}
            disabled={disabled}
            onClick={() => selectDecision('request-changes')}
          >
            Request Changes
          </Button>
        </div>
        <p className="min-h-4 text-xs text-destructive">
          {form.formState.errors.decision?.message}
        </p>
      </div>

      {decision === 'request-changes' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="review-decision-comment">Comment</Label>
          <Textarea
            id="review-decision-comment"
            placeholder="Explain what changes are needed"
            disabled={disabled}
            {...form.register('comment')}
            aria-invalid={!!form.formState.errors.comment}
          />
          <p className="min-h-4 text-xs text-destructive">
            {form.formState.errors.comment?.message}
          </p>
        </div>
      )}

      <Button type="submit" disabled={disabled}>
        Submit Decision
      </Button>
    </form>
  )
}
