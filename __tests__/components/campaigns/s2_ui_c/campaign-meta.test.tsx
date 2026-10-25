import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  campaignMetadata,
  fetchCampaignMeta,
  wholeKes,
  type CampaignMeta,
} from '@/components/campaigns/public/server/campaign-meta'
import { CampaignOgCard } from '@/components/campaigns/public/server/campaign-og-card'

const META: CampaignMeta = {
  slug: 'roof',
  title: 'New Church Roof',
  summary: 'Replace the leaking sheets.',
  daysLeft: 12,
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
    expect(body.query).not.toMatch(/name|phone|member/i)
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
  it('describes the campaign with its totals and summary', () => {
    const m = campaignMetadata('roof', META)
    expect(m.title).toBe('New Church Roof')
    expect(m.description).toBe('KES 24,800 raised of KES 100,000. Replace the leaking sheets.')
    expect(m.alternates?.canonical).toBe('/campaigns/roof')
    expect(m.openGraph).toMatchObject({ type: 'website', url: '/campaigns/roof', title: 'New Church Roof' })
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', title: 'New Church Roof' })
  })

  it('falls back to a general description', () => {
    const m = campaignMetadata('roof', null)
    expect(m.title).toBe('Campaign')
    expect(String(m.description)).toMatch(/SDA Church Kawangware/)
    expect(m.alternates?.canonical).toBe('/campaigns/roof')
  })
})

describe('wholeKes', () => {
  it('rounds to whole shillings', () => {
    expect(wholeKes('24800.60')).toBe('KES 24,801')
    expect(wholeKes('oops')).toBe('KES 0')
  })
})

describe('CampaignOgCard', () => {
  it('shows the title and progress', () => {
    render(<CampaignOgCard meta={META} />)
    expect(screen.getByText('New Church Roof')).toBeInTheDocument()
    expect(screen.getByText('KES 24,800')).toBeInTheDocument()
    expect(screen.getByText('raised of KES 100,000')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('shows a general card without a campaign', () => {
    render(<CampaignOgCard meta={null} />)
    expect(screen.getByText('Give to a church campaign')).toBeInTheDocument()
  })
})
