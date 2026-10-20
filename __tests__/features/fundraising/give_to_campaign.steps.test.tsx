/**
 * Binding for `fundraising/give_to_campaign.feature` (S1-UI-B, tickets 1.12, 1.13).
 *
 * Drives the real `CampaignGiveSlot` (as hosted by /contribute) and the real
 * `ContributionLinesForm` (manual entry and recorder workspace host) through
 * Apollo's MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const nav = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/contribute',
  useSearchParams: () => nav.params,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null }) }))
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

import { GraphQLError } from 'graphql'
import {
  ACTIVE_CAMPAIGNS_FOR_LINES,
  INITIATE_CAMPAIGN_CONTRIBUTION,
  PUBLIC_CAMPAIGN_FOR_GIVING,
} from '@/lib/graphql/fundraising/give'
import { GET_CONTRIBUTION_CATEGORIES, GET_PAYBILL_INSTRUCTION_MESSAGE } from '@/lib/graphql/queries'
import { CampaignGiveSlot } from '@/components/campaigns/give/campaign-give-slot'
import {
  ContributionLinesForm,
  emptyContributionLine,
  toManualCategoryInputs,
  type CategoryAmount,
} from '@/components/contributions/contribution-lines-form'

const feature = loadFeature('./give_to_campaign.feature', { loadRelativePath: true })

function publicCampaign(slug: string, title: string, accepting: boolean) {
  return {
    __typename: 'PublicCampaignType',
    slug,
    title,
    summary: 'Replace the leaking iron sheets before the long rains.',
    isAcceptingGifts: accepting,
    categoryId: '4',
    purposeId: null,
    campaignId: '42',
    paymentInstructions: {
      __typename: 'PaymentInstructionsType',
      paybillNumber: '247247',
      accountReference: 'BUILD',
      text: 'Pay Bill 247247, Account BUILD',
    },
    progress: {
      __typename: 'CampaignProgressType',
      target: '100000.00',
      raised: '24800.00',
      remaining: '75200.00',
      percent: 24.8,
      donorCount: 37,
      giftCount: 41,
      pledged: '0.00',
    },
  }
}

interface World {
  mocks: MockedResponse[]
  initiated: Record<string, unknown>[]
  refusal: string | null
  /** The manual-entry lines as the host last saw them. */
  lines: CategoryAmount[]
}

