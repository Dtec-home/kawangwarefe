/** Web binding for `members/member_merge.feature` (@web, MG-2/F3). */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { fireEvent, render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import { MergeConfirmForm } from '@/components/members/merge/merge-confirm-form'
import { MergePicker } from '@/components/members/merge/merge-picker'
import { GET_MEMBER_BY_PHONE } from '@/lib/graphql/queries'

const feature = loadFeature('./member_merge.feature', { loadRelativePath: true })

const person = (id: string, fullName: string) => ({
  __typename: 'MemberType', id, fullName, firstName: fullName, lastName: '', phoneNumber: null,
  memberNumber: id, email: null, isActive: true,
})

defineFeature(feature, (test) => {
  test('Two numbers open the merge preview', ({ given, when, then, and }) => {
    given(/^the number "(.*)" belongs to "(.*)" and "(.*)" to "(.*)"$/, (p1: string, n1: string, p2: string, n2: string) => {
      render(<MockedProvider mocks={[
        { request: { query: GET_MEMBER_BY_PHONE, variables: { phoneNumber: p1 } }, result: { data: { memberByPhone: person('1', n1) } } },
        { request: { query: GET_MEMBER_BY_PHONE, variables: { phoneNumber: p2 } }, result: { data: { memberByPhone: person('2', n2) } } },
      ]}><MergePicker /></MockedProvider>)
    })
    when(/^I enter "(.*)" to keep and "(.*)" as the duplicate$/, (keep: string, dup: string) => {
      fireEvent.change(screen.getByLabelText('Number of the record to keep'), { target: { value: keep } })
      fireEvent.change(screen.getByLabelText('Number of the duplicate'), { target: { value: dup } })
      fireEvent.click(screen.getByRole('button', { name: 'Find' }))
    })
    then(/^I see "(.*)" kept and "(.*)" merged in$/, async (keep: string, dup: string) => {
      expect(await screen.findByText(keep)).toBeInTheDocument()
      expect(screen.getByText(dup)).toBeInTheDocument()
    })
    and(/^I can open the preview for keeping "(.*)"$/, () => {
      fireEvent.click(screen.getByRole('button', { name: 'Preview merge' }))
      expect(push).toHaveBeenCalledWith('/admin/members/merge?survivor=1&duplicate=2')
    })
  })

  test("Merge needs a reason and the survivor's name", ({ given, when, then }) => {
    given(/^I am confirming a merge into "(.*)"$/, (name: string) => {
      render(<MergeConfirmForm survivorName={name} onConfirm={vi.fn()} />)
    })
    when(/^I give the reason "(.*)" and type "(.*)"$/, (reason: string, typed: string) => {
      fireEvent.change(screen.getByLabelText('Reason'), { target: { value: reason } })
      fireEvent.change(screen.getByLabelText(/^Type .* to confirm$/), { target: { value: typed } })
    })
    then('I cannot merge yet', () => {
      expect(screen.getByRole('button', { name: 'Merge' })).toBeDisabled()
    })
    when(/^I type "(.*)"$/, (typed: string) => {
      fireEvent.change(screen.getByLabelText(/^Type .* to confirm$/), { target: { value: typed } })
    })
    then('I can merge', () => {
      expect(screen.getByRole('button', { name: 'Merge' })).toBeEnabled()
    })
  })
})
