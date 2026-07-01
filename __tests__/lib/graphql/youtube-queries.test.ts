import { describe, it, expect } from 'vitest'
import {
  GET_ALL_YOUTUBE_VIDEOS,
  GET_YOUTUBE_VIDEO,
} from '@/lib/graphql/youtube-queries'

describe('youtube-queries', () => {
  it('exports GET_ALL_YOUTUBE_VIDEOS as DocumentNode', () => {
    expect(GET_ALL_YOUTUBE_VIDEOS).toBeDefined()
    expect(GET_ALL_YOUTUBE_VIDEOS.kind).toBe('Document')
  })

  it('GET_ALL_YOUTUBE_VIDEOS contains youtubeVideos query', () => {
    const body = (GET_ALL_YOUTUBE_VIDEOS as any).loc?.source?.body || ''
    expect(body).toContain('youtubeVideos')
  })

  it('exports GET_YOUTUBE_VIDEO as DocumentNode', () => {
    expect(GET_YOUTUBE_VIDEO).toBeDefined()
    expect(GET_YOUTUBE_VIDEO.kind).toBe('Document')
  })

  it('GET_YOUTUBE_VIDEO contains youtubeVideo query', () => {
    const body = (GET_YOUTUBE_VIDEO as any).loc?.source?.body || ''
    expect(body).toContain('youtubeVideo')
  })
})
