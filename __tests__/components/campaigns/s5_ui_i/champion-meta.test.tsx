import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  championMetadata,
  fetchChampionMeta,
  type ChampionMeta,
} from '@/components/champions/public/server/champion-meta'
import { ChampionOgCard } from '@/components/champions/public/server/champion-og-card'

const META: ChampionMeta = {
  championName: 'Mary Wanjiku',
  code: 'MARY',
  raised: '12500.00',
  donorCount: 9,
  personalTarget: '50000.00',
  campaign: {
    slug: 'roof',
    title: 'New Church Roof',
    summary: 'Replace the leaking sheets.',
    progress: { target: '100000.00', raised: '24800.00', percent: 24.8 },
  },
}

const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body))) as unknown as typeof fetch

describe('fetchChampionMeta', () => {
  it('posts the publicChampion query with the slug and code, asking for no donor details', async () => {
    const fetchImpl = ok({ data: { publicChampion: META } })
    await expect(fetchChampionMeta('roof', 'MARY', { fetchImpl, endpoint: 'https://api.example/graphql/' })).resolves.toEqual(
      META,
    )
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.example/graphql/')
    const body = JSON.parse(init.body)
    expect(body.variables).toEqual({ slug: 'roof', code: 'MARY' })
    expect(body.query).toContain('publicChampion(slug: $slug, code: $code)')
    expect(body.query).not.toMatch(/phone|member|donors\s*\{/i)
  })

  it('returns null for an unknown champion, errors, a bad status, bad JSON or a network failure', async () => {
    expect(await fetchChampionMeta('x', 'y', { fetchImpl: ok({ data: { publicChampion: null } }) })).toBeNull()
    expect(await fetchChampionMeta('x', 'y', { fetchImpl: ok({ errors: [{ message: 'boom' }] }) })).toBeNull()
    const bad = vi.fn(async () => new Response('nope', { status: 502 })) as unknown as typeof fetch
    expect(await fetchChampionMeta('x', 'y', { fetchImpl: bad })).toBeNull()
    const html = vi.fn(async () => new Response('<html>')) as unknown as typeof fetch
    expect(await fetchChampionMeta('x', 'y', { fetchImpl: html })).toBeNull()
    const down = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    }) as unknown as typeof fetch
    expect(await fetchChampionMeta('x', 'y', { fetchImpl: down })).toBeNull()
  })
})

describe('championMetadata', () => {
  it("names the champion, the campaign and the champion's total", () => {
    const md = championMetadata('roof', 'MARY', META)
    expect(md.title).toBe('Mary Wanjiku for New Church Roof')
    expect(md.description).toBe('Mary Wanjiku has raised KES 12,500 for New Church Roof. Replace the leaking sheets.')
    expect(md.alternates?.canonical).toBe('/campaigns/roof/c/MARY')
  })

  it('falls back when the champion is unknown', () => {
    const md = championMetadata('roof', 'MARY', null)
    expect(md.title).toBe('Campaign champion')
    expect(md.description).toMatch(/fundraising campaign/)
  })
})

describe('ChampionOgCard', () => {
  it("shows the champion's total and target percentage", () => {
    render(<ChampionOgCard meta={META} />)
    expect(screen.getByText('Raised by Mary Wanjiku')).toBeInTheDocument()
    expect(screen.getByText('KES 12,500')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('leaves out the bar without a personal target, and falls back without data', () => {
    const { unmount } = render(<ChampionOgCard meta={{ ...META, personalTarget: null }} />)
    expect(screen.getByText('raised')).toBeInTheDocument()
    expect(screen.queryByText('25%')).not.toBeInTheDocument()
    unmount()
    render(<ChampionOgCard meta={null} />)
    expect(screen.getByText('Give through a church champion')).toBeInTheDocument()
  })
})
