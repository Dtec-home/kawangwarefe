import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}))
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}))
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: null, loading: false, error: null, refetch: vi.fn() }),
  useMutation: () => [vi.fn(), { loading: false }],
}))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { fullName: 'Test', memberId: 1, phoneNumber: '254712345678' }, logout: vi.fn(), isLoading: false }),
}))
vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: any) => React.createElement('div', null, children),
}))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: false, canAccessAdmin: false, isContentAdmin: false,
    isCategoryAdmin: false, isGroupAdmin: false, loading: false, adminCategories: [],
  }),
}))
vi.mock('@/lib/hooks/use-category-admin', () => ({
  useMyCategoryAdminRoles: () => ({ roles: [], loading: false }),
}))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

import DashboardPage from '@/app/(dashboard)/dashboard/page'

describe('DashboardPage', () => {
  it('renders the dashboard', () => {
    const { container } = render(<DashboardPage />)
    // Should show welcome or dashboard content
    expect(screen.getAllByText(/Welcome|Dashboard|contribution/i).length).toBeGreaterThan(0)
    expect(container.querySelector('[data-tour="dashboard-header"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="dashboard-stats"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="dashboard-snapshot"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="dashboard-history"]')).toBeInTheDocument()
  })
})
