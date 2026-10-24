/**
 * Shared Apollo mocks and form helpers for the desk features (S6-T, lane BDD-G):
 * `new_giver_name`, `desk_champion_code` and `recorder_campaign_tagging`.
 *
 * Each steps file keeps its own `vi.mock(...)` calls (they are hoisted per test
 * file); this module only builds MockedProvider responses with the app's real
 * GraphQL documents and drives the shared line form.
 */

import React from 'react'
import { GraphQLError } from 'graphql'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import {
  CREATE_MANUAL_MULTI_CONTRIBUTION,
  LOOKUP_MEMBER_BY_PHONE,
} from '@/lib/graphql/manual-contribution-mutations'
import { GET_CONTRIBUTION_CATEGORIES, GET_PAYBILL_INSTRUCTION_MESSAGE } from '@/lib/graphql/queries'
import { GET_MY_RECORDED_RECEIPTS } from '@/lib/graphql/recorder-queries'
import { GET_MY_OPEN_COLLECTION_SESSION } from '@/lib/graphql/collection-session-queries'
import { ACTIVE_CAMPAIGNS_FOR_LINES } from '@/lib/graphql/fundraising/give'
import { RecorderWorkspace } from '@/components/recorder/recorder-workspace'

export const DEPARTMENTS = [
  { id: '1', name: 'Tithe', code: 'TITHE' },
  { id: '2', name: 'Combined Offering', code: 'OFFERING' },
  { id: '4', name: 'Building', code: 'BLDG' },
].map((c) => ({
  __typename: 'ContributionCategoryType',
  ...c,
  description: '',
  isActive: true,
  routingMode: 'TOP_LEVEL',
  fallbackIfNoGroup: null,
  audience: 'all',
  hasAutoSplit: false,
  tracksMemberIdentifier: false,
  identifierLabel: '',
  identifierFormat: '',
  allowedGroups: [],
}))

export const departmentId = (name: string) => DEPARTMENTS.find((d) => d.name === name)!.id

export interface GivingCampaign {
  id: string
  title: string
  department: string
}

export interface DeskWorld {
  mocks: MockedResponse[]
  campaigns: GivingCampaign[]
  /** Variables of every createManualMultiContribution call, idempotency key removed */
  submissions: Record<string, unknown>[]
  receiptNumber: string
  /** The server refuses every gift with this message */
  refusal: string | null
  /** `givingCampaigns` answers with a permission error */
  campaignsRefused: boolean
}

export function newWorld(): DeskWorld {
  return { mocks: [], campaigns: [], submissions: [], receiptNumber: '20261024-0007', refusal: null, campaignsRefused: false }
}

export function lookupMock(phone: string, outcome: { found: false } | { found: true; name: string; needsName?: boolean }, staff = false): MockedResponse {
  const found = outcome.found
  const name = found ? outcome.name : null
  return {
    request: { query: LOOKUP_MEMBER_BY_PHONE, variables: { phoneNumber: phone } },
    result: {
      data: {
        lookupMemberByPhone: {
          __typename: 'MemberLookupResponse',
          success: true,
          found,
          message: found ? `Member found: ${name}` : 'Member not found - will be created as guest',
          isGuest: !found,
          phoneNumber: !found && staff ? `254${phone.replace(/^0/, '')}` : null,
          member:
            found && staff
              ? {
                  __typename: 'MemberType',
                  id: '7',
                  fullName: name,
                  firstName: name!.split(' ')[0],
                  lastName: name!.split(' ').slice(1).join(' '),
                  phoneNumber: `254${phone.replace(/^0/, '')}`,
                  memberNumber: null,
                  email: null,
                  isGuest: false,
                  isActive: true,
                }
              : null,
          giver: found ? { __typename: 'MemberLookupGiverType', id: '7', displayName: name } : null,
          needsName: found ? !!outcome.needsName : true,
        },
      },
    },
    maxUsageCount: 10,
  }
}

