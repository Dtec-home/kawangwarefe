import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin',
}))

// Sprint 8 — layout now fetches me.avatarUrl for the sidebar avatar.
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: { me: null }, loading: false, error: null }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Test User', phoneNumber: '254712345678' }, logout: vi.fn() }),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true, isCategoryAdmin: false, isGroupAdmin: false, isContentAdmin: false,
    canAccessFeature: () => true, adminCategories: [], loading: false,
  }),
}))

vi.mock('@/components/layouts/admin-bottom-nav', () => ({
  AdminBottomNav: () => <div data-testid="admin-bottom-nav" />,
}))

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

import { AdminLayout } from '@/components/layouts/admin-layout'

describe('AdminLayout', () => {
  it('renders children', () => {
    render(<AdminLayout><div>Page content</div></AdminLayout>)
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders Church Admin title', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getAllByText('Church Admin').length).toBeGreaterThan(0)
  })

  it('shows staff admin badge', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Staff Admin')).toBeInTheDocument()
  })

  it('shows nav items', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Contributions')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
  })

  it('shows user info', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('shows Member View button', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getAllByText('Member View').length).toBeGreaterThan(0)
  })

  it('shows Logout button', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('renders admin bottom nav', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByTestId('admin-bottom-nav')).toBeInTheDocument()
  })
})
