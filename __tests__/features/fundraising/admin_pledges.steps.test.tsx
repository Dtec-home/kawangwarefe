/**
 * Binding for `fundraising/admin_pledges.feature` (Fundraising S3, lane S3-UI-F).
 *
 * Drives the real pledge register through Apollo's MockedProvider with the
 * app's real GraphQL documents; the backend is played by `world`.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { toastMock, downloadMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
  downloadMock: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/download-base64-file', () => ({ downloadBase64File: downloadMock }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/pledges',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Native <select> so a choice can be made in jsdom; `name` becomes the label.
interface SelectMockProps {
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}
vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: SelectMockProps) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

import {
  CANCEL_PLEDGE,
  EXPORT_PLEDGES,
  GET_PLEDGES,
  GET_PLEDGE_SUMMARY,
  RECORD_PLEDGE,
  type CancelPledgeVars,
  type ExportPledgesVars,
  type PledgeScope,
  type PledgesVars,
  type RecordPledgeVars,
} from '@/lib/graphql/fundraising/admin-pledges'
import { GET_CAMPAIGNS } from '@/lib/graphql/fundraising/campaigns'
import { GET_CONTRIBUTION_CATEGORIES } from '@/lib/graphql/queries'
import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import type { Pledge } from '@/lib/types/fundraising'
import { PledgeRegister } from '@/components/pledges/admin/pledge-register'
import { CampaignPledgesTab } from '@/components/pledges/admin/campaign-pledges-tab'
import { category, listItem, role } from '../../components/campaigns/s1_ui_a/fixtures'
import { pledge, pledgeResponse, summary } from '../../components/campaigns/s3_ui_f/fixtures'

const feature = loadFeature('./admin_pledges.feature', { loadRelativePath: true })

interface World {
  pledges: Pledge[]
  summary: ReturnType<typeof summary>
  role: ReturnType<typeof role>
  loadError: boolean
  summaryAsked: PledgeScope[]
  pledgesAsked: PledgesVars[]
  recorded: RecordPledgeVars | null
  cancelled: CancelPledgeVars | null
  exported: ExportPledgesVars | null
}

const CATEGORIES = [category('3', 'Building Fund', 'BUILDING'), category('4', 'Youth', 'YOUTH')]
const CAMPAIGNS = [
  listItem({ id: '9', title: 'Church Building', categoryId: '3', categoryName: 'Building Fund' }),
  listItem({ id: '12', title: 'Youth Camp', paybillCode: 'CAMP', categoryId: '4', categoryName: 'Youth' }),
]

function matches(p: Pledge, vars: PledgesVars): boolean {
  if (vars.campaignId && p.campaignId !== vars.campaignId) return false
  if (vars.categoryId && p.categoryId !== vars.categoryId) return false
  if (vars.status && p.status !== vars.status) return false
  if (vars.search && !p.memberName.toLowerCase().includes(vars.search.toLowerCase())) return false
  return true
}

function mocks(world: World): MockedResponse[] {
  return [
    { request: { query: GET_CURRENT_USER_ROLE }, result: { data: { currentUserRole: world.role } }, maxUsageCount: 20 },
    {
      request: { query: GET_CONTRIBUTION_CATEGORIES },
      result: { data: { contributionCategories: CATEGORIES } },
      maxUsageCount: 20,
    },
    {
      request: { query: GET_CAMPAIGNS, variables: { status: null, search: null } },
      result: { data: { campaigns: CAMPAIGNS } },
      maxUsageCount: 20,
    },
    world.loadError
      ? { request: { query: GET_PLEDGES, variables: () => true }, error: new Error('Server unavailable') }
      : {
          request: {
            query: GET_PLEDGES,
            variables: (vars: PledgesVars) => {
              world.pledgesAsked.push(vars)
              return true
            },
          },
          result: (vars: PledgesVars) => ({ data: { pledges: world.pledges.filter((p) => matches(p, vars)) } }),
          maxUsageCount: 50,
        },
    {
      request: {
        query: GET_PLEDGE_SUMMARY,
        variables: (vars: PledgeScope) => {
          world.summaryAsked.push(vars)
          return true
        },
      },
      result: () => ({ data: { pledgeSummary: world.summary } }),
      maxUsageCount: 50,
    },
    {
      request: {
        query: RECORD_PLEDGE,
        variables: (vars: RecordPledgeVars) => {
          world.recorded = vars
          return true
        },
      },
      result: () => ({ data: { recordPledge: pledgeResponse(true, 'Pledge recorded', pledge({ id: '50' })) } }),
      maxUsageCount: 5,
    },
    {
      request: {
        query: CANCEL_PLEDGE,
        variables: (vars: CancelPledgeVars) => {
          world.cancelled = vars
          return true
        },
      },
      result: () => ({
        data: { cancelPledge: pledgeResponse(true, 'Pledge cancelled', pledge({ status: 'CANCELLED' })) },
      }),
      maxUsageCount: 5,
    },
    {
      request: {
        query: EXPORT_PLEDGES,
        variables: (vars: ExportPledgesVars) => {
          world.exported = vars
          return true
        },
      },
      result: () => ({
        data: {
          exportPledges: {
            __typename: 'ReportResponse',
            success: true,
            message: 'Pledges exported',
            fileData: 'UEsDBA==',
            filename: 'pledges.xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        },
      }),
      maxUsageCount: 5,
    },
  ]
}

function openRegister(world: World, campaignId?: string) {
  render(
    <MockedProvider mocks={mocks(world)}>
      {campaignId ? <CampaignPledgesTab campaignId={campaignId} /> : <PledgeRegister />}
    </MockedProvider>
  )
}

async function rowFor(name: string) {
  const table = await screen.findByRole('table')
  const cell = await within(table).findByText(name)
  return cell.closest('tr') as HTMLElement
}

async function toldThat(message: string) {
  await waitFor(() => {
    const toasted = [...toastMock.success.mock.calls, ...toastMock.error.mock.calls].flat()
    expect(toasted.includes(message) || screen.queryAllByText(message).length > 0).toBe(true)
  })
}

async function choose(name: string) {
  // A button can appear while the previous action is still settling (and so
  // disabled); a click on it then would be silently ignored.
  await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name }))
}

async function selectOption(label: string, text: string) {
  const select = (await screen.findByLabelText(label)) as HTMLSelectElement
  await waitFor(() => expect(Array.from(select.options).some((o) => o.textContent === text)).toBe(true))
  const option = Array.from(select.options).find((o) => o.textContent === text)
  fireEvent.change(select, { target: { value: option?.value } })
}

async function optionsOf(label: string): Promise<string[]> {
  const select = (await screen.findByLabelText(label)) as HTMLSelectElement
  return Array.from(select.options)
    .filter((o) => o.value !== '' && o.value !== 'all')
    .map((o) => o.textContent ?? '')
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    world = {
      pledges: [],
      summary: summary(),
      role: role(),
      loadError: false,
      summaryAsked: [],
      pledgesAsked: [],
      recorded: null,
      cancelled: null,
      exported: null,
    }
  })

  type Step = (matcher: string | RegExp, fn: (...args: string[]) => unknown) => void

  const givenPledged = (step: Step) =>
    step(
      /^"(.*)" pledged "(.*)" to (campaign|department) "(.*)", paid "(.*)", due (?:"(.*)"|none)$/,
      (name, amount, kind, target, paid, due) => {
        const toCampaign = kind === 'campaign'
        const campaign = CAMPAIGNS.find((c) => c.title === target)
        const department = CATEGORIES.find((c) => c.name === target)
        const balance = (Number(amount) - Number(paid)).toFixed(2)
        world.pledges.push(
          pledge({
            id: String(world.pledges.length + 1),
            memberName: name,
            campaignId: toCampaign ? (campaign?.id ?? null) : null,
            campaignTitle: toCampaign ? target : null,
            campaignSlug: null,
            categoryId: toCampaign ? (campaign?.categoryId ?? null) : (department?.id ?? null),
            categoryName: toCampaign ? (campaign?.categoryName ?? null) : target,
            amount,
            paid,
            balance,
            dueDate: due || null,
            status: Number(balance) <= 0 ? 'FULFILLED' : 'OPEN',
          })
        )
      }
    )

  const whenOpen = (step: Step) => step('they open the pledge register', () => openRegister(world))

  const thenShows = (step: Step) =>
    step(/^the register shows "(.*)" for "(.*)" with "(.*)" still owed$/, async (name, target, balance) => {
      await waitFor(async () => {
        const row = await rowFor(name)
        expect(within(row).getByText(target)).toBeInTheDocument()
        expect(within(row).getByText(balance)).toBeInTheDocument()
      })
    })

  const thenNotShown = (step: Step) =>
    step(/^the register does not show "(.*)"$/, async (name) => {
      await waitFor(() => expect(screen.queryByText(name)).not.toBeInTheDocument())
    })

  const thenTold = (step: Step) => step(/^they are told "(.*)"$/, (msg) => toldThat(msg))

  const chooseStep = (step: Step) => step(/^they choose "(.*)"$/, (name) => choose(name))

  const givenNoPledges = (step: Step) =>
    step('there are no pledges', () => {
      world.pledges = []
    })

  const enterCard = (step: Step) =>
    step(
      /^they enter phone "(.*)", name "(.*)", amount "(.*)" and due date "(.*)" for campaign "(.*)"$/,
      async (phone, name, amount, due, campaign) => {
        await screen.findByRole('dialog')
        await selectOption('campaignId', campaign)
        fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: phone } })
        fireEvent.change(screen.getByLabelText('Member name'), { target: { value: name } })
        fireEvent.change(screen.getByLabelText(/Amount \(KES\)/), { target: { value: amount } })
        fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: due } })
      }
    )

  const whenOpenTab = (step: Step) =>
    step(/^they open the Pledges tab of campaign "(.*)"$/, (title) =>
      openRegister(world, CAMPAIGNS.find((c) => c.title === title)!.id)
    )

  const thenTotalsFor = (step: Step) =>
    step(/^the totals were asked for campaign "(.*)"$/, async (title) => {
      const id = CAMPAIGNS.find((c) => c.title === title)?.id
      await waitFor(() => expect(world.summaryAsked).toContainEqual({ campaignId: id, categoryId: null }))
    })

  test('Staff see the totals and every pledge', ({ given, when, then, and }) => {
    givenPledged(given)
    and(
      /^the totals are "(.*)" pledged, "(.*)" paid, "(.*)" outstanding over (\d+) pledge$/,
      (pledged, paid, outstanding, count) => {
        world.summary = summary(pledged, paid, outstanding, Number(count))
      }
    )
    whenOpen(when)
    then(/^the totals show "(.*)" pledged, "(.*)" paid and "(.*)" outstanding$/, async (pledged, paid, outstanding) => {
      expect(await screen.findByTestId('pledge-total-pledged')).toHaveTextContent(pledged)
      expect(screen.getByTestId('pledge-total-paid')).toHaveTextContent(paid)
      expect(screen.getByTestId('pledge-total-outstanding')).toHaveTextContent(outstanding)
      expect(screen.getByTestId('pledge-total-count')).toHaveTextContent('1')
    })
    thenShows(and)
    and(/^"(.*)" is marked "(.*)" from a "(.*)"$/, async (name, status, source) => {
      const row = await rowFor(name)
      expect(within(row).getByText(status)).toBeInTheDocument()
      expect(within(row).getByText(source)).toBeInTheDocument()
    })
  })

  test('Staff filter the register by status and search', ({ given, when, then, and }) => {
    givenPledged(given)
    givenPledged(and)
    whenOpen(when)
    and(/^they show only "(.*)" pledges$/, async (label) => {
      await rowFor('Jane Wanjiku')
      await selectOption('status', label)
    })
    and(/^they search pledges for "(.*)"$/, async (term) => {
      fireEvent.change(screen.getByLabelText('Search'), { target: { value: term } })
      fireEvent.click(screen.getByRole('button', { name: /^Search$/ }))
      await waitFor(() => expect(world.pledgesAsked.some((v) => v.search === term)).toBe(true))
      expect(world.pledgesAsked.at(-1)).toMatchObject({ status: 'FULFILLED', search: term })
    })
    thenShows(then)
    thenNotShown(and)
  })

  test('Choosing a campaign limits the totals and the register to it', ({ given, when, then, and }) => {
    givenPledged(given)
    givenPledged(and)
    whenOpen(when)
    and(/^they show only pledges to campaign "(.*)"$/, async (title) => {
      await rowFor('Peter Otieno')
      await selectOption('campaign', title)
    })
    thenShows(then)
    thenNotShown(and)
    thenTotalsFor(and)
  })

  test('A department admin only chooses from their own departments and campaigns', ({ given, when, then, and }) => {
    given(/^a department admin for "(.*)"$/, (name) => {
      const id = CATEGORIES.find((c) => c.name === name)!.id
      world.role = role({ isStaff: false, isCategoryAdmin: true, adminCategoryIds: [id] })
    })
    whenOpen(when)
    then(/^the department filter offers only "(.*)"$/, async (name) => {
      await waitFor(async () => expect(await optionsOf('department')).toEqual([name]))
    })
    and(/^the campaign filter offers only "(.*)"$/, async (title) => {
      await waitFor(async () => expect(await optionsOf('campaign')).toEqual([title]))
    })
  })

  test('An empty register says so', ({ given, when, then }) => {
    givenNoPledges(given)
    whenOpen(when)
    then('they are told there are no pledges yet', async () => {
      expect(await screen.findByText('No pledges yet')).toBeInTheDocument()
    })
  })

  test('The register explains when it cannot load', ({ given, when, then }) => {
    given('the register cannot be loaded', () => {
      world.loadError = true
    })
    whenOpen(when)
    then(/^they see "(.*)"$/, async (text) => {
      expect(await screen.findByText(new RegExp(text))).toBeInTheDocument()
    })
  })

  test('Staff export the register to Excel', ({ given, when, then, and }) => {
    givenPledged(given)
    whenOpen(when)
    chooseStep(and)
    then(/^the file "(.*)" is downloaded$/, async (filename) => {
      await waitFor(() => expect(downloadMock).toHaveBeenCalledWith('UEsDBA==', filename, expect.any(String)))
      expect(world.exported).toEqual({ format: 'excel', campaignId: null, categoryId: null })
    })
    thenTold(and)
  })

  test('Staff record a pledge card for a new giver', ({ given, when, then, and }) => {
    givenNoPledges(given)
    whenOpen(when)
    chooseStep(and)
    enterCard(and)
    chooseStep(and)
    then(
      /^a pledge of "(.*)" to campaign "(.*)" is recorded for "(.*)" named "(.*)"$/,
      async (amount, title, phone, name) => {
        await waitFor(() => expect(world.recorded).not.toBeNull())
        expect(world.recorded).toEqual({
          phoneNumber: phone,
          memberName: name,
          input: {
            amount,
            campaignId: CAMPAIGNS.find((c) => c.title === title)?.id,
            categoryId: null,
            dueDate: '2027-01-31',
          },
        })
      }
    )
    thenTold(and)
  })

  test('A pledge card needs a valid phone number', ({ given, when, then, and }) => {
    givenNoPledges(given)
    whenOpen(when)
    chooseStep(and)
    enterCard(and)
    chooseStep(and)
    thenTold(then)
    and('no pledge is recorded', () => {
      expect(world.recorded).toBeNull()
    })
  })

  test('Staff cancel a pledge with a reason', ({ given, when, then, and }) => {
    givenPledged(given)
    whenOpen(when)
    and(/^they cancel the pledge of "(.*)" because "(.*)"$/, async (name, reason) => {
      const row = await rowFor(name)
      fireEvent.click(within(row).getByRole('button', { name: `Cancel pledge of ${name}` }))
      await screen.findByRole('dialog')
      fireEvent.change(screen.getByLabelText('Reason'), { target: { value: reason } })
      await choose('Cancel pledge')
    })
    then(/^the pledge is cancelled with reason "(.*)"$/, async (reason) => {
      await waitFor(() => expect(world.cancelled).toEqual({ id: '1', reason }))
    })
    thenTold(and)
  })

  test('A fulfilled pledge cannot be cancelled', ({ given, when, then }) => {
    givenPledged(given)
    whenOpen(when)
    then(/^"(.*)" cannot be cancelled$/, async (name) => {
      const row = await rowFor(name)
      expect(within(row).queryByRole('button', { name: /Cancel pledge/ })).not.toBeInTheDocument()
    })
  })

  test("A campaign's Pledges tab shows only that campaign's pledges", ({ given, when, then, and }) => {
    givenPledged(given)
    givenPledged(and)
    whenOpenTab(when)
    then(/^the tab lists "(.*)" with "(.*)" still owed$/, async (name, balance) => {
      const row = await rowFor(name)
      expect(within(row).getByText(balance)).toBeInTheDocument()
      expect(world.pledgesAsked.every((v) => v.campaignId === '9' && v.categoryId === null)).toBe(true)
    })
    thenNotShown(and)
    thenTotalsFor(and)
    and('there is no campaign or department filter', () => {
      expect(screen.queryByLabelText('campaign')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('department')).not.toBeInTheDocument()
      expect(screen.queryByRole('columnheader', { name: 'For' })).not.toBeInTheDocument()
    })
  })

  test('A pledge card recorded on the Pledges tab is for that campaign', ({ given, when, then, and }) => {
    givenNoPledges(given)
    whenOpenTab(when)
    chooseStep(and)
    and(/^they enter phone "(.*)", name "(.*)", amount "(.*)" and due date "(.*)"$/, async (phone, name, amount, due) => {
      await screen.findByRole('dialog')
      expect(screen.queryByLabelText('campaignId')).not.toBeInTheDocument()
      fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: phone } })
      fireEvent.change(screen.getByLabelText('Member name'), { target: { value: name } })
      fireEvent.change(screen.getByLabelText(/Amount \(KES\)/), { target: { value: amount } })
      fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: due } })
    })
    chooseStep(and)
    then(/^a pledge of "(.*)" to campaign "(.*)" is recorded for "(.*)"$/, async (amount, title, phone) => {
      await waitFor(() => expect(world.recorded).not.toBeNull())
      expect(world.recorded).toEqual({
        phoneNumber: phone,
        memberName: null,
        input: { amount, campaignId: CAMPAIGNS.find((c) => c.title === title)?.id, categoryId: null, dueDate: null },
      })
    })
  })

  test('The Pledges tab exports only that campaign', ({ given, when, then, and }) => {
    givenPledged(given)
    whenOpenTab(when)
    chooseStep(and)
    then(/^the export is for campaign "(.*)" as "(.*)"$/, async (title, format) => {
      await waitFor(() => expect(downloadMock).toHaveBeenCalled())
      expect(world.exported).toEqual({ format, campaignId: CAMPAIGNS.find((c) => c.title === title)?.id, categoryId: null })
    })
  })
})
