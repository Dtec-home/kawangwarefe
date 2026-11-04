/**
 * Web binding for `members/multiple_phones.feature` (@web, MP-2).
 * Renders the real MemberPhonesPanel against the real GraphQL documents
 * through MockedProvider.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { fireEvent, render, screen } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { MemberPhonesPanel } from '@/components/members/phones/member-phones-panel'
import {
  ADMIN_ADD_MEMBER_PHONE, CONFIRM_ADD_PHONE, MEMBER_PHONES, REQUEST_ADD_PHONE,
} from '@/lib/graphql/member-phones'

const feature = loadFeature('./multiple_phones.feature', { loadRelativePath: true })

const phone = (id: string, phoneNumber: string, isPrimary: boolean) => ({
  __typename: 'MemberPhoneType', id, phoneNumber, label: '', isPrimary, verified: true, source: 'otp',
  createdAt: '2026-11-04T00:00:00Z',
})

const response = (field: string, extra: Record<string, unknown> = {}) => ({
  data: { [field]: { __typename: 'PhoneResponse', success: true, message: 'Done', code: null,
    conflictMemberId: null, conflictMemberName: null, member: null, ...extra } },
})

defineFeature(feature, (test) => {
  test('A member adds a second number with a code', ({ given, when, and, then }) => {
    const mocks: MockedResponse[] = []

    given(/^I am on my profile with the number "(.*)"$/, async (primary: string) => {
      mocks.push(
        { request: { query: MEMBER_PHONES, variables: { memberId: '1' } }, result: { data: { memberPhones: [phone('1', primary, true)] } } },
        { request: { query: REQUEST_ADD_PHONE, variables: { phoneNumber: '0733000002', label: '' } }, result: response('requestAddPhone') },
        { request: { query: CONFIRM_ADD_PHONE, variables: { phoneNumber: '0733000002', otpCode: '123456', label: '' } }, result: response('confirmAddPhone') },
        { request: { query: MEMBER_PHONES, variables: { memberId: '1' } },
          result: { data: { memberPhones: [phone('1', primary, true), phone('2', '254733000002', false)] } } },
      )
      render(<MockedProvider mocks={mocks}><MemberPhonesPanel memberId="1" mode="self" /></MockedProvider>)
      await screen.findByText('0711 000 001')
    })
    when(/^I ask to add "(.*)"$/, async (number: string) => {
      fireEvent.change(screen.getByLabelText('New number'), { target: { value: number } })
      fireEvent.click(screen.getByRole('button', { name: 'Send code' }))
      await screen.findByLabelText(`Code sent to ${number}`)
    })
    and(/^I enter the code sent to "(.*)"$/, (number: string) => {
      fireEvent.change(screen.getByLabelText(`Code sent to ${number}`), { target: { value: '123456' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    })
    then(/^my numbers are "(.*)" and "(.*)"$/, async (first: string, second: string) => {
      expect(await screen.findByText(second)).toBeInTheDocument()
      expect(screen.getByText(first)).toBeInTheDocument()
    })
  })

  test('An admin is told who owns a number', ({ given, when, then }) => {
    given(/^I manage the numbers of member (\d+) with the number "(.*)"$/, async (memberId: string, primary: string) => {
      const mocks: MockedResponse[] = [
        { request: { query: MEMBER_PHONES, variables: { memberId } }, result: { data: { memberPhones: [phone('1', primary, true)] } } },
        { request: { query: ADMIN_ADD_MEMBER_PHONE, variables: { memberId, phoneNumber: '0733000002', label: '' } },
          result: response('adminAddMemberPhone', { success: false, code: 'PHONE_TAKEN',
            message: 'This number belongs to John Otieno', conflictMemberId: '7', conflictMemberName: 'John Otieno' }) },
      ]
      render(<MockedProvider mocks={mocks}><MemberPhonesPanel memberId={memberId} mode="admin" /></MockedProvider>)
      await screen.findByText('0711 000 001')
    })
    when(/^I add "(.*)" which belongs to "(.*)" \(member (\d+)\)$/, (number: string) => {
      fireEvent.change(screen.getByLabelText('New number'), { target: { value: number } })
      fireEvent.click(screen.getByRole('button', { name: 'Add number' }))
    })
    then(/^I am offered to merge with "(.*)"$/, async (name: string) => {
      const link = await screen.findByRole('link', { name: `Merge with ${name}` })
      expect(link).toHaveAttribute('href', '/admin/members/merge?survivor=3&duplicate=7')
    })
  })
})
