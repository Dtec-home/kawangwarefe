import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

import { PhoneList } from '@/components/members/phones/phone-list'

const phones = [
  { id: '1', phoneNumber: '254711000001', label: '', isPrimary: true, verified: true, source: 'registration', createdAt: '2026-01-01T00:00:00Z' },
  { id: '2', phoneNumber: '254733000002', label: 'Airtel', isPrimary: false, verified: true, source: 'otp', createdAt: '2026-11-01T00:00:00Z' },
  { id: '3', phoneNumber: null, label: '', isPrimary: false, verified: true, source: 'c2b', createdAt: '2026-11-02T00:00:00Z' },
]

describe('PhoneList (MP-2)', () => {
  it('lists every number, primary first, readable', () => {
    render(<PhoneList phones={phones} onMakePrimary={vi.fn()} onRemove={vi.fn()} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('0711 000 001')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Primary')).toBeInTheDocument()
    expect(within(rows[1]).getByText('0733 000 002')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Airtel')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Pay Bill number (hidden)')).toBeInTheDocument()
  })

  it('offers make-primary and remove on second lines only, and never make-primary for a hidden number', () => {
    const onMakePrimary = vi.fn()
    const onRemove = vi.fn()
    render(<PhoneList phones={phones} onMakePrimary={onMakePrimary} onRemove={onRemove} />)
    const rows = screen.getAllByRole('listitem')

    expect(within(rows[0]).queryByRole('button')).not.toBeInTheDocument()
    fireEvent.click(within(rows[1]).getByRole('button', { name: 'Make 0733 000 002 primary' }))
    fireEvent.click(within(rows[1]).getByRole('button', { name: 'Remove 0733 000 002' }))
    expect(within(rows[2]).queryByRole('button', { name: /primary/ })).not.toBeInTheDocument()
    fireEvent.click(within(rows[2]).getByRole('button', { name: 'Remove Pay Bill number (hidden)' }))

    expect(onMakePrimary).toHaveBeenCalledWith('2')
    expect(onRemove.mock.calls).toEqual([['2'], ['3']])
  })

  it('shows nothing to do while read-only', () => {
    render(<PhoneList phones={phones} readOnly />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
