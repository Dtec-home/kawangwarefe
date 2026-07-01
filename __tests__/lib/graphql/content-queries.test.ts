import { describe, it, expect } from 'vitest'
import {
  GET_LANDING_PAGE_CONTENT,
  GET_DEVOTIONAL,
  GET_EVENT,
} from '@/lib/graphql/content-queries'

describe('content-queries', () => {
  it('exports GET_LANDING_PAGE_CONTENT as DocumentNode', () => {
    expect(GET_LANDING_PAGE_CONTENT).toBeDefined()
    expect(GET_LANDING_PAGE_CONTENT.kind).toBe('Document')
  })

  it('GET_LANDING_PAGE_CONTENT contains announcements query', () => {
    const body = (GET_LANDING_PAGE_CONTENT as any).loc?.source?.body || ''
    expect(body).toContain('announcements')
    expect(body).toContain('devotionals')
    expect(body).toContain('events')
    expect(body).toContain('youtubeVideos')
  })

  it('exports GET_DEVOTIONAL as DocumentNode', () => {
    expect(GET_DEVOTIONAL).toBeDefined()
    expect(GET_DEVOTIONAL.kind).toBe('Document')
  })

  it('GET_DEVOTIONAL contains devotional query', () => {
    const body = (GET_DEVOTIONAL as any).loc?.source?.body || ''
    expect(body).toContain('devotional')
  })

  it('exports GET_EVENT as DocumentNode', () => {
    expect(GET_EVENT).toBeDefined()
    expect(GET_EVENT.kind).toBe('Document')
  })

  it('GET_EVENT contains event query', () => {
    const body = (GET_EVENT as any).loc?.source?.body || ''
    expect(body).toContain('event')
  })
})
