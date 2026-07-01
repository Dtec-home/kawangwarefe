import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children),
}))

import { BottomNav } from '@/components/layouts/bottom-nav'

describe('BottomNav', () => {
  it('renders primary nav links', () => {
    render(<BottomNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Give')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Sermons')).toBeInTheDocument()
  })

  it('renders More button', () => {
    render(<BottomNav />)
    expect(screen.queryByText('More')).not.toBeInTheDocument()
  })
})
