/**
 * Binding for `fundraising/champion_dashboard.feature` (S5-UI-J, ticket 5.9).
 *
 * Drives the real ChampionDashboardView (/champion/[id]) and
 * MyChampionshipsView (/champion) through Apollo's MockedProvider with the
 * app's real GraphQL documents.
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
  usePathname: () => '/champion',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select data-testid="campaign-select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

import {
  CHAMPION_DASHBOARD,
  CHAMPION_JOIN_CAMPAIGNS,
  JOIN_AS_CHAMPION,
  MY_CHAMPIONSHIPS,
} from '@/lib/graphql/fundraising/champions'
import { ChampionDashboardView } from '@/components/champions/dashboard/champion-dashboard-view'
import { MyChampionshipsView } from '@/components/champions/dashboard/my-championships-view'

const feature = loadFeature('./champion_dashboard.feature', { loadRelativePath: true })

const CHAMPION_ID = '9'

function champion(over: Record<string, unknown> = {}) {
  return {
    __typename: 'ChampionType',
    id: CHAMPION_ID,
    campaignId: '42',
    campaignTitle: 'New Church Roof',
    campaignSlug: 'new-church-roof',
    memberName: 'Jane Wanjiku',
    code: 'JANE',
    personalTarget: null,
    status: 'ACTIVE',
    showOnLeaderboard: true,
    raised: '0.00',
    donorCount: 0,
    publicUrl: 'https://church.example/campaigns/new-church-roof/c/JANE',
    paymentInstructions: {
      __typename: 'PaymentInstructionsType',
      paybillNumber: '4012345',
      accountReference: 'ROOF JANE',
      text: 'Pay Bill 4012345, Account ROOF JANE',
    },
    ...over,
  }
}

function donor(rank: number, name: string, amount: string) {
  return {
    __typename: 'ContributorEntryType',
    rank,
    name,
    amount,
    giftCount: 1,
    lastGivenAt: '2026-10-18T10:00:00+03:00',
  }
}

interface World {
  champion: ReturnType<typeof champion> | null
  donors: ReturnType<typeof donor>[]
  championships: ReturnType<typeof champion>[]
  campaigns: Record<string, unknown>[]
  joined: Record<string, unknown>[]
}

function mocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: CHAMPION_DASHBOARD, variables: { championId: CHAMPION_ID } },
      result: () => ({
        data: {
          championDashboard: world.champion
            ? { __typename: 'ChampionDashboardType', champion: world.champion, donors: world.donors }
            : null,
        },
      }),
      maxUsageCount: 5,
    },
    {
      request: { query: MY_CHAMPIONSHIPS },
      result: () => ({ data: { myChampionships: world.championships } }),
      maxUsageCount: 10,
    },
    {
      request: { query: CHAMPION_JOIN_CAMPAIGNS },
      result: () => ({ data: { publicCampaigns: world.campaigns } }),
      maxUsageCount: 5,
    },
    {
      request: { query: JOIN_AS_CHAMPION, variables: () => true },
      result: (variables) => {
        world.joined.push(variables as Record<string, unknown>)
        const joined = champion({ status: 'PENDING', code: (variables as { code: string }).code })
        world.championships = [joined]
        return {
          data: {
            joinAsChampion: { __typename: 'ChampionResponse', success: true, message: 'Request sent', champion: joined },
          },
        }
      },
      maxUsageCount: 3,
    },
  ]
}

async function clickEnabled(name: string, root: HTMLElement | null = null) {
  const scope = root ? within(root) : screen
  await waitFor(() => expect(scope.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(scope.getByRole('button', { name }))
}

async function askToChampion(title: string, code: string, target: string | null) {
  // The header always has the button; aim at it so an empty list doesn't matter.
  const header = (await screen.findByRole('heading', { name: 'My champion pages' })).closest(
    '[data-slot="page-header"]'
  ) as HTMLElement
  await clickEnabled('Become a champion', header)
  const dialog = await screen.findByRole('dialog')
  await waitFor(() => {
    const select = within(dialog).getByTestId('campaign-select') as HTMLSelectElement
    expect(Array.from(select.options).some((o) => o.textContent === title)).toBe(true)
  })
  const select = within(dialog).getByTestId('campaign-select') as HTMLSelectElement
  const option = Array.from(select.options).find((o) => o.textContent === title)!
  fireEvent.change(select, { target: { value: option.value } })
  fireEvent.change(within(dialog).getByLabelText(/Your code/), { target: { value: code } })
  if (target) fireEvent.change(within(dialog).getByLabelText(/Personal target/), { target: { value: target } })
  await clickEnabled('Send request', dialog)
}

defineFeature(feature, (test) => {
  let world: World
  const writeText = vi.fn()

  beforeEach(() => {
    cleanup()
    toasts.success.mockReset()
    toasts.error.mockReset()
    writeText.mockReset().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    world = { champion: null, donors: [], championships: [], campaigns: [], joined: [] }
  })

  const openDashboard = () =>
    render(
      <MockedProvider mocks={mocks(world)}>
        <ChampionDashboardView championId={CHAMPION_ID} />
      </MockedProvider>
    )
  const openPages = () =>
    render(
      <MockedProvider mocks={mocks(world)}>
        <MyChampionshipsView />
      </MockedProvider>
    )

  type Step = (m: RegExp | string, fn: (...a: string[]) => unknown) => void

  const givenChampion = (given: Step) =>
    given(/^"(.*)" is an? (active|pending|inactive) champion of "(.*)" with code "(.*)"$/, (name, status, title, code) => {
      world.champion = champion({ memberName: name, status: status.toUpperCase(), campaignTitle: title, code })
      world.championships = [world.champion]
    })
  const whenOpenDashboard = (when: Step) => when('she opens her champion dashboard', () => openDashboard())
  const whenOpenPages = (when: Step) => when('she opens her champion pages', () => openPages())
  const givenNotChampion = (given: Step) => given('the member is not a champion yet', () => {})
  const givenTakesChampions = (given: Step) =>
    given(/^the campaign "(.*)" takes champions$/, (title) => {
      const pi = { __typename: 'PaymentInstructionsType', paybillNumber: '4012345', accountReference: 'ROOF', text: '' }
      world.campaigns.push(
        { __typename: 'PublicCampaignType', campaignId: '42', slug: 'new-church-roof', title, allowChampions: true, isAcceptingGifts: true, paymentInstructions: pi },
        { __typename: 'PublicCampaignType', campaignId: '43', slug: 'choir-robes', title: 'Choir Robes', allowChampions: false, isAcceptingGifts: true, paymentInstructions: pi }
      )
    })

  test('An active champion sees their tally and their donors', ({ given, and, when, then }) => {
    givenChampion(given)
    and(/^she has raised "(.*)" from (\d+) donors towards a personal target of "(.*)"$/, (raised, count, target) => {
      world.champion = { ...world.champion!, raised, donorCount: Number(count), personalTarget: target }
    })
    and(/^"(.*)" gave "(.*)" and "(.*)" gave "(.*)" through her code$/, (a, amountA, b, amountB) => {
      world.donors = [donor(1, a, amountA), donor(2, b, amountB)]
    })
    whenOpenDashboard(when)
    then(/^she sees she has raised "(.*)" of "(.*)"$/, async (raised, target) => {
      const tally = await screen.findByRole('region', { name: 'What you have raised' })
      expect(within(tally).getByText(raised)).toBeInTheDocument()
      expect(within(tally).getByText(`of ${target}`)).toBeInTheDocument()
      expect(within(tally).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30')
    })
    and(/^she sees her donors ranked "(.*)" then "(.*)"$/, async (first, second) => {
      const list = await screen.findByRole('list', { name: 'Your donors' })
      const names = within(list).getAllByTestId('donor-name').map((el) => el.textContent)
      expect(names).toEqual([first, second])
    })
    and(/^"(.*)" is shown with "(.*)"$/, async (name, amount) => {
      const row = (await screen.findByText(name)).closest('li') as HTMLElement
      expect(within(row).getByTestId('donor-amount')).toHaveTextContent(amount)
    })
    and(/^she is told "(.*)"$/, async (note) => {
      expect(await screen.findByText(note)).toBeInTheDocument()
    })
  })

  test('An active champion gets a share kit', ({ given, when, then, and }) => {
    givenChampion(given)
    whenOpenDashboard(when)
    then(/^she sees her personal link "(.*)"$/, async (url) => {
      const kit = await screen.findByRole('region', { name: 'Share kit' })
      expect(within(kit).getByTestId('champion-link')).toHaveTextContent(url)
      expect(within(kit).getByRole('link', { name: 'WhatsApp' })).toBeInTheDocument()
    })
    and(/^she sees the Pay Bill text "(.*)"$/, async (text) => {
      expect(await screen.findByTestId('champion-paybill')).toHaveTextContent(text)
    })
    and(/^copying the Pay Bill details copies "(.*)"$/, async (text) => {
      await clickEnabled('Copy Pay Bill details')
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(text))
      expect(toasts.success).toHaveBeenCalledWith('Pay Bill details copied')
    })
    and(/^the WhatsApp message mentions "(.*)" and her link$/, async (account) => {
      const message = await screen.findByTestId('champion-message')
      expect(message).toHaveTextContent(account)
      expect(message).toHaveTextContent(world.champion!.publicUrl)
      const send = screen.getByRole('link', { name: 'Send on WhatsApp' })
      expect(send.getAttribute('href')).toContain('https://wa.me/?text=')
      expect(decodeURIComponent(send.getAttribute('href')!)).toContain(account)
    })
  })

  test('A pending champion is told they are waiting for approval', ({ given, when, then, and }) => {
    givenChampion(given)
    whenOpenDashboard(when)
    then('she is told her champion page is waiting for approval', async () => {
      expect(await screen.findByRole('heading', { name: 'New Church Roof' })).toBeInTheDocument()
      expect(screen.getAllByText('Waiting for approval').length).toBeGreaterThan(0)
      expect(screen.getByText(/Church staff will check your request/)).toBeInTheDocument()
    })
    and('she does not see a share kit', () => {
      expect(screen.queryByRole('region', { name: 'Share kit' })).not.toBeInTheDocument()
    })
  })

  test('An inactive champion is told their code no longer counts', ({ given, when, then }) => {
    givenChampion(given)
    whenOpenDashboard(when)
    then('she is told her champion page is no longer active', async () => {
      expect(await screen.findByText('This champion page is no longer active')).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Share kit' })).not.toBeInTheDocument()
    })
  })

  test('A champion page that is not theirs is not shown', ({ given, when, then }) => {
    given('the champion page does not exist', () => {
      world.champion = null
    })
    whenOpenDashboard(when)
    then('she is told the champion page was not found', async () => {
      expect(await screen.findByText('Champion page not found')).toBeInTheDocument()
    })
  })

  test('A member sees their champion pages', ({ given, when, then }) => {
    givenChampion(given)
    whenOpenPages(when)
    then(/^she sees a link to her "(.*)" champion page$/, async (title) => {
      const link = await screen.findByRole('link', { name: `${title} champion page` })
      expect(link).toHaveAttribute('href', `/champion/${CHAMPION_ID}`)
    })
  })

  test('A member asks to become a champion', ({ given, and, when, then }) => {
    givenNotChampion(given)
    givenTakesChampions(and)
    whenOpenPages(when)
    and(/^she asks to champion "(.*)" with code "(.*)" and a personal target of "(.*)"$/, (title, code, target) =>
      askToChampion(title, code, target)
    )
    then(/^she is joined to campaign "(.*)" with code "(.*)" and personal target "(.*)"$/, async (campaignId, code, target) => {
      await waitFor(() => expect(world.joined).toHaveLength(1))
      expect(world.joined[0]).toEqual({ campaignId, code, personalTarget: target })
    })
    and('she is told she is waiting for approval', async () => {
      const dialog = await screen.findByRole('dialog')
      expect(await within(dialog).findByText('Waiting for approval')).toBeInTheDocument()
      expect(toasts.success).toHaveBeenCalledWith('Request sent')
    })
  })

  test('A champion code that is too short is refused before sending', ({ given, and, when, then }) => {
    givenNotChampion(given)
    givenTakesChampions(and)
    whenOpenPages(when)
    and(/^she asks to champion "(.*)" with code "(.*)" and no personal target$/, (title, code) =>
      askToChampion(title, code, null)
    )
    then(/^she sees the message "(.*)"$/, async (message) => {
      const dialog = await screen.findByRole('dialog')
      expect(await within(dialog).findAllByText(message)).not.toHaveLength(0)
      expect(within(dialog).getByLabelText(/Your code/)).toHaveAttribute('aria-invalid', 'true')
    })
    and('nothing is sent', () => {
      expect(world.joined).toHaveLength(0)
    })
  })
})
