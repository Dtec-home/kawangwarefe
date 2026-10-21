/**
 * Binding for `fundraising/member_pledges.feature` (S3-UI-E, ticket 3.8).
 *
 * Drives the real `MyPledgesView` (as hosted by /pledges) through Apollo's
 * MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('sonner', () => ({ toast: toasts }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/pledges',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select data-testid="target-select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

import { CANCEL_PLEDGE, CREATE_PLEDGE, MY_PLEDGES, PLEDGE_TARGETS } from '@/lib/graphql/fundraising/member-pledges'
import { MyPledgesView } from '@/components/pledges/member/my-pledges-view'

const feature = loadFeature('./member_pledges.feature', { loadRelativePath: true })

const SLUGS: Record<string, string> = { 'New Church Roof': 'new-church-roof' }

function pledge(over: Record<string, unknown>) {
  return {
    __typename: 'PledgeType',
    id: String(Math.floor(Math.random() * 1e6)),
    campaignId: null,
    campaignTitle: null,
    campaignSlug: null,
    categoryId: null,
    categoryName: null,
    amount: '0.00',
    paid: '0.00',
    balance: '0.00',
    dueDate: '2026-12-31',
    status: 'OPEN',
    createdAt: '2026-10-01T08:00:00+03:00',
    ...over,
  }
}

function campaignPledge(title: string, amount: string, paid: string, over: Record<string, unknown> = {}) {
  const balance = (Number(amount) - Number(paid)).toFixed(2)
  return pledge({
    campaignId: '42',
    campaignTitle: title,
    campaignSlug: SLUGS[title],
    categoryId: '4',
    categoryName: 'Building Fund',
    amount,
    paid,
    balance,
    status: Number(balance) > 0 ? 'OPEN' : 'FULFILLED',
    ...over,
  })
}

function departmentPledge(name: string, amount: string, paid: string) {
  const balance = (Number(amount) - Number(paid)).toFixed(2)
  return pledge({
    categoryId: '7',
    categoryName: name,
    amount,
    paid,
    balance,
    status: Number(balance) > 0 ? 'OPEN' : 'FULFILLED',
  })
}

interface World {
  pledges: ReturnType<typeof pledge>[]
  loadFails: boolean
  campaigns: Record<string, unknown>[]
  refusal: string | null
  created: Record<string, unknown>[]
  cancelled: Record<string, unknown>[]
}

function mocks(world: World): MockedResponse[] {
  const list: MockedResponse = world.loadFails
    ? { request: { query: MY_PLEDGES }, error: new Error('Network down'), maxUsageCount: 5 }
    : { request: { query: MY_PLEDGES }, result: () => ({ data: { myPledges: world.pledges } }), maxUsageCount: 10 }
  return [
    list,
    {
      request: { query: PLEDGE_TARGETS },
      result: {
        data: {
          publicCampaigns: world.campaigns,
          contributionCategories: [
            { __typename: 'ContributionCategoryType', id: '1', name: 'Tithe' },
            { __typename: 'ContributionCategoryType', id: '7', name: 'Welfare' },
          ],
        },
      },
      maxUsageCount: 5,
    },
    {
      request: { query: CREATE_PLEDGE, variables: () => true },
      result: (variables) => {
        world.created.push((variables as { input: Record<string, unknown> }).input)
        const refused = world.refusal
        return {
          data: {
            createPledge: {
              __typename: 'PledgeResponse',
              success: !refused,
              message: refused ?? 'Pledge recorded',
              pledge: refused ? null : campaignPledge('New Church Roof', '5000', '0'),
            },
          },
        }
      },
      maxUsageCount: 3,
    },
    {
      request: { query: CANCEL_PLEDGE, variables: () => true },
      result: (variables) => {
        world.cancelled.push(variables as Record<string, unknown>)
        const id = (variables as { id: string }).id
        return {
          data: {
            cancelPledge: {
              __typename: 'PledgeResponse',
              success: true,
              message: 'Pledge cancelled',
              pledge: { __typename: 'PledgeType', id, status: 'CANCELLED', balance: '0.00' },
            },
          },
        }
      },
    },
  ]
}

const card = (target: string) => screen.findByRole('article', { name: `Pledge to ${target}` })

async function clickEnabled(name: string, root: HTMLElement | null = null) {
  const scope = root ? within(root) : screen
  await waitFor(() => expect(scope.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(scope.getByRole('button', { name }))
}

async function pick(label: string) {
  const dialog = await screen.findByRole('dialog')
  await waitFor(() => {
    const select = within(dialog).getByTestId('target-select') as HTMLSelectElement
    expect(Array.from(select.options).some((o) => o.textContent === label)).toBe(true)
  })
  const select = within(dialog).getByTestId('target-select') as HTMLSelectElement
  const option = Array.from(select.options).find((o) => o.textContent === label)!
  fireEvent.change(select, { target: { value: option.value } })
}

async function makePledge(kind: 'campaign' | 'department', target: string, amount: string, due: string | null) {
  // The page header always has the button; an empty list adds a second one,
  // so aim at the header's to stay independent of when the list arrives.
  const header = (await screen.findByRole('heading', { name: 'My pledges' })).closest('[data-slot="page-header"]') as HTMLElement
  await clickEnabled('Make a pledge', header)
  const dialog = await screen.findByRole('dialog')
  if (kind === 'department') fireEvent.click(within(dialog).getByLabelText('A department'))
  await pick(target)
  fireEvent.change(within(dialog).getByLabelText(/Amount/), { target: { value: amount } })
  if (due) fireEvent.change(within(dialog).getByLabelText(/Due date/), { target: { value: due } })
  await clickEnabled('Pledge', dialog)
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-21T09:00:00+03:00'))
    toasts.success.mockReset()
    world = { pledges: [], loadFails: false, campaigns: [], refusal: null, created: [], cancelled: [] }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const open = () =>
    render(
      <MockedProvider mocks={mocks(world)}>
        <MyPledgesView />
      </MockedProvider>
    )

  type Step = (m: RegExp | string, fn: (...a: string[]) => unknown) => void

  const givenCampaignPledge = (given: Step) =>
    given(/^the member has pledged "(.*)" to the campaign "(.*)" and paid "(.*)"$/, (amount, title, paid) => {
      world.pledges.push(campaignPledge(title, amount, paid))
    })
  const givenDepartmentPledge = (given: Step) =>
    given(/^the member has pledged "(.*)" to the department "(.*)" and paid "(.*)"$/, (amount, name, paid) => {
      world.pledges.push(departmentPledge(name, amount, paid))
    })
  const givenNone = (given: Step) => given('the member has no pledges', () => {})
  const givenTakesPledges = (given: Step) =>
    given(/^the campaign "(.*)" takes pledges$/, (title) => {
      world.campaigns.push(
        { __typename: 'PublicCampaignType', campaignId: '42', slug: SLUGS[title], title, allowPledges: true, isAcceptingGifts: true },
        { __typename: 'PublicCampaignType', campaignId: '43', slug: 'choir-robes', title: 'Choir Robes', allowPledges: false, isAcceptingGifts: true }
      )
    })
  const whenOpen = (when: Step) => when('the member opens My pledges', () => open())
  const thenMarked = (then: Step) =>
    then(/^the pledge to "(.*)" is marked "(.*)"$/, async (target, label) => {
      expect(within(await card(target)).getByTestId('pledge-status')).toHaveTextContent(label)
    })
  const thenPayGoes = (then: Step) =>
    then(/^"Pay balance" on the pledge to "(.*)" goes to "(.*)"$/, async (target, href) => {
      expect(within(await card(target)).getByRole('link', { name: 'Pay balance' })).toHaveAttribute('href', href)
    })
  const thenToldToast = (then: Step) =>
    then(/^they are told "(.*)"$/, async (message) => {
      await waitFor(() => expect(toasts.success).toHaveBeenCalledWith(message))
    })
  const whenMakeCampaign = (when: Step) =>
    when(/^they make a pledge of "(.*)" to the campaign "(.*)" due "(.*)"$/, (amount, title, due) =>
      makePledge('campaign', title, amount, due)
    )

  test('A member sees their pledges with paid and balance', ({ given, and, when, then }) => {
    givenCampaignPledge(given)
    givenDepartmentPledge(and)
    whenOpen(when)
    then(/^they see the pledge to "(.*)" with "(.*)" paid and "(.*)" left$/, async (target, paid, left) => {
      const el = within(await card(target))
      expect(el.getAllByText(paid).length).toBeGreaterThan(0)
      expect(el.getByText(left)).toBeInTheDocument()
      expect(el.getByRole('progressbar', { name: 'Paid towards pledge' })).toHaveAttribute('aria-valuenow', '40')
    })
    thenMarked(and)
    thenMarked(and)
  })

  test('An overdue pledge is highlighted', ({ given, when, then, and }) => {
    given(/^the member has an overdue pledge of "(.*)" to the campaign "(.*)"$/, (amount, title) => {
      world.pledges.push(campaignPledge(title, amount, '0', { status: 'OVERDUE', dueDate: '2026-10-01' }))
    })
    whenOpen(when)
    thenMarked(then)
    and(/^the pledge to "(.*)" shows its due date as overdue$/, async (target) => {
      const due = within(await card(target)).getByTestId('pledge-due')
      expect(due).toHaveAttribute('data-overdue', 'true')
      expect(due).toHaveTextContent('Due Thu, 1 Oct 2026 · overdue')
    })
  })

  test('Paying the balance of a campaign pledge opens the campaign\'s give page', ({ given, when, then }) => {
    givenCampaignPledge(given)
    whenOpen(when)
    thenPayGoes(then)
  })

  test('Paying the balance of a department pledge opens the give page', ({ given, when, then }) => {
    givenDepartmentPledge(given)
    whenOpen(when)
    thenPayGoes(then)
  })

  test('A member with no pledges is invited to make one', ({ given, when, then }) => {
    givenNone(given)
    whenOpen(when)
    then('they are told they have no pledges yet', async () => {
      expect(await screen.findByText('You have no pledges yet')).toBeInTheDocument()
    })
  })

  test('The pledges cannot be loaded', ({ given, when, then }) => {
    given('loading the pledges fails', () => {
      world.loadFails = true
    })
    whenOpen(when)
    then('they are told the pledges could not be loaded', async () => {
      expect(await screen.findByText('Your pledges could not be loaded')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })
  })

  test('A member pledges to a campaign', ({ given, and, when, then }) => {
    givenNone(given)
    givenTakesPledges(and)
    whenOpen(when)
    whenMakeCampaign(and)
    then(/^the pledge is created for "(.*)" to campaign "(.*)" due "(.*)"$/, async (amount, campaignId, due) => {
      await waitFor(() => expect(world.created).toHaveLength(1))
      expect(world.created[0]).toEqual({ amount, campaignId, dueDate: due })
    })
    thenToldToast(and)
  })

  test('A member pledges to a department without a due date', ({ given, and, when, then }) => {
    givenNone(given)
    givenTakesPledges(and)
    whenOpen(when)
    and(/^they make a pledge of "(.*)" to the department "(.*)"$/, (amount, name) =>
      makePledge('department', name, amount, null)
    )
    then(/^the pledge is created for "(.*)" to department "(.*)" with no due date$/, async (amount, categoryId) => {
      await waitFor(() => expect(world.created).toHaveLength(1))
      expect(world.created[0]).toEqual({ amount, categoryId, dueDate: null })
    })
  })

  test('The server refuses a new pledge', ({ given, and, when, then }) => {
    givenNone(given)
    givenTakesPledges(and)
    and(/^the server will refuse the pledge with "(.*)"$/, (message) => {
      world.refusal = message
    })
    whenOpen(when)
    whenMakeCampaign(and)
    then(/^they see the message "(.*)"$/, async (message) => {
      expect(await within(screen.getByRole('dialog')).findByText(message)).toBeInTheDocument()
    })
  })

  test('A member cancels an open pledge with a reason', ({ given, when, and, then }) => {
    givenCampaignPledge(given)
    whenOpen(when)
    and(/^they cancel the pledge to "(.*)" because "(.*)"$/, async (target, reason) => {
      await clickEnabled('Cancel pledge', await card(target))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: reason } })
      await clickEnabled('Cancel pledge', dialog)
    })
    then(/^the pledge is cancelled with the reason "(.*)"$/, async (reason) => {
      await waitFor(() => expect(world.cancelled).toHaveLength(1))
      expect(world.cancelled[0]).toEqual({ id: world.pledges[0].id, reason })
    })
    thenToldToast(and)
  })
})

