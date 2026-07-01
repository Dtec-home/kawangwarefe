/**
 * AnnouncementsSection Component Tests
 *
 * FIRST: Fast (jsdom, no network), Independent (own fixture data),
 *        Repeatable, Self-validating, Timely
 * ISTQB: Defect-clustering — tests both the empty state and list-rendering paths
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnnouncementsSection } from '@/components/landing/announcements-section'
import { makeAnnouncement } from '../../fixtures'

describe('AnnouncementsSection', () => {
  describe('when there are no announcements (empty state)', () => {
    it('renders the "No announcements at this time" empty-state message', () => {
      render(<AnnouncementsSection announcements={[]} />)
      expect(screen.getByText(/no announcements at this time/i)).toBeInTheDocument()
    })

    it('renders the "Check back soon" helper text', () => {
      render(<AnnouncementsSection announcements={[]} />)
      expect(screen.getByText(/check back soon/i)).toBeInTheDocument()
    })

    it('does NOT render any announcement card titles in empty state', () => {
      render(<AnnouncementsSection announcements={[]} />)
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    })
  })

  describe('when announcements are provided', () => {
    it('renders the section heading "Announcements"', () => {
      const items = [makeAnnouncement()]
      render(<AnnouncementsSection announcements={items} />)
      expect(screen.getByRole('heading', { name: /announcements/i })).toBeInTheDocument()
    })

    it('renders a card for each announcement', () => {
      const items = [
        makeAnnouncement({ title: 'Announcement Alpha' }),
        makeAnnouncement({ title: 'Announcement Beta' }),
        makeAnnouncement({ title: 'Announcement Gamma' }),
      ]
      render(<AnnouncementsSection announcements={items} />)
      expect(screen.getByText('Announcement Alpha')).toBeInTheDocument()
      expect(screen.getByText('Announcement Beta')).toBeInTheDocument()
      expect(screen.getByText('Announcement Gamma')).toBeInTheDocument()
    })

    it('renders the announcement content (truncated via CSS but present in DOM)', () => {
      const items = [makeAnnouncement({ content: 'This is a very important notice.' })]
      render(<AnnouncementsSection announcements={items} />)
      expect(screen.getByText('This is a very important notice.')).toBeInTheDocument()
    })

    it('renders a priority indicator (Sparkles) for high-priority announcements', () => {
      const items = [makeAnnouncement({ priority: 1 })]
      const { container } = render(<AnnouncementsSection announcements={items} />)
      // Sparkles icon renders an SVG; verify its parent exists via aria or class
      // The Sparkles svg is the only one injected for priority > 0
      const svgs = container.querySelectorAll('svg')
      // Section header Bell + card Sparkles = at least 2 SVGs
      expect(svgs.length).toBeGreaterThanOrEqual(2)
    })

    it('does NOT render a priority icon for zero-priority announcements', () => {
      const items = [makeAnnouncement({ priority: 0 })]
      const { container } = render(<AnnouncementsSection announcements={items} />)
      // Only the header Bell icon svg should be present (no Sparkles)
      // Bell renders in the header, Sparkles only for priority > 0
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBe(1) // only the header Bell
    })
  })
})
