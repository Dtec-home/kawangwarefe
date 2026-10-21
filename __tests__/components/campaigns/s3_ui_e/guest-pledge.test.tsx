import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { GuestPledgeCodeStep } from '@/components/pledges/public/guest-pledge-code-step'
import { displayPhone } from '@/components/pledges/public/guest-pledge-flow'

describe('displayPhone', () => {
  it('formats a Kenyan number for the code step', () => {
    expect(displayPhone('712345678')).toBe('+254 712 345 678')
    expect(displayPhone('0112345678')).toBe('+254 112 345 678')
    expect(displayPhone('123')).toBe('123')
  })
})

describe('GuestPledgeCodeStep', () => {
  const props = {
    phoneLabel: '+254 712 345 678',
    notice: null,
    error: null,
    confirming: false,
    resending: false,
    onConfirm: vi.fn(),
    onResend: vi.fn(),
    onChangeDetails: vi.fn(),
  }

  it('says where the code went when the server gave no message', () => {
    render(<GuestPledgeCodeStep {...props} />)
    expect(screen.getByText('We sent a 6-digit code to +254 712 345 678.')).toBeInTheDocument()
  })

  it('needs all six digits and keeps only digits', () => {
    const onConfirm = vi.fn()
    render(<GuestPledgeCodeStep {...props} onConfirm={onConfirm} />)
    const input = screen.getByLabelText('6-digit code') as HTMLInputElement
    fireEvent.change(input, { target: { value: '12a3' } })
    expect(input.value).toBe('123')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm pledge' }))
    expect(screen.getByText('Enter the 6-digit code')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '1234567' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm pledge' }))
    expect(onConfirm).toHaveBeenCalledWith('123456')
  })

  it('disables the actions while a new code is on its way', () => {
    render(<GuestPledgeCodeStep {...props} resending />)
    expect(screen.getByRole('button', { name: 'Confirm pledge' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Change details' })).toBeDisabled()
  })
})
