import { describe, it, expect, vi } from 'vitest'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ body, init }),
  },
}))

import { GET } from '@/app/api/version/route'

describe('GET /api/version', () => {
  it('returns version from env', () => {
    process.env.NEXT_PUBLIC_BUILD_ID = 'test-build-123'
    const result = GET({} as any) as any
    expect(result.body.version).toBe('test-build-123')
  })

  it('returns "dev" when no build ID set', () => {
    delete process.env.NEXT_PUBLIC_BUILD_ID
    const result = GET({} as any) as any
    expect(result.body.version).toBe('dev')
  })

  it('sets no-store cache header', () => {
    const result = GET({} as any) as any
    expect(result.init.headers['Cache-Control']).toContain('no-store')
  })
})
