/**
 * Form primitives tests.
 *
 * Exercises the shadcn/react-hook-form bridge end-to-end through a real
 * useForm harness so FormField/FormItem/FormLabel/FormControl/FormDescription/
 * FormMessage and the useFormField context all run against genuine form state.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

function Harness({
  withError = false,
  message,
}: {
  withError?: boolean
  message?: string
}) {
  const methods = useForm<{ name: string }>({ defaultValues: { name: '' } })

  return (
    <Form {...methods}>
      <form>
        <FormField
          control={methods.control}
          name="name"
          rules={withError ? { required: 'Name is required' } : undefined}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="type here" {...field} />
              </FormControl>
              <FormDescription>Your legal name.</FormDescription>
              <FormMessage>{message}</FormMessage>
            </FormItem>
          )}
        />
        <button
          type="button"
          onClick={() => methods.trigger('name')}
        >
          validate
        </button>
      </form>
    </Form>
  )
}

describe('Form primitives', () => {
  it('renders label, control, and description wired by id', () => {
    const { container } = render(<Harness />)

    const label = screen.getByText('Full name')
    const control = container.querySelector(
      '[data-slot="form-control"]'
    ) as HTMLElement

    // FormLabel htmlFor matches FormControl id (the generated formItemId).
    expect(label.getAttribute('for')).toBe(control.getAttribute('id'))
    expect(label.getAttribute('for')).toMatch(/-form-item$/)
    expect(control).toHaveAttribute('aria-invalid', 'false')
    expect(control.getAttribute('aria-describedby')).toContain(
      '-form-item-description'
    )
    expect(screen.getByText('Your legal name.')).toBeInTheDocument()
  })

  it('renders a static FormMessage child when no validation error', () => {
    render(<Harness message="hint text" />)
    expect(screen.getByText('hint text')).toBeInTheDocument()
  })

  it('renders nothing for an empty FormMessage with no error', () => {
    render(<Harness />)
    expect(document.querySelector('[data-slot="form-message"]')).toBeNull()
  })

  it('surfaces the validation error message and marks the control invalid', async () => {
    const { container } = render(<Harness withError />)
    fireEvent.click(screen.getByText('validate'))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    const control = container.querySelector(
      '[data-slot="form-control"]'
    ) as HTMLElement
    expect(control).toHaveAttribute('aria-invalid', 'true')
    // On error the control points at both the description and message ids.
    expect(control.getAttribute('aria-describedby')).toContain(
      '-form-item-message'
    )
    // FormLabel flags the error via data-error.
    expect(screen.getByText('Full name')).toHaveAttribute('data-error', 'true')
  })
})

describe('useFormField', () => {
  it('throws when used outside a FormField', () => {
    // No FormFieldContext / FormProvider in scope -> useFormContext returns null,
    // which the hook dereferences and throws on.
    expect(() => renderHook(() => useFormField())).toThrow()
  })
})