function createMock(world: DeskWorld): MockedResponse {
  return {
    request: { query: CREATE_MANUAL_MULTI_CONTRIBUTION, variables: () => true },
    result: (variables: Record<string, unknown>) => {
      const { idempotencyKey, ...rest } = variables
      // Every desk submission carries a client idempotency key (T5.3).
      if (typeof idempotencyKey === 'string' && idempotencyKey) world.submissions.push(rest)
      if (world.refusal) {
        return {
          data: {
            createManualMultiContribution: {
              __typename: 'ManualMultiContributionResponse',
              success: false,
              message: world.refusal,
              contributionGroupId: null,
              totalAmount: null,
              receiptNumber: null,
              isGuest: null,
              smsSent: false,
              idempotentReplay: false,
            },
          },
        }
      }
      return {
        data: {
          createManualMultiContribution: {
            __typename: 'ManualMultiContributionResponse',
            success: true,
            message: 'Recorded',
            contributionGroupId: 'g1',
            totalAmount: '0',
            receiptNumber: world.receiptNumber,
            isGuest: false,
            smsSent: true,
            idempotentReplay: false,
          },
        },
      }
    },
    maxUsageCount: 5,
  }
}

function givingCampaigns(world: DeskWorld) {
  return {
    data: {
      campaigns: world.campaigns.map((c) => ({
        __typename: 'GivingCampaignOptionType',
        id: c.id,
        title: c.title,
        categoryId: departmentId(c.department),
        categoryName: c.department,
      })),
    },
  }
}

/** Queries every desk form makes: departments, campaigns for lines, and the create mutation. */
export function formMocks(world: DeskWorld): MockedResponse[] {
  return [
    {
      request: { query: GET_CONTRIBUTION_CATEGORIES, variables: () => true },
      result: { data: { contributionCategories: DEPARTMENTS } },
      maxUsageCount: 50,
    },
    {
      request: { query: GET_PAYBILL_INSTRUCTION_MESSAGE, variables: () => true },
      result: { data: { paybillInstructionMessage: null } },
      maxUsageCount: 50,
    },
    {
      request: { query: ACTIVE_CAMPAIGNS_FOR_LINES },
      result: () => (world.campaignsRefused ? { errors: [new GraphQLError('Recording access required')] } : givingCampaigns(world)),
      maxUsageCount: 50,
    },
    createMock(world),
  ]
}

function recorderMocks(): MockedResponse[] {
  return [
    {
      request: { query: GET_MY_OPEN_COLLECTION_SESSION, variables: () => true },
      result: { data: { myOpenCollectionSession: null } },
      maxUsageCount: 50,
    },
    {
      request: { query: GET_MY_RECORDED_RECEIPTS, variables: () => true },
      result: {
        data: {
          myRecordedReceipts: {
            __typename: 'MyRecordedReceipts',
            date: '2026-10-24',
            count: 0,
            voidCount: 0,
            totalAmount: '0.00',
            items: [],
          },
        },
      },
      maxUsageCount: 50,
    },
  ]
}

export function renderWithMocks(world: DeskWorld, ui: React.ReactElement, extra: MockedResponse[] = []) {
  return render(<MockedProvider mocks={[...formMocks(world), ...extra, ...world.mocks]}>{ui}</MockedProvider>)
}

export function openRecorderWorkspace(world: DeskWorld) {
  return renderWithMocks(world, <RecorderWorkspace />, recorderMocks())
}

/** The line department selects: the only comboboxes offering department "1". */
function departmentSelects() {
  return screen.getAllByRole('combobox').filter((el) => el.querySelector('option[value="1"]')) as HTMLSelectElement[]
}

export async function chooseDepartment(index: number, name: string) {
  await waitFor(() => expect(departmentSelects().length).toBeGreaterThan(index))
  fireEvent.change(departmentSelects()[index], { target: { value: departmentId(name) } })
}

export function setAmount(index: number, amount: string) {
  fireEvent.change(document.getElementById(`amount-${index}`) as HTMLInputElement, { target: { value: amount } })
}

export function typePhoneAndSearch(phone: string) {
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: phone } })
  fireEvent.click(screen.getByRole('button', { name: /Search/ }))
}

/** The campaign picker of line `index` (null when the line's department has no campaign). */
export function campaignPicker(index: number): HTMLSelectElement | null {
  const row = screen.queryByTestId(`line-campaign-${index}`)
  return row ? (row.querySelector('select') as HTMLSelectElement) : null
}

export async function chooseCampaign(index: number, title: string) {
  const row = await screen.findByTestId(`line-campaign-${index}`)
  const select = row.querySelector('select') as HTMLSelectElement
  const option = Array.from(select.options).find((o) => o.textContent === title)!
  fireEvent.change(select, { target: { value: option.value } })
}

