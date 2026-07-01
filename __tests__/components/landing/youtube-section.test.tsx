/**
 * YouTubeSection Component Tests
 *
 * Updated to match current component behaviour: iframes render directly
 * (lazy-embed was removed). Tests verify structure and content, not embed strategy.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YouTubeSection } from '@/components/landing/youtube-section'
import { makeYouTubeVideo } from '../../fixtures'

describe('YouTubeSection', () => {
  describe('empty state', () => {
    it('renders "No videos available yet" when given no videos', () => {
      render(<YouTubeSection videos={[]} />)
      expect(screen.getByText(/no videos available yet/i)).toBeInTheDocument()
    })

    it('renders the "Watch & Listen" heading in empty state', () => {
      render(<YouTubeSection videos={[]} />)
      expect(screen.getByRole('heading', { name: /watch & listen/i })).toBeInTheDocument()
    })

    it('does NOT render an iframe in empty state', () => {
      const { container } = render(<YouTubeSection videos={[]} />)
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })
  })

  describe('with videos', () => {
    it('renders the "Watch & Listen" heading when videos are provided', () => {
      render(<YouTubeSection videos={[makeYouTubeVideo()]} />)
      expect(screen.getByRole('heading', { name: /watch & listen/i })).toBeInTheDocument()
    })

    it('renders the featured video title', () => {
      const video = makeYouTubeVideo({ title: 'Test Sermon' })
      render(<YouTubeSection videos={[video]} />)
      expect(screen.getByText('Test Sermon')).toBeInTheDocument()
    })

    it('renders an iframe for the featured video', () => {
      const video = makeYouTubeVideo({ embedUrl: 'https://www.youtube.com/embed/testid' })
      const { container } = render(<YouTubeSection videos={[video]} />)
      const iframe = container.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.getAttribute('src')).toContain('testid')
    })

    it('renders a "View All Videos" link', () => {
      render(<YouTubeSection videos={[makeYouTubeVideo()]} />)
      expect(screen.getByRole('link', { name: /view all videos/i })).toBeInTheDocument()
    })

    it('renders the video category badge', () => {
      const video = makeYouTubeVideo({ category: 'Sermon' })
      render(<YouTubeSection videos={[video]} />)
      expect(screen.getByText('SERMON')).toBeInTheDocument()
    })

    it('renders the video description', () => {
      const video = makeYouTubeVideo({ description: 'A great sermon about faith' })
      render(<YouTubeSection videos={[video]} />)
      expect(screen.getByText(/great sermon about faith/i)).toBeInTheDocument()
    })
  })
})
