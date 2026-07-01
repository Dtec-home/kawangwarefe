import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin',
}))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true, canAccessFeature: () => true,
  }),
}))

import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav'

describe('AdminBottomNav', () => {
  it('renders primary nav links', () => {
    render(<AdminBottomNav />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Funds')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('renders More button', () => {
    render(<AdminBottomNav />)
    expect(screen.getByText('More')).toBeInTheDocument()
  })
})
