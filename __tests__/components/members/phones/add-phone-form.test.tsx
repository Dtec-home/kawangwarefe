import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AddPhoneForm } from '@/components/members/phones/add-phone-form'

const ok = { success: true, message: 'ok', code: null }

describe('AddPhoneForm, self-service with a code (MP-2, P2)', () => {
  it('sends a code, then adds the number when the code is confirmed', async () => {
    const onRequest = vi.fn().mockResolvedValue(ok)
    const onConfirm = vi.fn().mockResolvedValue(ok)
    const onAdded = vi.fn()
    render(<AddPhoneForm mode="otp" onRequest={onRequest} onConfirm={onConfirm} onAdded={onAdded} />)

    fireEvent.change(screen.getByLabelText('New number'), { target: { value: '0733000002' } })
    fireEvent.change(screen.getByLabelText('Label (optional)'), { target: { value: 'Airtel' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(await screen.findByLabelText('Code sent to 0733000002')).toBeInTheDocument()
    expect(onRequest).toHaveBeenCalledWith('0733000002', 'Airtel')

    fireEvent.change(screen.getByLabelText('Code sent to 0733000002'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('0733000002', '123456', 'Airtel'))
    expect(onAdded).toHaveBeenCalledOnce()
  })

  it('shows why a number cannot be added, without asking for a code', async () => {
    const onRequest = vi.fn().mockResolvedValue({ success: false, code: 'PHONE_TAKEN', message: 'This number belongs to another member' })
    render(<AddPhoneForm mode="otp" onRequest={onRequest} onConfirm={vi.fn()} onAdded={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('New number'), { target: { value: '0733000002' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(await screen.findByText('This number belongs to another member')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Code sent to/)).not.toBeInTheDocument()
  })
})

describe('AddPhoneForm, admin (MP-2, P2/P3)', () => {
  it('adds directly, without a code', async () => {
    const onAdminAdd = vi.fn().mockResolvedValue(ok)
    const onAdded = vi.fn()
    render(<AddPhoneForm mode="admin" onAdminAdd={onAdminAdd} onAdded={onAdded} />)

    fireEvent.change(screen.getByLabelText('New number'), { target: { value: '0733000002' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add number' }))

    await waitFor(() => expect(onAdminAdd).toHaveBeenCalledWith('0733000002', ''))
    expect(onAdded).toHaveBeenCalledOnce()
  })

  it('names the owner of a taken number and offers to merge them', async () => {
    const onAdminAdd = vi.fn().mockResolvedValue({
      success: false, code: 'PHONE_TAKEN', message: 'This number belongs to John Otieno',
      conflictMemberId: '7', conflictMemberName: 'John Otieno',
    })
    render(<AddPhoneForm mode="admin" memberId="3" onAdminAdd={onAdminAdd} onAdded={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('New number'), { target: { value: '0733000002' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add number' }))

    const link = await screen.findByRole('link', { name: 'Merge with John Otieno' })
    expect(link).toHaveAttribute('href', '/admin/members/merge?survivor=3&duplicate=7')
  })
})
