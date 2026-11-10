/**
 * Web binding for `admin/member_payer_claim.feature` (@web, MP-0).
 *
 * Renders the real members page; the GraphQL mutations are stubbed by
 * operation name, so the steps assert what the admin sees and what is sent.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mutations = vi.hoisted(() => ({ createMember: vi.fn(), claimPayerRecord: vi.fn(), other: vi.fn() }))

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: { membersList: { items: [], total: 0, hasMore: false }, groupsList: [] },
    loading: false, error: null, refetch: vi.fn(),
  })),
  useMutation: (document: any) => {
    const name = document?.definitions?.find((d: any) => d.kind === 'OperationDefinition')?.name?.value
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

const feature = loadFeature('./member_payer_claim.feature', { loadRelativePath: true })

function givenPayer(name: string, total: string, count: number) {
  vi.clearAllMocks()
  mutations.createMember.mockResolvedValue({
    data: {
      createMember: {
        success: false, code: 'PAYER_RECORD_EXISTS', message: 'already given', member: null,
        payerRecord: { memberId: '42', payerName: name, giftCount: count, giftTotal: total, lastGiftAt: null },
      },
    },
  })
  mutations.claimPayerRecord.mockResolvedValue({
    data: { claimPayerRecord: { success: true, code: null, message: 'claimed', member: { id: '42' }, payerRecord: null } },
  })
}

function addMember(fullName: string, phone: string) {
  const [first, last] = fullName.split(' ')
  render(<MembersPage />)
  fireEvent.click(screen.getByText('Add Member'))
  fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: first } })
  fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: last } })
  fireEvent.change(screen.getByPlaceholderText('0712345678'), { target: { value: phone } })
  fireEvent.click(screen.getByRole('button', { name: 'Create Member' }))
}

const PAYER = /^Pay Bill payer "(.*)" gave KES ([\d,]+) in (\d+) payments from "(.*)"$/
const ADD = /^the admin adds member "(.*)" with phone "(.*)"$/

defineFeature(feature, (test) => {
  test("The admin is offered the payer's record and uses it", ({ given, when, then, and }) => {
    given(PAYER, (name: string, amount: string, count: string) => givenPayer(name, `${amount.replace(',', '')}.00`, Number(count)))
    when(ADD, (fullName: string, phone: string) => addMember(fullName, phone))
    then(/^the admin sees that "(.*)" has already given KES ([\d,]+) in (\d+) Pay Bill payments as "(.*)"$/,
      async (phone: string, amount: string, count: string, name: string) => {
        expect(await screen.findByText(new RegExp(`${phone} has already given KES ${amount} in ${count} Pay Bill payments as`))).toBeInTheDocument()
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    when('the admin uses that record', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this record' }))
    })
    then(/^the payer record is claimed for "(.*)" with phone "(.*)"$/, async (fullName: string, phone: string) => {
      const [first, last] = fullName.split(' ')
      await waitFor(() => expect(mutations.claimPayerRecord).toHaveBeenCalledOnce())
      expect(mutations.claimPayerRecord.mock.calls[0][0].variables).toMatchObject({
        memberId: '42', firstName: first, lastName: last, phoneNumber: phone,
      })
    })
    and('the add member dialog closes', async () => {
      await waitFor(() => expect(screen.queryByText('Add New Member')).not.toBeInTheDocument())
    })
  })

  test('The admin goes back instead', ({ given, when, and, then }) => {
    given(PAYER, (name: string, amount: string, count: string) => givenPayer(name, `${amount.replace(',', '')}.00`, Number(count)))
    when(ADD, (fullName: string, phone: string) => addMember(fullName, phone))
    and('the admin goes back', async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Back' }))
    })
    then(/^the add member form still shows "(.*)"$/, (first: string) => {
      expect(screen.getByPlaceholderText('John')).toHaveValue(first)
    })
    and('nothing is claimed', () => {
      expect(mutations.claimPayerRecord).not.toHaveBeenCalled()
    })
  })
})
