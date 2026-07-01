import { describe, it, expect } from 'vitest'
import {
  GET_ALL_DEVOTIONALS,
  GET_DEVOTIONAL,
} from '@/lib/graphql/devotional-queries'

describe('devotional-queries', () => {
  it('exports GET_ALL_DEVOTIONALS as DocumentNode', () => {
    expect(GET_ALL_DEVOTIONALS).toBeDefined()
    expect(GET_ALL_DEVOTIONALS.kind).toBe('Document')
  })

  it('GET_ALL_DEVOTIONALS contains devotionals query', () => {
    const body = (GET_ALL_DEVOTIONALS as any).loc?.source?.body || ''
    expect(body).toContain('devotionals')
  })

  it('exports GET_DEVOTIONAL as DocumentNode', () => {
    expect(GET_DEVOTIONAL).toBeDefined()
    expect(GET_DEVOTIONAL.kind).toBe('Document')
  })

  it('GET_DEVOTIONAL contains devotional query', () => {
    const body = (GET_DEVOTIONAL as any).loc?.source?.body || ''
    expect(body).toContain('devotional')
  })
})
