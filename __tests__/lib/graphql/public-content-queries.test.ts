import { describe, it, expect } from 'vitest'
import {
  GET_ALL_ANNOUNCEMENTS,
  GET_ALL_DEVOTIONALS,
  GET_ALL_EVENTS,
  GET_ALL_VIDEOS,
} from '@/lib/graphql/public-content-queries'

describe('public-content-queries', () => {
  it('exports GET_ALL_ANNOUNCEMENTS as DocumentNode', () => {
    expect(GET_ALL_ANNOUNCEMENTS).toBeDefined()
    expect(GET_ALL_ANNOUNCEMENTS.kind).toBe('Document')
  })

  it('GET_ALL_ANNOUNCEMENTS contains announcements query', () => {
    const body = (GET_ALL_ANNOUNCEMENTS as any).loc?.source?.body || ''
    expect(body).toContain('announcements')
  })

  it('exports GET_ALL_DEVOTIONALS as DocumentNode', () => {
    expect(GET_ALL_DEVOTIONALS).toBeDefined()
    expect(GET_ALL_DEVOTIONALS.kind).toBe('Document')
  })

  it('GET_ALL_DEVOTIONALS contains devotionals query', () => {
    const body = (GET_ALL_DEVOTIONALS as any).loc?.source?.body || ''
    expect(body).toContain('devotionals')
  })

  it('exports GET_ALL_EVENTS as DocumentNode', () => {
    expect(GET_ALL_EVENTS).toBeDefined()
    expect(GET_ALL_EVENTS.kind).toBe('Document')
  })

  it('GET_ALL_EVENTS contains events query', () => {
    const body = (GET_ALL_EVENTS as any).loc?.source?.body || ''
    expect(body).toContain('events')
  })

  it('exports GET_ALL_VIDEOS as DocumentNode', () => {
    expect(GET_ALL_VIDEOS).toBeDefined()
    expect(GET_ALL_VIDEOS.kind).toBe('Document')
  })

  it('GET_ALL_VIDEOS contains youtubeVideos query', () => {
    const body = (GET_ALL_VIDEOS as any).loc?.source?.body || ''
    expect(body).toContain('youtubeVideos')
  })
})