const DEPARTMENTS = [
  { id: '1', name: 'Tithe', code: 'TITHE' },
  { id: '4', name: 'Building Fund', code: 'BUILD' },
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

const CAMPAIGN_IDS: Record<string, string> = { 'New Church Roof': '42' }

function linesMocks(campaigns: MockedResponse): MockedResponse[] {
  return [
    {
      request: { query: GET_CONTRIBUTION_CATEGORIES, variables: () => true },
      result: { data: { contributionCategories: DEPARTMENTS } },
      maxUsageCount: 20,
    },
    {
      request: { query: GET_PAYBILL_INSTRUCTION_MESSAGE, variables: () => true },
      result: { data: { paybillInstructionMessage: null } },
      maxUsageCount: 50,
    },
    campaigns,
  ]
}

function LinesHost({ onLines }: { onLines: (lines: CategoryAmount[]) => void }) {
  const [lines, setLines] = React.useState<CategoryAmount[]>([emptyContributionLine()])
  React.useEffect(() => {
    onLines(lines)
  }, [lines, onLines])
  return <ContributionLinesForm lines={lines} onChange={setLines} giver="other" />
}

async function pickDepartment(index: number, name: string) {
  const departmentSelects = () =>
    screen.getAllByRole('combobox').filter((el) => el.querySelector('option[value="1"]')) as HTMLSelectElement[]
  await waitFor(() => expect(departmentSelects().length).toBeGreaterThan(index))
  const select = departmentSelects()[index]
  const option = Array.from(select.options).find((o) => o.textContent?.includes(name))!
  fireEvent.change(select, { target: { value: option.value } })
}

function campaignMock(slug: string, campaign: unknown): MockedResponse {
  return {
    request: { query: PUBLIC_CAMPAIGN_FOR_GIVING, variables: { slug } },
    result: { data: { publicCampaign: campaign } },
    maxUsageCount: 5,
  }
}

function initiateMock(world: World): MockedResponse {
  return {
    request: { query: INITIATE_CAMPAIGN_CONTRIBUTION, variables: () => true },
    result: (variables) => {
      world.initiated.push(variables as Record<string, unknown>)
      const refused = world.refusal
      return {
        data: {
          initiateContribution: {
            __typename: 'ContributionResponse',
            success: !refused,
            message: refused ?? 'STK push sent',
            checkoutRequestId: refused ? null : 'ws_CO_123',
            contribution: refused ? null : { __typename: 'ContributionType', id: '9001' },
          },
        },
      }
    },
  }
}

function openContribute(world: World, slug: string | null) {
  nav.params = new URLSearchParams(slug ? { campaign: slug } : {})
  render(
    <MockedProvider mocks={[...world.mocks, initiateMock(world)]}>
      <CampaignGiveSlot>
        <p>General contribution form</p>
      </CampaignGiveSlot>
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    nav.push.mockReset()
    world = { mocks: [], initiated: [], refusal: null, lines: [] }
  })

  const givenAccepting = (given: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    given(/^the campaign "(.*)" "(.*)" is accepting gifts$/, (slug: string, title: string) => {
      world.mocks.push(campaignMock(slug, publicCampaign(slug, title, true)))
    })

  const whenOpen = (when: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    when(/^a giver opens the contribute page for campaign "(.*)"$/, (slug: string) => {
      openContribute(world, slug)
    })

  const give = async (amount: string, phone: string) => {
    fireEvent.change(await screen.findByLabelText(/Phone Number/), { target: { value: phone } })
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: amount } })
    fireEvent.click(screen.getByRole('button', { name: /Send M-Pesa prompt/ }))
  }

  const linkBack = (and: (m: string, fn: () => void) => void) =>
    and('they are offered a link back to the general giving page', () => {
      expect(screen.getByRole('link', { name: /Give to a department instead/ })).toHaveAttribute('href', '/contribute')
    })

  test('A giver sends an M-Pesa prompt for a campaign', ({ given, when, then, and }) => {
    givenAccepting(given)
    whenOpen(when)
    then(/^they see the campaign "(.*)" with "(.*)" raised$/, async (title: string, raised: string) => {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByText(raised)).toBeInTheDocument()
      expect(screen.queryByText('General contribution form')).not.toBeInTheDocument()
    })
    and(/^they see the Pay Bill account "(.*)"$/, (account: string) => {
      expect(screen.getByTestId('paybill-account')).toHaveTextContent(account)
      expect(screen.getByTestId('paybill-number')).toHaveTextContent('247247')
    })
    when(/^they give "(.*)" from phone "(.*)"$/, give)
    then(/^the M-Pesa prompt is sent for "(.*)" to the campaign's department tagged with the campaign$/, async (amount: string) => {
      await waitFor(() =>
        expect(world.initiated).toContainEqual({
          phoneNumber: '254712345678',
          amount,
          categoryId: '4',
          campaignId: '42',
        })
      )
    })
    and(/^they are taken to the confirmation page for campaign "(.*)"$/, async (slug: string) => {
      await waitFor(() =>
        expect(nav.push).toHaveBeenCalledWith(`/confirmation?id=9001&checkoutRequestId=ws_CO_123&campaign=${slug}`)
      )
    })
  })

  test('The server refuses the prompt', ({ given, and, when, then }) => {
    givenAccepting(given)
    and(/^the server will refuse the prompt with "(.*)"$/, (message: string) => {
      world.refusal = message
    })
    whenOpen(when)
    and(/^they give "(.*)" from phone "(.*)"$/, give)
    then(/^they are told "(.*)"$/, async (message: string) => {
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
    })
    and('they stay on the campaign page', () => {
      expect(nav.push).not.toHaveBeenCalled()
    })
  })

  test('A paused campaign does not take gifts', ({ given, when, then, and }) => {
    given(/^the campaign "(.*)" "(.*)" is not accepting gifts$/, (slug: string, title: string) => {
      world.mocks.push(campaignMock(slug, publicCampaign(slug, title, false)))
    })
    whenOpen(when)
    then('they are told the campaign is not accepting gifts', async () => {
      expect(await screen.findByText(/not accepting gifts right now/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Send M-Pesa prompt/ })).not.toBeInTheDocument()
    })
    linkBack(and)
  })

  test('An unknown campaign link', ({ given, when, then, and }) => {
    given(/^there is no public campaign "(.*)"$/, (slug: string) => {
      world.mocks.push(campaignMock(slug, null))
    })
    whenOpen(when)
    then('they are told the campaign could not be found', async () => {
      expect(await screen.findByText(/couldn.t find that campaign/)).toBeInTheDocument()
    })
    linkBack(and)
  })

  test('Without a campaign the general form is shown', ({ when, then }) => {
    when('a giver opens the contribute page without a campaign', () => {
      openContribute(world, null)
    })
    then('they see the general contribution form', () => {
      expect(screen.getByText('General contribution form')).toBeInTheDocument()
    })
  })
  const givenActiveCampaign = (given: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    given(/^the active campaign "(.*)" belongs to "(.*)"$/, (title: string, department: string) => {
      const dept = DEPARTMENTS.find((d) => d.name === department)!
      world.mocks.push({
        request: { query: ACTIVE_CAMPAIGNS_FOR_LINES },
        result: {
          data: {
            campaigns: [
              { __typename: 'GivingCampaignOptionType', id: CAMPAIGN_IDS[title], title, categoryId: dept.id, categoryName: dept.name },
            ],
          },
        },
        maxUsageCount: 5,
      })
    })

  const whenOpenLines = (when: (m: string, fn: () => void) => void) =>
    when('staff open the manual-entry lines', () => {
      render(
        <MockedProvider mocks={linesMocks(world.mocks[0])}>
          <LinesHost
            onLines={(lines) => {
              world.lines = lines
            }}
          />
        </MockedProvider>
      )
    })

  const putOnLine = async (amount: string, line: string, department: string) => {
    const index = Number(line) - 1
    if (index > 0 && world.lines.length <= index) {
      fireEvent.click(screen.getByRole('button', { name: /Add another fund/ }))
    }
    await pickDepartment(index, department)
    fireEvent.change(document.getElementById(`amount-${index}`) as HTMLInputElement, { target: { value: amount } })
  }

  const campaignSelect = (line: string) =>
    within(screen.getByTestId(`line-campaign-${Number(line) - 1}`)).getByRole('combobox') as HTMLSelectElement

  const offersCampaign = async (line: string, title: string) => {
    await waitFor(() => expect(screen.queryByTestId(`line-campaign-${Number(line) - 1}`)).toBeInTheDocument())
    expect(Array.from(campaignSelect(line).options).map((o) => o.textContent)).toContain(title)
  }

  const offersNoCampaign = async (line: string) => {
    // Let the campaigns query settle before asserting absence.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByTestId(`line-campaign-${Number(line) - 1}`)).not.toBeInTheDocument()
  }

  const chooseCampaign = async (title: string, line: string) => {
    await offersCampaign(line, title)
    const select = campaignSelect(line)
    const option = Array.from(select.options).find((o) => o.textContent === title)!
    fireEvent.change(select, { target: { value: option.value } })
  }

  const sentTagged = async (line: string, title: string) => {
    await waitFor(() => expect(toManualCategoryInputs(world.lines)[Number(line) - 1]?.campaignId).toBe(CAMPAIGN_IDS[title]))
  }

  const sentUntagged = async (line: string) => {
    await waitFor(() => {
      const input = toManualCategoryInputs(world.lines)[Number(line) - 1]
      expect(input).toBeDefined()
      expect(input).not.toHaveProperty('campaignId')
    })
  }

  test('Staff tag a manual-entry line with a campaign', ({ given, when, and, then }) => {
    givenActiveCampaign(given)
    whenOpenLines(when)
    and(/^they put "(.*)" on line (\d+) for "(.*)"$/, putOnLine)
    and(/^they put "(.*)" on line (\d+) for "(.*)"$/, putOnLine)
    then(/^line (\d+) offers the campaign "(.*)"$/, offersCampaign)
    and(/^line (\d+) offers no campaign$/, offersNoCampaign)
    when(/^they choose the campaign "(.*)" for line (\d+)$/, chooseCampaign)
    then(/^line (\d+) is sent tagged with campaign "(.*)"$/, sentTagged)
    and(/^line (\d+) is sent without a campaign$/, sentUntagged)
  })

  test("Changing a line's department drops its campaign", ({ given, when, and, then }) => {
    givenActiveCampaign(given)
    whenOpenLines(when)
    and(/^they put "(.*)" on line (\d+) for "(.*)"$/, putOnLine)
    and(/^they choose the campaign "(.*)" for line (\d+)$/, async (title: string, line: string) => {
      await chooseCampaign(title, line)
      await sentTagged(line, title)
    })
    and(/^they change line (\d+) to "(.*)"$/, (line: string, department: string) =>
      pickDepartment(Number(line) - 1, department)
    )
    then(/^line (\d+) is sent without a campaign$/, sentUntagged)
    and(/^line (\d+) offers no campaign$/, offersNoCampaign)
  })

  test('Someone who may not list campaigns sees no campaign choice', ({ given, when, and, then }) => {
    given('listing campaigns is refused', () => {
      world.mocks.push({
        request: { query: ACTIVE_CAMPAIGNS_FOR_LINES },
        result: { errors: [new GraphQLError('You do not have permission to view campaigns')] },
        maxUsageCount: 5,
      })
    })
    whenOpenLines(when)
    and(/^they put "(.*)" on line (\d+) for "(.*)"$/, putOnLine)
    then(/^line (\d+) offers no campaign$/, offersNoCampaign)
    and(/^line (\d+) is sent without a campaign$/, sentUntagged)
  })
})
