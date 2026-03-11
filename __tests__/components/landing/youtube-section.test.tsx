/**
 * YouTubeSection Component Tests
 *
 * Key assertion: the lazy-embed pattern means no <iframe> should appear
 * on initial render — only a thumbnail <img> and play button.
 * This test acts as a regression guard for performance fix #3.
 *
 * ISTQB: Defect-clustering — lazy-embed is the highest-risk change in this component
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  describe('with videos — lazy-embed (performance fix regression guard)', () => {
    it('renders the "Watch & Listen" heading when videos are provided', () => {
      const videos = [makeYouTubeVideo()]
      render(<YouTubeSection videos={videos} />)
      expect(screen.getByRole('heading', { name: /watch & listen/i })).toBeInTheDocument()
    })

    it('does NOT render a live iframe for the featured video on initial load', () => {
      // CRITICAL: verifies performance fix — eager iframe was the bug
      const videos = [makeYouTubeVideo()]
      const { container } = render(<YouTubeSection videos={videos} />)
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('renders a thumbnail image (not iframe) for the featured video', () => {
      const video = makeYouTubeVideo({ title: 'Test Sermon', thumbnailUrl: 'https://img.youtube.com/vi/abc/maxresdefault.jpg' })
      render(<YouTubeSection videos={[video]} />)
      const img = screen.getByAltText('Test Sermon')
      expect(img).toBeInTheDocument()
      expect(img.tagName).toBe('IMG')
    })

    it('shows the iframe for featured video after clicking the play button', () => {
      const video = makeYouTubeVideo({ embedUrl: 'https://www.youtube.com/embed/testid' })
      const { container } = render(<YouTubeSection videos={[video]} />)

      const playButton = container.querySelector('[aria-label="Play video"], button')
      if (playButton) fireEvent.click(playButton)

      // After clicking, iframe should be rendered
      const iframe = container.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
    })

    it('renders thumbnail links (not iframes) for additional videos in the grid', () => {
      const videos = Array.from({ length: 5 }, (_, i) =>
        makeYouTubeVideo({ title: `Video ${i + 1}`, videoId: `vid${i}` })
      )
      const { container } = render(<YouTubeSection videos={videos} />)
      // The grid should have img elements for thumbnails, no iframes
      const iframes = container.querySelectorAll('iframe')
      expect(iframes.length).toBe(0)
    })

    it('renders a "View All Videos" link', () => {
      const videos = [makeYouTubeVideo()]
      render(<YouTubeSection videos={videos} />)
      expect(screen.getByRole('link', { name: /view all videos/i })).toBeInTheDocument()
    })
  })
})
