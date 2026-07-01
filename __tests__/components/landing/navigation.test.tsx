import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Navigation } from '@/components/landing/navigation'

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: false, logout: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => React.createElement('img', { src, alt }),
}))

vi.mock('@/components/layouts/bottom-nav', () => ({
  BottomNav: () => <div data-testid="bottom-nav" />,
}))

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

describe('Navigation', () => {
  it('renders nav links: Home, Announcements, Devotionals, Events, Sermons, Give', () => {
    render(<Navigation />)
    expect(screen.getByText('Home')).toBeDefined()
    expect(screen.getByText('Announcements')).toBeDefined()
    expect(screen.getByText('Devotionals')).toBeDefined()
    expect(screen.getByText('Events')).toBeDefined()
    expect(screen.getByText('Sermons')).toBeDefined()
    expect(screen.getByText('Give')).toBeDefined()
  })

  it('shows "Member Login" when not authenticated', () => {
    render(<Navigation />)
    expect(screen.getByText('Member Login')).toBeDefined()
  })

  it('does not show Dashboard or Logout when not authenticated', () => {
    render(<Navigation />)
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.queryByText('Logout')).toBeNull()
  })

  it('renders toggle menu button', () => {
    render(<Navigation />)
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(menuButton).toBeDefined()
  })

  it('renders BottomNav', () => {
    render(<Navigation />)
    expect(screen.getByTestId('bottom-nav')).toBeDefined()
  })
})
