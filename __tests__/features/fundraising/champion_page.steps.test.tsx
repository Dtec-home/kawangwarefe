/**
 * Binding for `fundraising/champion_page.feature` (S5-UI-I, tickets 5.7, 5.8).
 *
 * Drives the real ChampionPageView and LeaderboardSlot through Apollo's
 * MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { vi } from 'vitest'

const nav = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/campaigns/new-church-roof/c/MARY',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null }) }))

import { INITIATE_CAMPAIGN_CONTRIBUTION } from '@/lib/graphql/fundraising/give'
import { CAMPAIGN_LEADERBOARD, PUBLIC_CHAMPION_PAGE } from '@/lib/graphql/fundraising/public-champions'
import { ChampionPageView } from '@/components/champions/public/champion-page-view'
import { LeaderboardSlot } from '@/components/champions/public/leaderboard-slot'

const feature = loadFeature('./champion_page.feature', { loadRelativePath: true })

const kesToNumber = (kes: string) => kes.replace(/[^\d.]/g, '')

function champion(name: string, code: string, raised: string, donors: number) {
  return {
    __typename: 'PublicChampionType',
    championName: name,
    code,
    raised,
    donorCount: donors,
    personalTarget: null as string | null,
    publicUrl: `https://church.example/campaigns/new-church-roof/c/${code}`,
    paymentInstructions: {
      __typename: 'PaymentInstructionsType',
      paybillNumber: '247247',
      accountReference: `BUILD ${code}`,
      text: `Pay Bill 247247, Account BUILD ${code}`,
    },
    campaign: {
      __typename: 'PublicCampaignType',
      slug: 'new-church-roof',
      title: 'New Church Roof',
      summary: 'Replace the leaking iron sheets before the long rains.',
      coverImageUrl: '',
      daysLeft: 12,
      isAcceptingGifts: true,
      isClosed: false,
      categoryId: '4',
      purposeId: null,
      campaignId: '42',
      publicUrl: 'https://church.example/campaigns/new-church-roof',
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
    },
  }
}

interface World {
  champion: ReturnType<typeof champion> | null
  initiated: Record<string, unknown>[]
  leaderboard: MockedResponse[]
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    world = { champion: null, initiated: [], leaderboard: [] }
    nav.push.mockReset()
  })
  afterEach(cleanup)

  type Step = (m: RegExp | string, fn: (...a: string[]) => unknown) => void

  const givenChampion = (given: Step) =>
    given(
      /^"(.*)" is an active champion "(.*)" of "(.*)" with "(.*)" raised from (\d+) donors$/,
      (name, code, _title, raised, donors) => {
        world.champion = champion(name, code, kesToNumber(raised), Number(donors))
      },
    )

  const openPage = (when: Step) =>
    when(/^a visitor opens the champion page "(.*)" "(.*)"$/, (slug, code) => {
      const mocks: MockedResponse[] = [
        {
          request: { query: PUBLIC_CHAMPION_PAGE, variables: { slug, code } },
          result: { data: { publicChampion: world.champion } },
          maxUsageCount: 5,
        },
        {
          request: {
            query: INITIATE_CAMPAIGN_CONTRIBUTION,
            variables: (v: Record<string, unknown>) => {
              world.initiated.push(v)
              return true
            },
          },
          result: {
            data: {
              initiateContribution: {
                __typename: 'ContributionResponse',
                success: true,
                message: 'sent',
                checkoutRequestId: 'ws_CO_1',
                contribution: { __typename: 'ContributionType', id: '901' },
              },
            },
          },
        },
      ]
      render(
        <MockedProvider mocks={mocks}>
          <ChampionPageView slug={slug} code={code} />
        </MockedProvider>,
      )
    })

  const campaignLink = (then: Step) =>
    then(/^there is a link to the main campaign page "(.*)"$/, async (slug) => {
      const links = await screen.findAllByRole('link', { name: /campaign/i })
      expect(links.some((a) => a.getAttribute('href') === `/campaigns/${slug}`)).toBe(true)
    })

  test('A giver gives through a champion\'s link', ({ given, and, when, then }) => {
    givenChampion(given)
    and(/^her personal target is "(.*)"$/, (target) => {
      world.champion!.personalTarget = target
    })
    openPage(when)
    then(/^they see "(.*)"$/, async (heading) => {
      const h1 = await screen.findByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent(heading)
    })
    and(/^they see the champion's total "(.*)" from "(.*)"$/, (total, donors) => {
      const stats = screen.getByTestId('champion-totals')
      expect(within(stats).getByText(total)).toBeInTheDocument()
      expect(within(stats).getByText(donors)).toBeInTheDocument()
    })
    and(/^they see her personal target "(.*)" at "(.*)"$/, (target, percent) => {
      const el = screen.getByTestId('champion-target')
      expect(el).toHaveTextContent(target)
      expect(el).toHaveTextContent(percent)
    })
    and(/^they see the whole campaign's progress "(.*)"$/, (raised) => {
      const el = screen.getByTestId('champion-campaign-progress')
      expect(within(el).getByText(raised)).toBeInTheDocument()
    })
    and(/^they are told "(.*)"$/, (notice) => {
      const give = screen.getByRole('region', { name: /Give through/ })
      expect(within(give).getByText(notice)).toBeInTheDocument()
    })
    and(/^they see the Pay Bill account "(.*)"$/, (account) => {
      expect(screen.getByTestId('paybill-account')).toHaveTextContent(account)
    })
    when(/^they give "(.*)" from phone "(.*)"$/, async (amount, phone) => {
      fireEvent.change(await screen.findByLabelText(/Phone Number/), { target: { value: phone } })
      fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: amount } })
      const button = screen.getByRole('button', { name: /Send M-Pesa prompt/ })
      await waitFor(() => expect(button).toBeEnabled())
      fireEvent.click(button)
    })
    then(
      /^the M-Pesa prompt is sent for "(.*)" tagged with the campaign and champion code "(.*)"$/,
      async (amount, code) => {
        await waitFor(() => expect(world.initiated).toHaveLength(1))
        expect(world.initiated[0]).toEqual({
          phoneNumber: '254712345678',
          amount,
          categoryId: '4',
          campaignId: '42',
          championCode: code,
        })
      },
    )
    and(/^they are taken to the confirmation page for campaign "(.*)"$/, async (slug) => {
      await waitFor(() => expect(nav.push).toHaveBeenCalled())
      expect(nav.push.mock.calls[0][0]).toContain(`campaign=${slug}`)
    })
  })

  test('A champion without a personal target', ({ given, when, then, and }) => {
    givenChampion(given)
    openPage(when)
    then(/^they see the champion's total "(.*)" from "(.*)"$/, async (total, donors) => {
      const stats = await screen.findByTestId('champion-totals')
      expect(within(stats).getByText(total)).toBeInTheDocument()
      expect(within(stats).getByText(donors)).toBeInTheDocument()
    })
    and('they see no personal target', () => {
      expect(screen.queryByTestId('champion-target')).not.toBeInTheDocument()
    })
  })

  test('The champion page is shared with the champion\'s link', ({ given, when, then, and }) => {
    givenChampion(given)
    openPage(when)
    then(/^the WhatsApp share carries the champion link and the account "(.*)"$/, async (account) => {
      const wa = await screen.findByRole('link', { name: /WhatsApp/ })
      const text = decodeURIComponent(wa.getAttribute('href')!.split('text=')[1])
      expect(text).toContain('https://church.example/campaigns/new-church-roof/c/MARY')
      expect(text).toContain(`account ${account}`)
    })
    campaignLink(and)
  })

  test('A paused campaign takes no gifts on the champion page', ({ given, and, when, then }) => {
    givenChampion(given)
    and('the campaign is not accepting gifts', () => {
      world.champion!.campaign.isAcceptingGifts = false
    })
    openPage(when)
    then('they are told the campaign is not taking gifts', async () => {
      expect(await screen.findByText(/not taking gifts right now/)).toBeInTheDocument()
    })
    and('there is no M-Pesa prompt form', () => {
      expect(screen.queryByRole('button', { name: /Send M-Pesa prompt/ })).not.toBeInTheDocument()
      expect(screen.queryByTestId('paybill-account')).not.toBeInTheDocument()
    })
  })

  test("A closed campaign's champion page shows the final totals", ({ given, and, when, then }) => {
    givenChampion(given)
    and('the campaign has closed', () => {
      world.champion!.campaign.isAcceptingGifts = false
      world.champion!.campaign.isClosed = true
    })
    openPage(when)
    then('they are told the campaign has closed', async () => {
      expect(await screen.findByRole('status')).toHaveTextContent('This campaign has closed')
      expect(screen.queryByText(/not taking gifts right now/)).not.toBeInTheDocument()
    })
    and(/^they see the champion's total "(.*)" from "(.*)"$/, (total, donors) => {
      const stats = screen.getByTestId('champion-totals')
      expect(within(stats).getByText(total)).toBeInTheDocument()
      expect(within(stats).getByText(donors)).toBeInTheDocument()
    })
    and('there is no M-Pesa prompt form', () => {
      expect(screen.queryByRole('button', { name: /Send M-Pesa prompt/ })).not.toBeInTheDocument()
      expect(screen.queryByTestId('paybill-account')).not.toBeInTheDocument()
    })
    and('they are not asked to share the champion page', () => {
      expect(screen.queryByRole('heading', { name: /^Share / })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument()
    })
  })

  test('An unknown or inactive champion link', ({ given, when, then, and }) => {
    given(/^there is no active champion "(.*)" for "(.*)"$/, () => {
      world.champion = null
    })
    openPage(when)
    then('they are told the champion link could not be found', async () => {
      expect(await screen.findByText(/couldn.t find that champion/i)).toBeInTheDocument()
    })
    campaignLink(and)
  })

  const leaderboardMock = (slug: string, rows: Record<string, unknown>[]): MockedResponse => ({
    request: { query: CAMPAIGN_LEADERBOARD, variables: { slug, limit: 10 } },
    result: {
      data: { campaignLeaderboard: rows.map((r) => ({ __typename: 'LeaderboardEntryType', ...r })) },
    },
    maxUsageCount: 5,
  })

  const showLeaderboard = (when: Step) =>
    when(/^the leaderboard for "(.*)" is shown$/, (slug) => {
      render(
        <MockedProvider mocks={world.leaderboard}>
          <LeaderboardSlot campaign={{ slug, allowChampions: true }} />
        </MockedProvider>,
      )
    })

  const rows = async () => {
    const table = await screen.findByRole('list', { name: /Top champions/ })
    return within(table).getAllByRole('listitem')
  }

  test('The campaign page shows the champion leaderboard', ({ given, when, then, and }) => {
    given(
      /^the campaign "(.*)" has champions "(.*)" "(.*)" with "(.*)" from (\d+) and "(.*)" "(.*)" with "(.*)" from (\d+)$/,
      (slug, n1, c1, r1, d1, n2, c2, r2, d2) => {
        world.leaderboard.push(
          leaderboardMock(slug, [
            { rank: 1, championName: n1, code: c1, raised: r1, donorCount: Number(d1) },
            { rank: 2, championName: n2, code: c2, raised: r2, donorCount: Number(d2) },
          ]),
        )
      },
    )
    showLeaderboard(when)
    const row = async (n: string, name: string, raised: string, donors: string) => {
      const item = (await rows())[Number(n) - 1]
      expect(item).toHaveTextContent(name)
      expect(item).toHaveTextContent(raised)
      expect(item).toHaveTextContent(donors)
    }
    then(/^row (\d+) is "(.*)" with "(.*)" and "(.*)"$/, row)
    and(/^row (\d+) is "(.*)" with "(.*)" and "(.*)"$/, row)
    and(/^"(.*)" links to "(.*)"$/, async (name, href) => {
      expect(await screen.findByRole('link', { name: new RegExp(name) })).toHaveAttribute('href', href)
    })
  })

  test('A campaign with no champions yet', ({ given, when, then }) => {
    given(/^the campaign "(.*)" has no champions yet$/, (slug) => {
      world.leaderboard.push(leaderboardMock(slug, []))
    })
    showLeaderboard(when)
    then('they are invited to become a champion', async () => {
      expect(await screen.findByText(/No champions yet/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /become a champion/i })).toBeInTheDocument()
    })
  })

  test('A campaign without champions shows no leaderboard', ({ when, then }) => {
    let container: HTMLElement
    when('the leaderboard is shown for a campaign that does not allow champions', () => {
      ;({ container } = render(
        <MockedProvider mocks={[]}>
          <LeaderboardSlot campaign={{ slug: 'new-church-roof', allowChampions: false }} />
        </MockedProvider>,
      ))
    })
    then('no leaderboard is shown', () => {
      expect(container).toBeEmptyDOMElement()
    })
  })
})
