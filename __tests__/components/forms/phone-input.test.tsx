/**
 * PhoneInput Component Tests
 *
 * FIRST: Independent — no external deps, renders with a minimal react-hook-form stub
 * ISTQB: Tests required vs optional label, error display, and +254 prefix
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhoneInput } from '@/components/forms/phone-input'
import { useForm } from 'react-hook-form'
import { FieldError } from 'react-hook-form'

/**
 * Minimal wrapper: react-hook-form must be used inside a FormProvider or
 * we build the register function manually via useForm.
 */
function PhoneInputWrapper({
  error,
  label,
  required = true,
}: {
  error?: FieldError
  label?: string
  required?: boolean
}) {
  const { register } = useForm()
  return (
    <PhoneInput
      name="phoneNumber"
      register={register}
      error={error}
      label={label}
      required={required}
    />
  )
}

describe('PhoneInput', () => {
  it('renders the default "Phone Number" label', () => {
    render(<PhoneInputWrapper />)
    expect(screen.getByText(/phone number/i)).toBeInTheDocument()
  })

  it('renders a custom label when provided', () => {
    render(<PhoneInputWrapper label="M-Pesa Number" />)
    expect(screen.getByText('M-Pesa Number')).toBeInTheDocument()
  })

  it('renders the +254 country prefix', () => {
    render(<PhoneInputWrapper />)
    expect(screen.getByText('+254')).toBeInTheDocument()
  })

  it('renders the required asterisk (*) when required=true', () => {
    render(<PhoneInputWrapper required={true} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does NOT render the asterisk when required=false', () => {
    render(<PhoneInputWrapper required={false} />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('renders a tel input with placeholder "797030300"', () => {
    render(<PhoneInputWrapper />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'tel')
    expect(input).toHaveAttribute('placeholder', '797030300')
  })

  it('renders an error message when error prop is provided', () => {
    const error: FieldError = { type: 'pattern', message: 'Please enter a valid 9-digit phone number' }
    render(<PhoneInputWrapper error={error} />)
    expect(screen.getByText('Please enter a valid 9-digit phone number')).toBeInTheDocument()
  })

  it('does NOT render an error paragraph when no error is given', () => {
    render(<PhoneInputWrapper />)
    expect(screen.queryByText(/please enter/i)).not.toBeInTheDocument()
  })

  it('renders the helper text for 9-digit format', () => {
    render(<PhoneInputWrapper />)
    expect(screen.getByText(/9-digit m-pesa number/i)).toBeInTheDocument()
  })

  it('the input has maxLength=9', () => {
    render(<PhoneInputWrapper />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('maxLength', '9')
  })
})
