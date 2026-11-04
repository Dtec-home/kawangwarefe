import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { PayerRecordOffer } from '@/components/members/payer-record-offer'

const record = { memberId: '42', payerName: 'RUTH', giftCount: 12, giftTotal: '4500.00', lastGiftAt: null }

describe('PayerRecordOffer (MP-0)', () => {
  it('says the number already gave by Pay Bill, under which name, how often and how much', () => {
    render(<PayerRecordOffer record={record} phone="0712345678" memberName="Ruth Achieng" onUse={vi.fn()} onBack={vi.fn()} />)

    expect(screen.getByText(/0712345678 has already given KES 4,500 in 12 Pay Bill payments as/)).toBeInTheDocument()
    expect(screen.getByText('RUTH')).toBeInTheDocument()
    expect(screen.getByText(/Ruth Achieng will keep those gifts/)).toBeInTheDocument()
  })

  it('uses the singular for one payment', () => {
    render(<PayerRecordOffer record={{ ...record, giftCount: 1, giftTotal: '500.00' }} phone="0712345678" memberName="Ruth Achieng" onUse={vi.fn()} onBack={vi.fn()} />)

    expect(screen.getByText(/KES 500 in 1 Pay Bill payment as/)).toBeInTheDocument()
  })

  it('confirms or goes back', () => {
    const onUse = vi.fn()
    const onBack = vi.fn()
    render(<PayerRecordOffer record={record} phone="0712345678" memberName="Ruth Achieng" onUse={onUse} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: 'Use this record' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(onUse).toHaveBeenCalledOnce()
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('disables the confirm button while saving', () => {
    render(<PayerRecordOffer record={record} phone="0712345678" memberName="Ruth Achieng" onUse={vi.fn()} onBack={vi.fn()} saving />)

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
})
