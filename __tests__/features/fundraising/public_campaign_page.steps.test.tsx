/**
 * Binding for `fundraising/public_campaign_page.feature` (S2-UI-C, tickets 2.7–2.9).
 *
 * Drives the real public list and campaign page views through Apollo's
 * MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { vi } from 'vitest'

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/campaigns',
  useSearchParams: () => nav.params,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null }) }))

import { PUBLIC_CAMPAIGNS, PUBLIC_CAMPAIGN_PAGE, PUBLIC_CAMPAIGN_SHARE } from '@/lib/graphql/fundraising/public'
import { ConfirmationCampaignShare } from '@/components/campaigns/public/confirmation-campaign-share'
import { PUBLIC_CAMPAIGN_FOR_GIVING } from '@/lib/graphql/fundraising/give'
import { CampaignListView } from '@/components/campaigns/public/campaign-list-view'
import { CampaignPageView } from '@/components/campaigns/public/campaign-page-view'
import { campaignMetadata, fetchCampaignMeta } from '@/components/campaigns/public/server/campaign-meta'
import type { Metadata } from 'next'

const feature = loadFeature('./public_campaign_page.feature', { loadRelativePath: true })

const slugOf = (title: string) => title.toLowerCase().replace(/\s+/g, '-')

const PROGRESS = {
  __typename: 'CampaignProgressType',
  target: '100000.00',
  raised: '24800.00',
  remaining: '75200.00',
  percent: 24.8,
  donorCount: 37,
  giftCount: 41,
  pledged: '0.00',
}

const PAYMENT = {
  __typename: 'PaymentInstructionsType',
  paybillNumber: '247247',
  accountReference: 'BUILD',
  text: 'Pay Bill 247247, Account BUILD',
}

function card(title: string) {
  return {
    __typename: 'PublicCampaignType',
    slug: slugOf(title),
    title,
    summary: `Help us with the ${title.toLowerCase()}.`,
    coverImageUrl: title === 'New Church Roof' ? 'https://images.example/roof.jpg' : '',
    endDate: '2026-11-01',
    daysLeft: 12,
    isAcceptingGifts: true,
    progress: PROGRESS,
  }
}

function pageCampaign(slug: string, title: string, accepting: boolean) {
  return {
    __typename: 'PublicCampaignType',
    slug,
    title,
    summary: 'Replace the leaking iron sheets before the long rains.',
    story:
      'Our roof has leaked for three rainy seasons.\n\nWith your help we will replace every sheet\nbefore December.',
    coverImageUrl: 'https://images.example/roof.jpg',
    gallery: [
      { __typename: 'GalleryItemType', kind: 'image', url: 'https://images.example/sheets.jpg' },
      { __typename: 'GalleryItemType', kind: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      { __typename: 'GalleryItemType', kind: 'youtube', url: 'javascript:alert(1)' },
    ],
    targetAmount: '100000.00',
    endDate: '2026-11-01',
    daysLeft: 12,
    isAcceptingGifts: accepting,
    allowPledges: true,
    allowChampions: false,
    publicUrl: `https://church.example/campaigns/${slug}`,
    paymentInstructions: PAYMENT,
    progress: PROGRESS,
    updates: [
      {
        __typename: 'CampaignUpdateType',
        id: '1',
        title: 'We have started',
        body: 'The old sheets are off.',
        imageUrl: '',
        publishedAt: '2026-10-01T09:00:00+03:00',
      },
      {
        __typename: 'CampaignUpdateType',
        id: '2',
        title: 'Sheets delivered',
        body: 'The new sheets arrived today.',
        imageUrl: '',
        publishedAt: '2026-10-15T09:00:00+03:00',
      },
    ],
  }
}

function givingMock(slug: string, title: string, accepting: boolean): MockedResponse {
  return {
    request: { query: PUBLIC_CAMPAIGN_FOR_GIVING, variables: { slug } },
    result: {
      data: {
        publicCampaign: {
          __typename: 'PublicCampaignType',
          slug,
          title,
          summary: 'Replace the leaking iron sheets before the long rains.',
          isAcceptingGifts: accepting,
          categoryId: '4',
          purposeId: null,
          campaignId: '42',
          paymentInstructions: PAYMENT,
          progress: PROGRESS,
        },
      },
    },
    maxUsageCount: 5,
  }
}

interface World {
  mocks: MockedResponse[]
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    world = { mocks: [] }
    nav.params = new URLSearchParams()
  })
  afterEach(cleanup)

  const givenCampaign = (given: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    given(/^the campaign "(.*)" "(.*)" is (accepting|not accepting) gifts$/, (slug, title, state) => {
      const accepting = state === 'accepting'
      world.mocks.push({
        request: { query: PUBLIC_CAMPAIGN_PAGE, variables: { slug } },
        result: { data: { publicCampaign: pageCampaign(slug, title, accepting) } },
        maxUsageCount: 5,
      })
      world.mocks.push(givingMock(slug, title, accepting))
      const { slug: s, title: t, publicUrl, paymentInstructions } = pageCampaign(slug, title, accepting)
      world.mocks.push({
        request: { query: PUBLIC_CAMPAIGN_SHARE, variables: { slug } },
        result: { data: { publicCampaign: { __typename: 'PublicCampaignType', slug: s, title: t, publicUrl, paymentInstructions } } },
        maxUsageCount: 5,
      })
    })

  const openPage = (when: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    when(/^a visitor opens the campaign page "(.*)"$/, (slug) => {
      render(
        <MockedProvider mocks={world.mocks}>
          <CampaignPageView slug={slug} />
        </MockedProvider>,
      )
    })

  const openList = () => {
    render(
      <MockedProvider mocks={world.mocks}>
        <CampaignListView />
      </MockedProvider>,
    )
  }

  const cardFor = async (title: string) => {
    const heading = await screen.findByRole('heading', { name: title })
    return heading.closest('[data-slot="public-campaign-card"]') as HTMLElement
  }

  test('A visitor browses the active campaigns', ({ given, when, then, and }) => {
    given(/^the active campaigns "(.*)" and "(.*)"$/, (a, b) => {
      world.mocks.push({
        request: { query: PUBLIC_CAMPAIGNS },
        result: { data: { publicCampaigns: [card(a), card(b)] } },
      })
    })
    when('a visitor opens the campaigns page', openList)
    then(/^they see a card for "(.*)" with "(.*)" raised$/, async (title, raised) => {
      const el = await cardFor(title)
      expect(within(el).getByText(raised)).toBeInTheDocument()
    })
    and(/^they see a card for "(.*)"$/, async (title) => {
      expect(await cardFor(title)).toBeInTheDocument()
    })
    and(/^the card for "(.*)" says "(.*)"$/, async (title, text) => {
      expect(within(await cardFor(title)).getByText(text)).toBeInTheDocument()
    })
    and(/^the card for "(.*)" links to "(.*)"$/, async (title, href) => {
      const link = within(await cardFor(title)).getByRole('link', { name: new RegExp(title) })
      expect(link).toHaveAttribute('href', href)
    })
  })

  test('There are no active campaigns', ({ given, when, then }) => {
    given('there are no active campaigns', () => {
      world.mocks.push({ request: { query: PUBLIC_CAMPAIGNS }, result: { data: { publicCampaigns: [] } } })
    })
    when('a visitor opens the campaigns page', openList)
    then('they are told there are no campaigns to give to right now', async () => {
      expect(await screen.findByText(/no campaigns to give to right now/i)).toBeInTheDocument()
    })
  })

  test("A visitor reads a campaign's page", ({ given, when, then, and }) => {
    givenCampaign(given)
    openPage(when)
    then(/^they see the heading "(.*)"$/, async (title) => {
      expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    })
    and(/^they see the story in (\d+) paragraphs$/, (count) => {
      const story = document.querySelector('[data-slot="campaign-story"]') as HTMLElement
      expect(story.querySelectorAll('p')).toHaveLength(Number(count))
      expect(story.textContent).toContain('Our roof has leaked')
    })
    and(/^they see "(.*)" raised from "(.*)"$/, (raised, donors) => {
      expect(screen.getAllByText(raised).length).toBeGreaterThan(0)
      expect(screen.getAllByText(donors).length).toBeGreaterThan(0)
    })
    and(/^they see "(.*)"$/, (text) => {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0)
    })
    and(/^they see the updates newest first: "(.*)", "(.*)"$/, (first, second) => {
      const timeline = document.querySelector('[data-slot="campaign-updates"]') as HTMLElement
      const titles = within(timeline)
        .getAllByRole('heading')
        .map((h) => h.textContent)
        .filter((t) => t !== 'Updates')
      expect(titles).toEqual([first, second])
    })
    and('no donor is named on the page', () => {
      // The data the page receives carries totals only; nothing renders a
      // "given by" line or a name list.
      expect(screen.queryByText(/given by|donated by|contributors:/i)).not.toBeInTheDocument()
    })
  })

  test('The gallery shows pictures and embeds YouTube videos safely', ({ given, when, then, and }) => {
    givenCampaign(given)
    openPage(when)
    then(/^the gallery shows (\d+) picture$/, async (count) => {
      await screen.findByRole('heading', { level: 1 })
      const gallery = document.querySelector('[data-slot="campaign-gallery"]') as HTMLElement
      expect(gallery.querySelectorAll('img')).toHaveLength(Number(count))
    })
    and(/^the gallery embeds the YouTube video "(.*)" without tracking cookies$/, (id) => {
      const frame = document.querySelector('[data-slot="campaign-gallery"] iframe') as HTMLIFrameElement
      expect(frame.getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${id}`)
    })
    and('the gallery leaves out the link that is not a real video', () => {
      const gallery = document.querySelector('[data-slot="campaign-gallery"]') as HTMLElement
      expect(gallery.querySelectorAll('iframe')).toHaveLength(1)
      expect(gallery.innerHTML).not.toContain('javascript:')
    })
  })

  test('A visitor gives from the campaign page', ({ given, when, then, and }) => {
    givenCampaign(given)
    openPage(when)
    then('they see the M-Pesa give form for the campaign', async () => {
      expect(await screen.findByRole('button', { name: /send m-pesa prompt/i })).toBeInTheDocument()
      expect(document.querySelector('[data-slot="campaign-give-panel"]')).not.toBeNull()
    })
    and(/^they see the Pay Bill account "(.*)"$/, (account) => {
      const panel = document.querySelector('[data-slot="campaign-give-panel"]') as HTMLElement
      expect(within(panel).getAllByText(account).length).toBeGreaterThan(0)
    })
    and(/^they are told "(.*)"$/, (notice) => {
      expect(screen.getByText(notice)).toBeInTheDocument()
    })
  })

  test('A visitor shares the campaign', ({ given, when, then, and }) => {
    let whatsappText = ''
    givenCampaign(given)
    openPage(when)
    then(/^they can share the campaign on WhatsApp with the message "(.*)"$/, async (message) => {
      const link = await screen.findByRole('link', { name: /whatsapp/i })
      whatsappText = decodeURIComponent((link.getAttribute('href') ?? '').replace('https://wa.me/?text=', ''))
      expect(whatsappText.startsWith(`${message} `)).toBe(true)
    })
    and(/^the shared link is "(.*)"$/, (url) => {
      expect(whatsappText.endsWith(` ${url}`)).toBe(true)
    })
  })

  test('A paused campaign takes no gifts', ({ given, when, then, and }) => {
    givenCampaign(given)
    openPage(when)
    then('they see a notice that the campaign is not taking gifts right now', async () => {
      expect(await screen.findByText(/not taking gifts right now/i)).toBeInTheDocument()
    })
    and('there is no give form', () => {
      expect(document.querySelector('[data-slot="campaign-give-panel"]')).toBeNull()
      expect(screen.queryByRole('button', { name: /send m-pesa prompt/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/listed by name and amount/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument()
    })
  })

  test('An unknown campaign link', ({ given, when, then, and }) => {
    given(/^there is no public campaign "(.*)"$/, (slug) => {
      world.mocks.push({
        request: { query: PUBLIC_CAMPAIGN_PAGE, variables: { slug } },
        result: { data: { publicCampaign: null } },
      })
    })
    openPage(when)
    then('they are told the campaign could not be found', async () => {
      expect(await screen.findByText(/couldn.t find that campaign/i)).toBeInTheDocument()
    })
    and('they are offered a link to all campaigns', () => {
      expect(screen.getByRole('link', { name: /see all campaigns/i })).toHaveAttribute('href', '/campaigns')
    })
  })

  const previewSteps = (when: (m: RegExp, fn: (...a: string[]) => Promise<void>) => void, getFetch: () => typeof fetch, set: (m: Metadata) => void) =>
    when(/^the link preview for "(.*)" is built$/, async (slug) => {
      const meta = await fetchCampaignMeta(slug, { fetchImpl: getFetch(), endpoint: 'https://api.example/graphql/' })
      set(campaignMetadata(slug, meta))
    })

  test('A shared campaign link shows a rich preview', ({ given, when, then, and }) => {
    let fetchImpl: typeof fetch
    let metadata: Metadata = {}
    given(/^the church API describes the campaign "(.*)" "(.*)"$/, (slug, title) => {
      const campaign = pageCampaign(slug, title, true)
      fetchImpl = vi.fn(async () => new Response(JSON.stringify({ data: { publicCampaign: campaign } }))) as unknown as typeof fetch
    })
    previewSteps(when, () => fetchImpl, (m) => (metadata = m))
    then(/^the preview title is "(.*)"$/, (title) => {
      expect(metadata.title).toBe(title)
      expect(metadata.openGraph?.title).toBe(title)
    })
    and(/^the preview description says "(.*)"$/, (text) => {
      expect(String(metadata.description)).toContain(text)
      expect(String(metadata.openGraph?.description)).toContain(text)
    })
    and(/^the preview points to "(.*)"$/, (path) => {
      expect(metadata.alternates?.canonical).toBe(path)
      expect(metadata.openGraph?.url).toBe(path)
    })
    and('the preview is a large-image card', () => {
      expect((metadata.twitter as { card?: string })?.card).toBe('summary_large_image')
    })
  })

  test('The link preview still works when the church API is unreachable', ({ given, when, then, and }) => {
    let fetchImpl: typeof fetch
    let metadata: Metadata = {}
    given('the church API cannot be reached', () => {
      fetchImpl = vi.fn(async () => {
        throw new TypeError('fetch failed')
      }) as unknown as typeof fetch
    })
    previewSteps(when, () => fetchImpl, (m) => (metadata = m))
    then(/^the preview title is "(.*)"$/, (title) => {
      expect(metadata.title).toBe(title)
    })
    and(/^the preview points to "(.*)"$/, (path) => {
      expect(metadata.alternates?.canonical).toBe(path)
    })
  })

  const openConfirmation = (params: string) => {
    nav.params = new URLSearchParams(params)
    render(
      <MockedProvider mocks={world.mocks}>
        <ConfirmationCampaignShare />
      </MockedProvider>,
    )
  }

  test('After giving to a campaign the giver is invited to share it', ({ given, when, then, and }) => {
    givenCampaign(given)
    when(/^the giver reaches the confirmation page for campaign "(.*)"$/, (slug) => {
      openConfirmation(`contributionId=9&checkoutRequestId=ws_1&campaign=${slug}`)
    })
    then(/^they see "(.*)" for "(.*)"$/, async (heading, title) => {
      const card = (await screen.findByRole('heading', { name: heading })).closest(
        '[data-slot="campaign-share-card"]',
      ) as HTMLElement
      expect(within(card).getByText(title)).toBeInTheDocument()
    })
    and(/^the WhatsApp share link points to "(.*)"$/, (url) => {
      const href = screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href') ?? ''
      expect(decodeURIComponent(href).endsWith(` ${url}`)).toBe(true)
    })
  })

  test('After giving without a campaign there is nothing to share', ({ when, then }) => {
    let container: HTMLElement
    when('the giver reaches the confirmation page without a campaign', () => {
      nav.params = new URLSearchParams('contributionId=9&checkoutRequestId=ws_1')
      container = render(
        <MockedProvider mocks={[]}>
          <ConfirmationCampaignShare />
        </MockedProvider>,
      ).container
    })
    then('they are not asked to share a campaign', async () => {
      await new Promise((r) => setTimeout(r, 20))
      expect(container.innerHTML).toBe('')
    })
  })
})