export function championField(index: number) {
  return screen.queryByLabelText(`Champion code for line ${index + 1}`) as HTMLInputElement | null
}

/** Recorder: "Review & save", wait for the confirmation sheet. */
export async function reviewGift() {
  const button = screen.getByRole('button', { name: /Review & save/ })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
  return screen.findByRole('dialog')
}

/** Recorder: confirm the open sheet and wait for the server's answer. */
export async function confirmGift(world: DeskWorld, dialog: HTMLElement) {
  const confirm = within(dialog).getByRole('button', { name: /Confirm & issue receipt/ })
  await waitFor(() => expect(confirm).toBeEnabled())
  const sent = world.submissions.length
  fireEvent.click(confirm)
  await waitFor(() => expect(world.submissions.length).toBe(sent + 1))
}

// ── Shared step bindings for the desk line features ─────────────────────────

export type Step = (matcher: string | RegExp, fn: (...args: string[]) => unknown) => void

const lineIndex = (n: string) => Number(n) - 1

/** Options a line's campaign picker offers, by visible text. */
function pickerOptions(index: number) {
  const picker = campaignPicker(index)
  expect(picker).not.toBeNull()
  return Array.from(picker!.options)
    .map((o) => o.textContent ?? '')
    .filter(Boolean)
}

/**
 * Step bindings shared by `desk_champion_code` and `recorder_campaign_tagging`:
 * a pure recorder records lines for a looked-up member and tags them.
 */
export function deskLineSteps(getWorld: () => DeskWorld) {
  let phone = ''
  let dialog: HTMLElement | null = null

  const openAndLookUp = async () => {
    openRecorderWorkspace(getWorld())
    typePhoneAndSearch(phone)
    await screen.findByTestId('giver-found')
  }

  return {
    memberPhone: (given: Step) =>
      given(/^the phone "(.*)" belongs to "(.*)"$/, (number: string, name: string) => {
        getWorld().mocks.push(lookupMock(number, { found: true, name }))
      }),
    recorderFor: (and: Step) =>
      and(/^a recorder at the desk records for "(.*)"$/, (number: string) => {
        phone = number
        dialog = null
      }),
    giveOne: (when: Step) =>
      when(/^they give "(.*)" to "(.*)"$/, async (amount: string, department: string) => {
        await openAndLookUp()
        await chooseDepartment(0, department)
        setAmount(0, amount)
      }),
    giveTwo: (when: Step) =>
      when(/^they give "(.*)" to "(.*)" and "(.*)" to "(.*)"$/, async (a1: string, d1: string, a2: string, d2: string) => {
        await openAndLookUp()
        await chooseDepartment(0, d1)
        setAmount(0, a1)
        fireEvent.click(screen.getByRole('button', { name: /Add another fund/ }))
        await chooseDepartment(1, d2)
        setAmount(1, a2)
      }),
    offers: (then: Step) =>
      then(/^line (\d+) offers the campaigns "(.*)"$/, async (n: string, list: string) => {
        await screen.findByTestId(`line-campaign-${lineIndex(n)}`)
        expect(pickerOptions(lineIndex(n))).toEqual(list.split(', '))
      }),
    chooseCampaign: (and: Step) =>
      and(/^they choose the campaign "(.*)" for line (\d+)$/, async (title: string, n: string) => {
        await chooseCampaign(lineIndex(n), title)
      }),
    reviewAndConfirm: (and: Step) =>
      and('they review and confirm the gift', async () => {
        dialog = await reviewGift()
        await confirmGift(getWorld(), dialog)
      }),
    /** The contributions of the one submission, as sent. */
    sentLines: async () => {
      await waitFor(() => expect(getWorld().submissions).toHaveLength(1))
      expect(getWorld().submissions[0]).toMatchObject({ phoneNumber: phone, entryType: 'cash' })
      return getWorld().submissions[0].contributions as Record<string, unknown>[]
    },
  }
}

/** A line as `toManualCategoryInputs` sends it. */
export function sentLine(department: string, amount: string, extra: Record<string, string> = {}) {
  return { categoryId: departmentId(department), amount, purposeId: null, memberIdentifier: null, ...extra }
}
