import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AmountInput } from '@/components/forms/amount-input'
import { useForm } from 'react-hook-form'

function AmountInputWrapper({ label, required, min, error }: any) {
  const { register } = useForm()
  return <AmountInput name="amount" register={register} label={label} required={required} min={min} error={error} />
}

describe('AmountInput', () => {
  it('renders with default label "Amount"', () => {
    render(<AmountInputWrapper />)
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('shows KES prefix', () => {
    render(<AmountInputWrapper />)
    expect(screen.getByText('KES')).toBeInTheDocument()
  })

  it('shows required asterisk by default', () => {
    render(<AmountInputWrapper required={true} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('hides asterisk when not required', () => {
    render(<AmountInputWrapper required={false} />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows minimum amount text', () => {
    render(<AmountInputWrapper min={10} />)
    expect(screen.getByText('Minimum amount: KES 10')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<AmountInputWrapper error={{ type: 'min', message: 'Amount too low' }} />)
    expect(screen.getByText('Amount too low')).toBeInTheDocument()
  })

  it('renders a number input', () => {
    render(<AmountInputWrapper />)
    const input = screen.getByPlaceholderText('500')
    expect(input).toHaveAttribute('type', 'number')
  })
})
