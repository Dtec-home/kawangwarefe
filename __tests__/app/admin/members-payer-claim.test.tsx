/**
 * MP-0 on the members page: adding a member whose number already paid by Pay
 * Bill offers the payer's record; confirming claims it with the form's values.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mutations = vi.hoisted(() => ({ createMember: vi.fn(), claimPayerRecord: vi.fn(), other: vi.fn() }))

function operationName(document: any): string {
  return document?.definitions?.find((d: any) => d.kind === 'OperationDefinition')?.name?.value ?? ''
}

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: { membersList: { items: [], total: 0, hasMore: false }, groupsList: [] },
    loading: false, error: null, refetch: vi.fn(),
  })),
  useMutation: (document: any) => {
    const name = operationName(document)
    const fn = name === 'CreateMember' ? mutations.createMember
      : name === 'ClaimPayerRecord' ? mutations.claimPayerRecord
      : mutations.other
    return [fn, { loading: false }]
  },
}))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { memberId: 1 }, logout: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true, canAccessAdmin: true, canAccessFeature: () => true, isAuthenticated: true,
    loading: false, adminCategories: [], adminCategoryIds: [], adminGroupNames: [],
  }),
}))
vi.mock('@/components/layouts/admin-layout', () => ({ AdminLayout: ({ children }: any) => <div>{children}</div> }))
vi.mock('@/components/auth/admin-protected-route', () => ({ AdminProtectedRoute: ({ children }: any) => <div>{children}</div> }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }))

import MembersPage from '@/app/(dashboard)/admin/members/page'

const payerRecord = { memberId: '42', payerName: 'RUTH', giftCount: 2, giftTotal: '4500.00', lastGiftAt: null }

function fillAndSubmit() {
  render(<MembersPage />)
  fireEvent.click(screen.getByText('Add Member'))
  fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Ruth' } })
  fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Achieng' } })
  fireEvent.change(screen.getByPlaceholderText('0712345678'), { target: { value: '0712345678' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create Member' }))
}

describe('Add member for a number that already paid by Pay Bill (MP-0)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutations.createMember.mockResolvedValue({
      data: { createMember: { success: false, code: 'PAYER_RECORD_EXISTS', message: 'already given', member: null, payerRecord } },
    })
    mutations.claimPayerRecord.mockResolvedValue({
      data: { claimPayerRecord: { success: true, code: null, message: "'Ruth Achieng' now owns the earlier Pay Bill gifts", member: { id: '42' }, payerRecord: null } },
    })
  })

  it('offers the payer record instead of showing an error', async () => {
    fillAndSubmit()

    expect(await screen.findByText(/has already given KES 4,500 in 2 Pay Bill payments as/)).toBeInTheDocument()
    expect(screen.getByText('RUTH')).toBeInTheDocument()
    expect(screen.queryByText('already given')).not.toBeInTheDocument()
  })

  it('claims the record with the names, phone, roles and groups from the form', async () => {
    fillAndSubmit()
    fireEvent.click(await screen.findByRole('button', { name: 'Use this record' }))

    await waitFor(() => expect(mutations.claimPayerRecord).toHaveBeenCalledOnce())
    expect(mutations.claimPayerRecord.mock.calls[0][0].variables).toEqual({
      memberId: '42', firstName: 'Ruth', lastName: 'Achieng', phoneNumber: '0712345678',
      email: null, roleNames: null, groupIds: null,
    })
    await waitFor(() => expect(screen.queryByText(/Pay Bill payments as/)).not.toBeInTheDocument())
  })

  it('going back returns to the form without claiming', async () => {
    fillAndSubmit()
    fireEvent.click(await screen.findByRole('button', { name: 'Back' }))

    expect(screen.getByRole('button', { name: 'Create Member' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('John')).toHaveValue('Ruth')
    expect(mutations.claimPayerRecord).not.toHaveBeenCalled()
  })

  it('a failed claim shows its message and keeps the offer open', async () => {
    mutations.claimPayerRecord.mockResolvedValue({
      data: { claimPayerRecord: { success: false, code: null, message: 'That record is not the Pay Bill payer for this number', member: null, payerRecord: null } },
    })
    fillAndSubmit()
    fireEvent.click(await screen.findByRole('button', { name: 'Use this record' }))

    expect(await screen.findByText('That record is not the Pay Bill payer for this number')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use this record' })).toBeInTheDocument()
  })
})
