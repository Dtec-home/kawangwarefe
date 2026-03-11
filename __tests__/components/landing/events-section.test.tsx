/**
 * EventsSection Component Tests
 *
 * FIRST: Independent — each it() block renders its own component instance
 * ISTQB: Tests empty state, data rendering, and conditional registration link
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventsSection } from '@/components/landing/events-section'
import { makeEvent } from '../../fixtures'

describe('EventsSection', () => {
  describe('empty state', () => {
    it('renders "No upcoming events scheduled" in empty state', () => {
      render(<EventsSection events={[]} />)
      expect(screen.getByText(/no upcoming events scheduled/i)).toBeInTheDocument()
    })

    it('renders helper text "Check back soon" in empty state', () => {
      render(<EventsSection events={[]} />)
      expect(screen.getByText(/check back soon/i)).toBeInTheDocument()
    })

    it('renders "Upcoming Events" heading even in empty state', () => {
      render(<EventsSection events={[]} />)
      expect(screen.getByRole('heading', { name: /upcoming events/i })).toBeInTheDocument()
    })
  })

  describe('with events', () => {
    it('renders event titles', () => {
      const events = [
        makeEvent({ title: 'Youth Camp 2026' }),
        makeEvent({ title: 'Prayer Conference' }),
      ]
      render(<EventsSection events={events} />)
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument()
      expect(screen.getByText('Prayer Conference')).toBeInTheDocument()
    })

    it('renders the event location', () => {
      const events = [makeEvent({ location: 'Church Main Hall' })]
      render(<EventsSection events={events} />)
      expect(screen.getByText('Church Main Hall')).toBeInTheDocument()
    })

    it('renders the event time', () => {
      const events = [makeEvent({ eventTime: '10:00 AM' })]
      render(<EventsSection events={events} />)
      expect(screen.getByText('10:00 AM')).toBeInTheDocument()
    })

    it('renders a "Register" link when registrationLink is provided', () => {
      const events = [makeEvent({ registrationLink: 'https://forms.example.com/register' })]
      render(<EventsSection events={events} />)
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
    })

    it('does NOT render a "Register" link when registrationLink is absent', () => {
      const events = [makeEvent({ registrationLink: undefined })]
      render(<EventsSection events={events} />)
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument()
    })

    it('renders event description text', () => {
      const events = [makeEvent({ description: 'A wonderful community gathering.' })]
      render(<EventsSection events={events} />)
      expect(screen.getByText('A wonderful community gathering.')).toBeInTheDocument()
    })
  })
})
