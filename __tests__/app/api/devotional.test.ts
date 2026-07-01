import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock NextResponse so the route's JSON helper is observable in tests.
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ body, init: init ?? {} }),
  },
}))

import { GET } from '@/app/api/devotional/route'

const SAMPLE_HTML = `
  <html><body>
    <h1 class="page-title pull-left">A Cheerful Heart</h1>
    <div class="egw_content_wrapper">Proverbs 17:22</div>
    <div class="egw_content_wrapper">A merry heart doeth good   like a medicine.</div>
    <div class="egw_content_wrapper">The second paragraph of the reading.</div>
  </body></html>
`

describe('GET /api/devotional', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrapes and returns the daily devotional', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: async () => SAMPLE_HTML })
    )

    const result = (await GET()) as any
    const { devotional } = result.body

    expect(devotional.title).toBe('A Cheerful Heart')
    expect(devotional.author).toBe('Ellen G. White')
    // First wrapper paragraph becomes the scripture reference.
    expect(devotional.scriptureReference).toBe('Proverbs 17:22')
    // Remaining paragraphs become the content (whitespace collapsed).
    expect(devotional.content).toContain('A merry heart doeth good like a medicine.')
    expect(devotional.content).toContain('The second paragraph of the reading.')
    expect(devotional.isFeatured).toBe(true)
    expect(devotional.id).toMatch(/^egw-\d{2}-\d{2}$/)
  })

  it('returns a 500 error when the upstream fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => '' })
    )

    const result = (await GET()) as any

    expect(result.init.status).toBe(500)
    expect(result.body.error).toContain('Failed to fetch daily devotional')
  })

  it('falls back to a generated title when the page has no heading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><div class="egw_content_wrapper">Psalm 23</div></body></html>',
      })
    )

    const result = (await GET()) as any
    expect(result.body.devotional.title).toMatch(/^Devotional for /)
  })
})
