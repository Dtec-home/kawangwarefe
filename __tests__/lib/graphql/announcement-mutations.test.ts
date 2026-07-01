import { describe, it, expect } from 'vitest'
import {
  CREATE_ANNOUNCEMENT,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
  TOGGLE_ANNOUNCEMENT_ACTIVE,
} from '@/lib/graphql/announcement-mutations'

describe('announcement-mutations', () => {
  it('exports CREATE_ANNOUNCEMENT as DocumentNode', () => {
    expect(CREATE_ANNOUNCEMENT).toBeDefined()
    expect(CREATE_ANNOUNCEMENT.kind).toBe('Document')
  })

  it('CREATE_ANNOUNCEMENT contains createAnnouncement operation', () => {
    const body = (CREATE_ANNOUNCEMENT as any).loc?.source?.body || ''
    expect(body).toContain('createAnnouncement')
  })

  it('exports UPDATE_ANNOUNCEMENT as DocumentNode', () => {
    expect(UPDATE_ANNOUNCEMENT).toBeDefined()
    expect(UPDATE_ANNOUNCEMENT.kind).toBe('Document')
  })

  it('UPDATE_ANNOUNCEMENT contains updateAnnouncement operation', () => {
    const body = (UPDATE_ANNOUNCEMENT as any).loc?.source?.body || ''
    expect(body).toContain('updateAnnouncement')
  })

  it('exports DELETE_ANNOUNCEMENT as DocumentNode', () => {
    expect(DELETE_ANNOUNCEMENT).toBeDefined()
    expect(DELETE_ANNOUNCEMENT.kind).toBe('Document')
  })

  it('DELETE_ANNOUNCEMENT contains deleteAnnouncement operation', () => {
    const body = (DELETE_ANNOUNCEMENT as any).loc?.source?.body || ''
    expect(body).toContain('deleteAnnouncement')
  })

  it('exports TOGGLE_ANNOUNCEMENT_ACTIVE as DocumentNode', () => {
    expect(TOGGLE_ANNOUNCEMENT_ACTIVE).toBeDefined()
    expect(TOGGLE_ANNOUNCEMENT_ACTIVE.kind).toBe('Document')
  })

  it('TOGGLE_ANNOUNCEMENT_ACTIVE contains toggleAnnouncementActive operation', () => {
    const body = (TOGGLE_ANNOUNCEMENT_ACTIVE as any).loc?.source?.body || ''
    expect(body).toContain('toggleAnnouncementActive')
  })
})
