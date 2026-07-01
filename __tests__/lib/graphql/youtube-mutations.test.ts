import { describe, it, expect } from 'vitest'
import {
  CREATE_YOUTUBE_VIDEO,
  UPDATE_YOUTUBE_VIDEO,
  DELETE_YOUTUBE_VIDEO,
  TOGGLE_VIDEO_FEATURED,
  SYNC_YOUTUBE_CHANNEL,
  SYNC_YOUTUBE_PLAYLIST,
} from '@/lib/graphql/youtube-mutations'

describe('youtube-mutations', () => {
  it('exports CREATE_YOUTUBE_VIDEO as DocumentNode', () => {
    expect(CREATE_YOUTUBE_VIDEO).toBeDefined()
    expect(CREATE_YOUTUBE_VIDEO.kind).toBe('Document')
  })

  it('CREATE_YOUTUBE_VIDEO contains createYoutubeVideo operation', () => {
    const body = (CREATE_YOUTUBE_VIDEO as any).loc?.source?.body || ''
    expect(body).toContain('createYoutubeVideo')
  })

  it('exports UPDATE_YOUTUBE_VIDEO as DocumentNode', () => {
    expect(UPDATE_YOUTUBE_VIDEO).toBeDefined()
    expect(UPDATE_YOUTUBE_VIDEO.kind).toBe('Document')
  })

  it('UPDATE_YOUTUBE_VIDEO contains updateYoutubeVideo operation', () => {
    const body = (UPDATE_YOUTUBE_VIDEO as any).loc?.source?.body || ''
    expect(body).toContain('updateYoutubeVideo')
  })

  it('exports DELETE_YOUTUBE_VIDEO as DocumentNode', () => {
    expect(DELETE_YOUTUBE_VIDEO).toBeDefined()
    expect(DELETE_YOUTUBE_VIDEO.kind).toBe('Document')
  })

  it('DELETE_YOUTUBE_VIDEO contains deleteYoutubeVideo operation', () => {
    const body = (DELETE_YOUTUBE_VIDEO as any).loc?.source?.body || ''
    expect(body).toContain('deleteYoutubeVideo')
  })

  it('exports TOGGLE_VIDEO_FEATURED as DocumentNode', () => {
    expect(TOGGLE_VIDEO_FEATURED).toBeDefined()
    expect(TOGGLE_VIDEO_FEATURED.kind).toBe('Document')
  })

  it('TOGGLE_VIDEO_FEATURED contains toggleVideoFeatured operation', () => {
    const body = (TOGGLE_VIDEO_FEATURED as any).loc?.source?.body || ''
    expect(body).toContain('toggleVideoFeatured')
  })

  it('exports SYNC_YOUTUBE_CHANNEL as DocumentNode', () => {
    expect(SYNC_YOUTUBE_CHANNEL).toBeDefined()
    expect(SYNC_YOUTUBE_CHANNEL.kind).toBe('Document')
  })

  it('SYNC_YOUTUBE_CHANNEL contains syncYoutubeChannel operation', () => {
    const body = (SYNC_YOUTUBE_CHANNEL as any).loc?.source?.body || ''
    expect(body).toContain('syncYoutubeChannel')
  })

  it('exports SYNC_YOUTUBE_PLAYLIST as DocumentNode', () => {
    expect(SYNC_YOUTUBE_PLAYLIST).toBeDefined()
    expect(SYNC_YOUTUBE_PLAYLIST.kind).toBe('Document')
  })

  it('SYNC_YOUTUBE_PLAYLIST contains syncYoutubePlaylist operation', () => {
    const body = (SYNC_YOUTUBE_PLAYLIST as any).loc?.source?.body || ''
    expect(body).toContain('syncYoutubePlaylist')
  })
})
