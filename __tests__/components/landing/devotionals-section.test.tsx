/**
 * DevotionalsSection Component Tests
 *
 * The component fetches from /api/devotional on mount.
 * We mock global.fetch to return no EGW devotional so the component
 * renders based solely on the `devotionals` prop.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DevotionalsSection } from '@/components/landing/devotionals-section'
import { makeDevotional } from '../../fixtures'

// Mock fetch to return empty EGW devotional — prevents loading spinner
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ devotional: null }),
  } as Response)
})

describe('DevotionalsSection', () => {
  describe('empty state', () => {
    it('renders "No devotionals available yet" when given an empty array', async () => {
      render(<DevotionalsSection devotionals={[]} />)
      await waitFor(() => {
        expect(screen.getByText(/no devotionals available yet/i)).toBeInTheDocument()
      })
    })

    it('renders "Stay tuned" helper text in empty state', async () => {
      render(<DevotionalsSection devotionals={[]} />)
      await waitFor(() => {
        expect(screen.getByText(/stay tuned/i)).toBeInTheDocument()
      })
    })

    it('renders "Daily Devotionals" heading in empty state', async () => {
      render(<DevotionalsSection devotionals={[]} />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /daily devotionals/i })).toBeInTheDocument()
      })
    })
  })

  describe('with devotionals', () => {
    it('renders the "Daily Devotionals" section heading', async () => {
      render(<DevotionalsSection devotionals={[makeDevotional()]} />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /daily devotionals/i })).toBeInTheDocument()
      })
    })

    it('renders the "FEATURED DEVOTIONAL" badge for the featured item', async () => {
      const featured = makeDevotional({ isFeatured: true, title: 'The Featured One' })
      const regular = makeDevotional({ isFeatured: false, title: 'Regular One' })
      render(<DevotionalsSection devotionals={[featured, regular]} />)
      await waitFor(() => {
        expect(screen.getByText(/featured devotional/i)).toBeInTheDocument()
      })
    })

    it('renders the featured devotional title prominently', async () => {
      const featured = makeDevotional({ isFeatured: true, title: 'Walk By Faith' })
      render(<DevotionalsSection devotionals={[featured]} />)
      await waitFor(() => {
        expect(screen.getByText('Walk By Faith')).toBeInTheDocument()
      })
    })

    it('renders scripture reference and author for featured devotional', async () => {
      const featured = makeDevotional({
        isFeatured: true,
        scriptureReference: 'John 3:16',
        author: 'Elder Mwangi',
      })
      render(<DevotionalsSection devotionals={[featured]} />)
      await waitFor(() => {
        expect(screen.getByText(/john 3:16/i)).toBeInTheDocument()
        expect(screen.getByText(/elder mwangi/i)).toBeInTheDocument()
      })
    })

    it('renders non-featured devotionals in the grid', async () => {
      const regular1 = makeDevotional({ isFeatured: false, title: 'Hope in Trials' })
      const regular2 = makeDevotional({ isFeatured: false, title: 'Grace Abounding' })
      render(<DevotionalsSection devotionals={[regular1, regular2]} />)
      await waitFor(() => {
        expect(screen.getByText('Hope in Trials')).toBeInTheDocument()
        expect(screen.getByText('Grace Abounding')).toBeInTheDocument()
      })
    })
  })
})
