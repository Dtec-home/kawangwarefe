/** MergePicker (F3): choose the two people by their phone numbers. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import { MergePicker } from '@/components/members/merge/merge-picker'
import { GET_MEMBER_BY_PHONE } from '@/lib/graphql/queries'

const person = (id: string, fullName: string, phoneNumber: string | null) => ({
  __typename: 'MemberType', id, fullName, firstName: fullName.split(' ')[0], lastName: '', phoneNumber,
  memberNumber: id, email: null, isActive: true,
})
const lookup = (phone: string, member: unknown) => ({
  request: { query: GET_MEMBER_BY_PHONE, variables: { phoneNumber: phone } },
  result: { data: { memberByPhone: member } },
})

describe('MergePicker (F3)', () => {
  it('finds who each number belongs to, then opens the preview with keep / merge-in', async () => {
    render(<MockedProvider mocks={[
      lookup('0711000001', person('1', 'Jane Wanjiku', '254711000001')),
      lookup('0733000002', person('2', 'JANE', null)),
    ]}><MergePicker /></MockedProvider>)

    fireEvent.change(screen.getByLabelText('Number of the record to keep'), { target: { value: '0711000001' } })
    fireEvent.change(screen.getByLabelText('Number of the duplicate'), { target: { value: '0733000002' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find' }))

    expect(await screen.findByText('Jane Wanjiku')).toBeInTheDocument()
    expect(screen.getByText('JANE')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Preview merge' }))
    expect(push).toHaveBeenCalledWith('/admin/members/merge?survivor=1&duplicate=2')
  })

  it('says when a number belongs to nobody, and does not offer a preview', async () => {
    render(<MockedProvider mocks={[lookup('0711000001', person('1', 'Jane Wanjiku', '254711000001')), lookup('0799999999', null)]}>
      <MergePicker /></MockedProvider>)

    fireEvent.change(screen.getByLabelText('Number of the record to keep'), { target: { value: '0711000001' } })
    fireEvent.change(screen.getByLabelText('Number of the duplicate'), { target: { value: '0799999999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find' }))

    expect(await screen.findByText('No one has 0799999999')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Preview merge' })).not.toBeInTheDocument()
  })

  it('the same person twice is not a merge', async () => {
    render(<MockedProvider mocks={[lookup('0711000001', person('1', 'Jane Wanjiku', '254711000001')),
      lookup('254711000001', person('1', 'Jane Wanjiku', '254711000001'))]}><MergePicker /></MockedProvider>)

    fireEvent.change(screen.getByLabelText('Number of the record to keep'), { target: { value: '0711000001' } })
    fireEvent.change(screen.getByLabelText('Number of the duplicate'), { target: { value: '254711000001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find' }))

    expect(await screen.findByText('Both numbers belong to the same person')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Preview merge' })).not.toBeInTheDocument())
  })
})
