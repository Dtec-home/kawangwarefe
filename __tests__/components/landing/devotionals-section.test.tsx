/**
 * DevotionalsSection Component Tests
 *
 * ISTQB: Tests empty state + featured/regular split logic (defect clustering at boundary)
 * FIRST: Independent — each test renders fresh with own data
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DevotionalsSection } from '@/components/landing/devotionals-section'
import { makeDevotional } from '../../fixtures'

describe('DevotionalsSection', () => {
  describe('empty state', () => {
    it('renders "No devotionals available yet" when given an empty array', () => {
      render(<DevotionalsSection devotionals={[]} />)
      expect(screen.getByText(/no devotionals available yet/i)).toBeInTheDocument()
    })

    it('renders "Stay tuned" helper text in empty state', () => {
      render(<DevotionalsSection devotionals={[]} />)
      expect(screen.getByText(/stay tuned/i)).toBeInTheDocument()
    })

    it('renders "Daily Devotionals" heading in empty state', () => {
      render(<DevotionalsSection devotionals={[]} />)
      expect(screen.getByRole('heading', { name: /daily devotionals/i })).toBeInTheDocument()
    })
  })

  describe('with devotionals', () => {
    it('renders the "Daily Devotionals" section heading', () => {
      render(<DevotionalsSection devotionals={[makeDevotional()]} />)
      expect(screen.getByRole('heading', { name: /daily devotionals/i })).toBeInTheDocument()
    })

    it('renders the "FEATURED DEVOTIONAL" badge for the featured item', () => {
      const featured = makeDevotional({ isFeatured: true, title: 'The Featured One' })
      const regular = makeDevotional({ isFeatured: false, title: 'Regular One' })
      render(<DevotionalsSection devotionals={[featured, regular]} />)
      expect(screen.getByText(/featured devotional/i)).toBeInTheDocument()
    })

    it('renders the featured devotional title prominently', () => {
      const featured = makeDevotional({ isFeatured: true, title: 'Walk By Faith' })
      render(<DevotionalsSection devotionals={[featured]} />)
      expect(screen.getByRole('heading', { name: /walk by faith/i })).toBeInTheDocument()
    })

    it('renders scripture reference and author for featured devotional', () => {
      const featured = makeDevotional({
        isFeatured: true,
        scriptureReference: 'John 3:16',
        author: 'Elder Mwangi',
      })
      render(<DevotionalsSection devotionals={[featured]} />)
      expect(screen.getByText(/john 3:16/i)).toBeInTheDocument()
      expect(screen.getByText(/elder mwangi/i)).toBeInTheDocument()
    })

    it('renders non-featured devotionals in the grid', () => {
      const regular1 = makeDevotional({ isFeatured: false, title: 'Hope in Trials' })
      const regular2 = makeDevotional({ isFeatured: false, title: 'Grace Abounding' })
      render(<DevotionalsSection devotionals={[regular1, regular2]} />)
      expect(screen.getByText('Hope in Trials')).toBeInTheDocument()
      expect(screen.getByText('Grace Abounding')).toBeInTheDocument()
    })

    it('limits regular grid to 5 items (shows presence of first 5, not 6th)', () => {
      const items = Array.from({ length: 7 }, (_, i) =>
        makeDevotional({ isFeatured: false, title: `Devotional ${i + 1}` })
      )
      render(<DevotionalsSection devotionals={items} />)
      // First 5 regular ones present (featured=false, so all 7 are "regular")
      expect(screen.getByText('Devotional 1')).toBeInTheDocument()
      expect(screen.getByText('Devotional 5')).toBeInTheDocument()
      // 6th and 7th should NOT appear (sliced)
      expect(screen.queryByText('Devotional 6')).not.toBeInTheDocument()
      expect(screen.queryByText('Devotional 7')).not.toBeInTheDocument()
    })
  })
})
