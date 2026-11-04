/**
 * MemberPhonesPanel (MP-2): loads a member's numbers and runs the changes,
 * through Apollo's MockedProvider (the real documents, the real component).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from 'sonner'
import { MemberPhonesPanel } from '@/components/members/phones/member-phones-panel'
import {
  ADMIN_ADD_MEMBER_PHONE, MEMBER_PHONES, REQUEST_ADD_PHONE, SET_PRIMARY_PHONE,
} from '@/lib/graphql/member-phones'

const primary = { __typename: 'MemberPhoneType', id: '1', phoneNumber: '254711000001', label: '', isPrimary: true, verified: true, source: 'registration', createdAt: '2026-01-01T00:00:00Z' }
const second = { __typename: 'MemberPhoneType', id: '2', phoneNumber: '254733000002', label: 'Airtel', isPrimary: false, verified: true, source: 'admin', createdAt: '2026-11-01T00:00:00Z' }

function loaded(phones: unknown[]) {
  return { request: { query: MEMBER_PHONES, variables: { memberId: '3' } }, result: { data: { memberPhones: phones } } }
}

function answer(field: string, extra: Record<string, unknown>) {
  return {
    data: {
      [field]: {
        __typename: 'PhoneResponse', success: true, message: 'Done', code: null,
        conflictMemberId: null, conflictMemberName: null,
        member: { __typename: 'MemberType', id: '3', phoneNumber: '254711000001', phones: [primary, second] },
        ...extra,
      },
    },
  }
}

describe('MemberPhonesPanel (MP-2)', () => {
  it('shows the numbers and lets an admin add one without a code', async () => {
    const mocks = [
      loaded([primary]),
      { request: { query: ADMIN_ADD_MEMBER_PHONE, variables: { memberId: '3', phoneNumber: '0733000002', label: 'Airtel' } },
        result: answer('adminAddMemberPhone', {}) },
      loaded([primary, second]),
    ]
    render(<MockedProvider mocks={mocks}><MemberPhonesPanel memberId="3" mode="admin" /></MockedProvider>)

    expect(await screen.findByText('0711 000 001')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('New number'), { target: { value: '0733000002' } })
    fireEvent.change(screen.getByLabelText('Label (optional)'), { target: { value: 'Airtel' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add number' }))

    expect(await screen.findByText('0733 000 002')).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith('Done')
  })

  it('the member themself is asked for a code', async () => {
    const mocks = [
      loaded([primary]),
      { request: { query: REQUEST_ADD_PHONE, variables: { phoneNumber: '0733000002', label: '' } },
        result: answer('requestAddPhone', { member: null, message: 'We sent a code' }) },
    ]
    render(<MockedProvider mocks={mocks}><MemberPhonesPanel memberId="3" mode="self" /></MockedProvider>)

    await screen.findByText('0711 000 001')
    fireEvent.change(screen.getByLabelText('New number'), { target: { value: '0733000002' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(await screen.findByLabelText('Code sent to 0733000002')).toBeInTheDocument()
  })

  it('makes a second line primary', async () => {
    const mocks = [
      loaded([primary, second]),
      { request: { query: SET_PRIMARY_PHONE, variables: { phoneId: '2' } }, result: answer('setPrimaryPhone', {}) },
      loaded([{ ...second, isPrimary: true }, { ...primary, isPrimary: false }]),
    ]
    render(<MockedProvider mocks={mocks}><MemberPhonesPanel memberId="3" mode="admin" /></MockedProvider>)

    fireEvent.click(await screen.findByRole('button', { name: 'Make 0733 000 002 primary' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Done'))
  })
})
