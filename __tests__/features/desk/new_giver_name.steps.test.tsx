/**
 * Binding for `desk/new_giver_name.feature` (Fundraising S6-T, lane BDD-G).
 *
 * Drives the real `RecorderWorkspace` and the admin manual-entry page through
 * Apollo's MockedProvider with the app's real lookup and create documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

const { role, toastMock } = vi.hoisted(() => ({
  role: { isPureRecorder: true },
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isPureRecorder: role.isPureRecorder,
    isRecorder: role.isPureRecorder,
    isStaff: !role.isPureRecorder,
    canAccessAdmin: !role.isPureRecorder,
    canAccessFeature: () => true,
    isAuthenticated: true,
    loading: false,
    adminCategories: [],
    adminCategoryIds: [],
    adminGroupNames: [],
  }),
}))
vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({ unlocks: [], unlockDates: [], hasActiveUnlocks: false, loading: false, refetch: vi.fn() }),
}))
vi.mock('@/hooks/use-tour', () => ({ useTour: () => ({ start: vi.fn(), isReady: false }) }))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

import ManualEntryPage from '@/app/(dashboard)/admin/contributions/manual-entry/page'
import {
  chooseDepartment,
  confirmGift,
  departmentId,
  lookupMock,
  newWorld,
  openRecorderWorkspace,
  renderWithMocks,
  reviewGift,
  setAmount,
  typePhoneAndSearch,
  type DeskWorld,
} from './desk-fixtures'

const feature = loadFeature('./new_giver_name.feature', { loadRelativePath: true })

type Step = (matcher: string | RegExp, fn: (...args: string[]) => unknown) => void

defineFeature(feature, (test) => {
  let world: DeskWorld
  let dialog: HTMLElement | null

  beforeEach(() => {
    cleanup()
    world = newWorld()
    dialog = null
    role.isPureRecorder = true
    toastMock.error.mockClear()
  })

  const nameField = () => screen.queryByLabelText(/Giver's full name/)

  const givenRecorder = (given: Step) =>
    given('a recorder at the desk', () => {
      role.isPureRecorder = true
    })

  const givenNewPhone = (and: Step) =>
    and(/^the phone "(.*)" is new to the church$/, (phone: string) => {
      world.mocks.push(lookupMock(phone, { found: false }, !role.isPureRecorder))
    })

  const whenLookUp = (when: Step) =>
    when(/^they look up the phone "(.*)"$/, (phone: string) => {
      openRecorderWorkspace(world)
      typePhoneAndSearch(phone)
    })

  const whenEnterName = (and: Step) =>
    and(/^they enter the giver's full name "(.*)"$/, async (name: string) => {
      fireEvent.change(await screen.findByLabelText(/Giver's full name/), { target: { value: name } })
    })

  const whenGiveAndReview = (and: Step, expectSheet: boolean) =>
    and(/^they give "(.*)" to "(.*)" and review the gift$/, async (amount: string, department: string) => {
      await chooseDepartment(0, department)
      setAmount(0, amount)
      if (expectSheet) {
        dialog = await reviewGift()
      } else {
        const button = screen.getByRole('button', { name: /Review & save/ })
        await waitFor(() => expect(button).toBeEnabled())
        fireEvent.click(button)
      }
    })

  const whenConfirm = (and: Step) =>
    and('they confirm the gift', async () => {
      await confirmGift(world, dialog!)
    })

  const thenSentWithName = (then: Step) =>
    then(/^the gift is sent for phone "(.*)" with the new giver's name "(.*)"$/, async (phone: string, name: string) => {
      await waitFor(() => expect(world.submissions).toHaveLength(1))
      expect(world.submissions[0]).toMatchObject({ phoneNumber: phone, newGiverName: name, giverName: null })
      expect(world.submissions[0].contributions).toEqual([
        { categoryId: departmentId('Tithe'), amount: '500', purposeId: null, memberIdentifier: null },
      ])
    })

  const thenNothingSent = (and: Step) =>
    and('nothing is sent', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(world.submissions).toEqual([])
    })

  test('A recorder is asked for the name of a giver whose phone is new', ({ given, and, when, then }) => {
    givenRecorder(given)
    givenNewPhone(and)
    whenLookUp(when)
    then('they are told a new giver record will be created', async () => {
      expect(await screen.findByTestId('giver-new')).toHaveTextContent('A new giver record will be created')
    })
    and("they are asked for the giver's full name", async () => {
      expect(await screen.findByLabelText(/Giver's full name/)).toHaveValue('')
    })
  })

  test("A recorder cannot save a new phone's gift without the name", ({ given, and, when, then }) => {
    givenRecorder(given)
    givenNewPhone(and)
    whenLookUp(when)
    whenGiveAndReview(and, false)
    then(/^they are told "(.*)"$/, async (message: string) => {
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(message))
    })
    and('no confirmation sheet opens', () => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    thenNothingSent(and)
  })

  test("A recorder sends the new giver's name and sees it on the confirmation", ({ given, and, when, then }) => {
    givenRecorder(given)
    givenNewPhone(and)
    whenLookUp(when)
    whenEnterName(and)
    whenGiveAndReview(and, true)
    then(/^the confirmation sheet shows the giver "(.*)"$/, (name: string) => {
      expect(within(dialog!).getByTestId('confirm-summary')).toHaveTextContent(`Giver${name}`)
    })
    whenConfirm(when)
    thenSentWithName(then)
    and(/^the receipt screen says the gift is from "(.*)"$/, async (name: string) => {
      expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent(world.receiptNumber)
      expect(screen.getByTestId('record-success')).toHaveTextContent(`KES 500.00 from ${name}`)
    })
  })

  test('Changing the phone number forgets the name typed for the old one', ({ given, and, when, then }) => {
    givenRecorder(given)
    givenNewPhone(and)
    whenLookUp(when)
    whenEnterName(and)
    and(/^they change the phone number to "(.*)"$/, (phone: string) => {
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: phone } })
    })
    then("they are no longer asked for the giver's full name", () => {
      expect(nameField()).not.toBeInTheDocument()
    })
  })

  test("A registered member's phone does not ask for a name", ({ given, and, when, then }) => {
    givenRecorder(given)
    and(/^the phone "(.*)" belongs to "(.*)"$/, (phone: string, name: string) => {
      world.mocks.push(lookupMock(phone, { found: true, name }))
    })
    whenLookUp(when)
    then(/^they are asked to confirm the name "(.*)"$/, async (name: string) => {
      expect(await screen.findByTestId('giver-found')).toHaveTextContent(name)
    })
    and("they are not asked for the giver's full name", () => {
      expect(nameField()).not.toBeInTheDocument()
    })
    whenGiveAndReview(when, true)
    whenConfirm(and)
    then(/^the gift is sent for phone "(.*)" without a new giver's name$/, async (phone: string) => {
      await waitFor(() => expect(world.submissions).toHaveLength(1))
      expect(world.submissions[0]).toMatchObject({ phoneNumber: phone, giverName: null })
      expect(world.submissions[0]).not.toHaveProperty('newGiverName')
    })
  })

  const givenAdmin = (given: Step) =>
    given('an admin on the manual-entry page', () => {
      role.isPureRecorder = false
    })

  const whenAdminTypes = (when: Step) =>
    when(/^the admin types the phone "(.*)" and gives "(.*)" to "(.*)"$/, async (phone: string, amount: string, department: string) => {
      renderWithMocks(world, <ManualEntryPage />)
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: phone } })
      await chooseDepartment(0, department)
      setAmount(0, amount)
    })

  const whenAdminSaves = (and: Step) =>
    and('the admin saves the contribution', async () => {
      const save = screen.getByRole('button', { name: /Save Contribution/ })
      await waitFor(() => expect(save).toBeEnabled())
      fireEvent.click(save)
    })

  test("An admin cannot save a new phone's gift without the name", ({ given, and, when, then }) => {
    givenAdmin(given)
    givenNewPhone(and)
    whenAdminTypes(when)
    whenAdminSaves(and)
    then(/^the admin is told "(.*)"$/, async (message: string) => {
      expect(await screen.findByText(message)).toBeInTheDocument()
    })
    and("the admin is asked for the giver's full name", () => {
      expect(nameField()).toBeInTheDocument()
    })
    thenNothingSent(and)
  })

  test("An admin sends the new giver's name with the gift", ({ given, and, when, then }) => {
    givenAdmin(given)
    givenNewPhone(and)
    whenAdminTypes(when)
    and(/^the admin enters the giver's full name "(.*)"$/, async (name: string) => {
      fireEvent.blur(screen.getByLabelText('Phone Number'))
      fireEvent.change(await screen.findByLabelText(/Giver's full name/), { target: { value: name } })
    })
    whenAdminSaves(and)
    thenSentWithName(then)
    and(/^the admin sees receipt "(.*)"$/, async (number: string) => {
      expect(await screen.findByRole('link', { name: number })).toHaveAttribute('href', `/receipts/${number}`)
    })
  })
})
