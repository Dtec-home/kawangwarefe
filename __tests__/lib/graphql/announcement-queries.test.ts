import { describe, it, expect } from 'vitest'
import { GET_ALL_ANNOUNCEMENTS } from '@/lib/graphql/announcement-queries'

describe('announcement-queries', () => {
  it('exports GET_ALL_ANNOUNCEMENTS as DocumentNode', () => {
    expect(GET_ALL_ANNOUNCEMENTS).toBeDefined()
    expect(GET_ALL_ANNOUNCEMENTS.kind).toBe('Document')
  })

  it('GET_ALL_ANNOUNCEMENTS contains announcements query', () => {
    const body = (GET_ALL_ANNOUNCEMENTS as any).loc?.source?.body || ''
    expect(body).toContain('announcements')
  })
})
