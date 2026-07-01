import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: { announcements: [], devotionals: [], events: [], youtubeVideos: [] },
    loading: false, error: null,
  }),
}))

vi.mock('@/components/landing/announcements-section', () => ({
  AnnouncementsSection: ({ announcements }: any) => <div data-testid="announcements">{announcements.length} announcements</div>,
}))
vi.mock('@/components/landing/devotionals-section', () => ({
  DevotionalsSection: ({ devotionals }: any) => <div data-testid="devotionals">{devotionals.length} devotionals</div>,
}))
vi.mock('@/components/landing/events-section', () => ({
  EventsSection: ({ events }: any) => <div data-testid="events">{events.length} events</div>,
}))
vi.mock('@/components/landing/youtube-section', () => ({
  YouTubeSection: ({ videos }: any) => <div data-testid="youtube">{videos.length} videos</div>,
}))

import { HomeContent } from '@/components/landing/home-content'

describe('HomeContent', () => {
  it('renders all content sections', () => {
    render(<HomeContent />)
    expect(screen.getByTestId('announcements')).toBeInTheDocument()
    expect(screen.getByTestId('devotionals')).toBeInTheDocument()
    expect(screen.getByTestId('events')).toBeInTheDocument()
    expect(screen.getByTestId('youtube')).toBeInTheDocument()
  })
})
