import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      dashboardStats: {
        todayTotal: '25000.00',
        todayCount: 8,
        weekTotal: '150000.00',
        weekCount: 42,
        monthTotal: '500000.00',
        monthCount: 120,
        totalAmount: '2500000.00',
        totalCount: 850,
        totalMembers: 200,
        activeMembers: 175,
      },
      allContributions: {
        items: [
          {
            id: 'r1',
            amount: '5000.00',
            status: 'completed',
            transactionDate: '2025-03-20T10:30:00Z',
            member: { fullName: 'John Kamau', phoneNumber: '254712345678' },
            category: { name: 'Tithe' },
          },
          {
            id: 'r2',
            amount: '2000.00',
            status: 'completed',
            transactionDate: '2025-03-19T14:00:00Z',
            member: { fullName: 'Jane Wanjiku', phoneNumber: '254798765432' },
            category: { name: 'Offering' },
          },
        ],
      },
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: () => [vi.fn(), { loading: false }],
}))

// Mock auth
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { memberId: 1 }, logout: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}))

// Mock user role hook
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true,
    canAccessAdmin: true,
    canAccessFeature: () => true,
    isAuthenticated: true,
    loading: false,
    adminCategories: [],
    adminCategoryIds: [],
    adminGroupNames: [],
  }),
}))

// Mock admin layout
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => <div data-testid="admin-layout">{children}</div>,
}))

// Mock admin protected route
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

// Mock protected route (overview uses ProtectedRoute, not AdminProtectedRoute)
vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

import AdminOverviewPage from '@/app/(dashboard)/admin/page'

describe('AdminOverviewPage', () => {
  it('renders the heading', () => {
    const { container } = render(<AdminOverviewPage />)
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="admin-header"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="admin-stats"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="admin-contributions"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="admin-members"]')).toBeInTheDocument()
  })

  it('renders the stats card titles', () => {
    render(<AdminOverviewPage />)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('renders contribution counts in stats', () => {
    render(<AdminOverviewPage />)
    expect(screen.getByText('8 contributions')).toBeInTheDocument()
    expect(screen.getByText('42 contributions')).toBeInTheDocument()
    expect(screen.getByText('120 contributions')).toBeInTheDocument()
    expect(screen.getByText('850 contributions')).toBeInTheDocument()
  })

  it('renders recent contributions section', () => {
    render(<AdminOverviewPage />)
    expect(screen.getByText('Recent Contributions')).toBeInTheDocument()
    expect(screen.getByText('Latest contributions with status')).toBeInTheDocument()
  })

  it('renders member names in recent contributions', () => {
    render(<AdminOverviewPage />)
    expect(screen.getAllByText('John Kamau').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Jane Wanjiku').length).toBeGreaterThan(0)
  })

  it('renders member stats section', () => {
    render(<AdminOverviewPage />)
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('175 active members')).toBeInTheDocument()
  })
})
