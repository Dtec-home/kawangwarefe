import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children) }))
vi.mock('next/image', () => ({ default: ({ src, alt }: any) => React.createElement('img', { src, alt }) }))
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: null, loading: false, error: null }),
  useMutation: () => [vi.fn(), { loading: false }],
}))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ isAuthenticated: false, logout: vi.fn() }) }))
vi.mock('@/components/layouts/bottom-nav', () => ({ BottomNav: () => React.createElement('div') }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

import DevotionalsPage from '@/app/(public)/devotionals/page'

describe('DevotionalsPage', () => {
  it('renders the page', () => {
    render(<DevotionalsPage />)
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
  })
})
