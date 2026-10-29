import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  asAt,
  campaignMetadata,
  fetchCampaignMeta,
  previewImagePath,
  wholeKes,
  type CampaignMeta,
} from '@/components/campaigns/public/server/campaign-meta'
import { CampaignOgCard } from '@/components/campaigns/public/server/campaign-og-card'

const META: CampaignMeta = {
  slug: 'roof',
  title: 'New Church Roof',
  summary: 'Replace the leaking sheets.',
  daysLeft: 12,
  previewVersion: '6f366aa3',
  progress: { target: '100000.00', raised: '24800.00', percent: 24.8, donorCount: 37 },
}

const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body))) as unknown as typeof fetch

describe('fetchCampaignMeta', () => {
  it('posts the publicCampaign query with the slug', async () => {
    const fetchImpl = ok({ data: { publicCampaign: META } })
    await expect(fetchCampaignMeta('roof', { fetchImpl, endpoint: 'https://api.example/graphql/' })).resolves.toEqual(META)
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.example/graphql/')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.variables).toEqual({ slug: 'roof' })
    expect(body.query).toContain('publicCampaign(slug: $slug)')
    expect(body.query).toContain('previewVersion')
    expect(body.query).not.toMatch(/name|phone|member/i)
  })

  it('never caches, and proves itself to the API with the preview token', async () => {
    const fetchImpl = ok({ data: { publicCampaign: META } })
    await fetchCampaignMeta('roof', { fetchImpl, previewToken: 'preview-secret' })
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.cache).toBe('no-store')
    expect(init.next).toBeUndefined()
    expect(init.headers['X-Preview-Token']).toBe('preview-secret')
  })

  it('sends no token header when none is configured', async () => {
    const fetchImpl = ok({ data: { publicCampaign: META } })
    await fetchCampaignMeta('roof', { fetchImpl, previewToken: '' })
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('returns null for an unknown campaign, GraphQL errors, a bad status or bad JSON', async () => {
    expect(await fetchCampaignMeta('x', { fetchImpl: ok({ data: { publicCampaign: null } }) })).toBeNull()
    expect(await fetchCampaignMeta('x', { fetchImpl: ok({ errors: [{ message: 'boom' }] }) })).toBeNull()
    const bad = vi.fn(async () => new Response('nope', { status: 502 })) as unknown as typeof fetch
    expect(await fetchCampaignMeta('x', { fetchImpl: bad })).toBeNull()
    const html = vi.fn(async () => new Response('<html>')) as unknown as typeof fetch
    expect(await fetchCampaignMeta('x', { fetchImpl: html })).toBeNull()
  })

  it('returns null when the API cannot be reached', async () => {
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    expect(await fetchCampaignMeta('x', { fetchImpl: down })).toBeNull()
  })
})

describe('campaignMetadata', () => {
  // 18:05 in Nairobi
  const NOW = new Date('2026-10-28T15:05:00Z')

  it('describes the campaign in the leaderboard post\'s words, with its summary', () => {
    const m = campaignMetadata('roof', META, NOW)
    expect(m.title).toBe('New Church Roof')
    expect(m.description).toBe(
      'Raised: KES 24,800 (24.8%) · Target: KES 100,000 · 37 givers · as at 28 Oct, 6:05pm. Replace the leaking sheets.',
    )
    expect(m.alternates?.canonical).toBe('/campaigns/roof')
    expect(m.openGraph).toMatchObject({ type: 'website', url: '/campaigns/roof', title: 'New Church Roof' })
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', title: 'New Church Roof' })
  })

  it('points the preview image at the versioned image route', () => {
    const m = campaignMetadata('roof', META, NOW)
    const images = m.openGraph?.images as { url: string }[]
    expect(images[0].url).toBe('/campaigns/roof/og?v=6f366aa3')
    expect((m.twitter as { images?: { url: string }[] }).images?.[0].url).toBe('/campaigns/roof/og?v=6f366aa3')
    expect(previewImagePath('roof', null)).toBe('/campaigns/roof/og')
  })

  it('falls back to an honest general description, never zero or old figures', () => {
    const m = campaignMetadata('roof', null)
    expect(m.title).toBe('Campaign')
    expect(String(m.description)).toMatch(/SDA Church Kawangware/)
    expect(String(m.description)).toMatch(/See the latest totals on the campaign page/)
    expect(String(m.description)).not.toMatch(/KES/)
    expect(m.alternates?.canonical).toBe('/campaigns/roof')
  })
})

describe('wholeKes', () => {
  it('rounds to whole shillings', () => {
    expect(wholeKes('24800.60')).toBe('KES 24,801')
    expect(wholeKes('oops')).toBe('KES 0')
  })

  // Shared with church_BE tests/unit/fundraising/dc_7 (format_kes): the leaderboard
  // post and the link preview must print every amount the same way.
  it.each([
    ['0', 'KES 0'], ['2', 'KES 2'], ['999.49', 'KES 999'], ['999.5', 'KES 1,000'],
    ['1240500', 'KES 1,240,500'], ['1240500.5', 'KES 1,240,501'], ['2000000.00', 'KES 2,000,000'],
  ])('prints %s as the backend does: %s', (amount, expected) => {
    expect(wholeKes(amount)).toBe(expected)
  })
})

describe('asAt', () => {
  it.each([
    ['2026-10-28T15:05:00Z', '28 Oct, 6:05pm'],
    ['2026-10-20T15:00:00Z', '20 Oct, 6pm'],
    ['2026-10-20T21:30:00Z', '21 Oct, 12:30am'],
    ['2026-10-21T09:00:00Z', '21 Oct, 12pm'],
  ])('%s is "%s" in Nairobi, as the leaderboard writes it', (iso, expected) => {
    expect(asAt(new Date(iso))).toBe(expected)
  })
})

describe('CampaignOgCard', () => {
  it('shows the title and progress', () => {
    render(<CampaignOgCard meta={META} />)
    expect(screen.getByText('New Church Roof')).toBeInTheDocument()
    expect(screen.getByText('KES 24,800')).toBeInTheDocument()
    expect(screen.getByText('raised of KES 100,000')).toBeInTheDocument()
    expect(screen.getByText('24.8%')).toBeInTheDocument()
  })

  it('shows a general card without a campaign', () => {
    render(<CampaignOgCard meta={null} />)
    expect(screen.getByText('Give to a church campaign')).toBeInTheDocument()
  })
})
