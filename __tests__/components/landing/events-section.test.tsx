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

  // Regression coverage for the existing (already-shipped) payable-event giving
  // deep-link: isPayable + category -> "Give to this event" link into /contribute
  // with categoryId/purposeId/amount/eventId query params (see buildGiveHref).
  describe('payable events', () => {
    it('renders a "Give to this event" link with categoryId and eventId in the href when isPayable=true and a category is present', () => {
      const events = [
        makeEvent({
          id: 'evt-1',
          ...({ isPayable: true, category: { id: 'cat-42', name: 'Building Fund' } } as any),
        }),
      ]
      render(<EventsSection events={events} />)

      const link = screen.getByRole('link', { name: /give to this event/i })
      expect(link).toBeInTheDocument()

      const href = link.getAttribute('href') || ''
      expect(href.startsWith('/contribute?')).toBe(true)

      const params = new URLSearchParams(href.split('?')[1])
      expect(params.get('categoryId')).toBe('cat-42')
      expect(params.get('eventId')).toBe('evt-1')
    })

    it('includes purposeId and amount in the href when a purpose and suggestedAmount are present', () => {
      const events = [
        makeEvent({
          id: 'evt-2',
          ...({
            isPayable: true,
            category: { id: 'cat-7', name: 'Missions' },
            purpose: { id: 'purp-9', name: 'Youth Missions' },
            suggestedAmount: 1000,
          } as any),
        }),
      ]
      render(<EventsSection events={events} />)

      const link = screen.getByRole('link', { name: /give to this event/i })
      const params = new URLSearchParams((link.getAttribute('href') || '').split('?')[1])
      expect(params.get('categoryId')).toBe('cat-7')
      expect(params.get('purposeId')).toBe('purp-9')
      expect(params.get('amount')).toBe('1000')
      expect(params.get('eventId')).toBe('evt-2')
    })

    it('omits the amount param from the href when suggestedAmount is null', () => {
      const events = [
        makeEvent({
          id: 'evt-3',
          ...({
            isPayable: true,
            category: { id: 'cat-11', name: 'Welfare' },
            suggestedAmount: null,
          } as any),
        }),
      ]
      render(<EventsSection events={events} />)

      const link = screen.getByRole('link', { name: /give to this event/i })
      const params = new URLSearchParams((link.getAttribute('href') || '').split('?')[1])
      expect(params.has('amount')).toBe(false)
      expect(params.get('categoryId')).toBe('cat-11')
      expect(params.get('eventId')).toBe('evt-3')
    })

    it('does NOT render the "Give to this event" CTA when isPayable=false, even if a category is present', () => {
      const events = [
        makeEvent({
          id: 'evt-4',
          ...({
            isPayable: false,
            category: { id: 'cat-99', name: 'Tithe' },
          } as any),
        }),
      ]
      render(<EventsSection events={events} />)
      expect(screen.queryByRole('link', { name: /give to this event/i })).not.toBeInTheDocument()
    })

    it('does NOT render the "Give to this event" CTA when isPayable=true but there is no category', () => {
      const events = [
        makeEvent({
          id: 'evt-5',
          ...({ isPayable: true, category: null } as any),
        }),
      ]
      render(<EventsSection events={events} />)
      expect(screen.queryByRole('link', { name: /give to this event/i })).not.toBeInTheDocument()
    })
  })
})
