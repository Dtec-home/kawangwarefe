import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      contributionCategories: [
        { id: '1', name: 'Tithe', code: 'TITHE' },
        { id: '2', name: 'Offering', code: 'OFFER' },
      ],
      departmentRoutingReport: {
        summary: {
          totalCompletedAmount: '500000',
          totalCompletedCount: 120,
          guestTopLevelAmount: '50000',
          guestTopLevelCount: 15,
          memberRoutedAmount: '300000',
          memberRoutedCount: 80,
          memberTopLevelAmount: '150000',
          memberTopLevelCount: 25,
        },
        byDepartment: [
          { departmentId: '1', departmentName: 'Tithe', departmentCode: 'TITHE', totalAmount: '300000', totalCount: 80 },
          { departmentId: '2', departmentName: 'Offering', departmentCode: 'OFFER', totalAmount: '200000', totalCount: 40 },
        ],
        byDepartmentPurpose: [
          { departmentId: '1', departmentName: 'Tithe', departmentCode: 'TITHE', purposeId: 'p1', purposeName: 'Camp Meeting', purposeCode: 'CAMP', totalAmount: '100000', totalCount: 20 },
        ],
        byDepartmentGroup: [
          { departmentId: '1', departmentName: 'Tithe', departmentCode: 'TITHE', groupId: 'g1', groupName: 'Youth', isTopLevel: false, totalAmount: '80000', totalCount: 15 },
        ],
      },
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: () => [vi.fn(), { loading: false }],
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false, error: null }],
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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import ReportsPage from '@/app/(dashboard)/admin/reports/page'

describe('ReportsPage', () => {
  it('renders the heading', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('renders Generate Report section in Exports mode', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Exports' }))
    expect(screen.getByText('Generate Report')).toBeInTheDocument()
    expect(screen.getByText(/Generate & Download Report/)).toBeInTheDocument()
  })

  it('renders quick report action cards in Exports mode', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Exports' }))
    expect(screen.getByText("Today's Report")).toBeInTheDocument()
    expect(screen.getByText('Weekly Report')).toBeInTheDocument()
    expect(screen.getByText('Monthly Report')).toBeInTheDocument()
  })

  it('renders department routing analytics section', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Department Routing Analytics')).toBeInTheDocument()
    expect(screen.getByText('Total Completed')).toBeInTheDocument()
    expect(screen.getByText('120 contributions')).toBeInTheDocument()
    expect(screen.getByText('Active Filters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More Filters' })).toBeInTheDocument()
  })

  it('renders primary analytics filters', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Department')).toBeInTheDocument()
    expect(screen.getByText('Purpose')).toBeInTheDocument()
  })

  it('renders detailed breakdown tools in Explore Data mode', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Explore Data' }))
    expect(screen.getByText('Top Departments')).toBeInTheDocument()
    expect(screen.getByText('Detailed Breakdowns')).toBeInTheDocument()
    expect(screen.getByText('Breakdown View')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Groups' })).toBeInTheDocument()
  })

  it('filters breakdown rows with search input', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Explore Data' }))

    const searchInput = screen.getByLabelText('Search Departments')
    fireEvent.change(searchInput, { target: { value: 'Offer' } })

    expect(screen.getByText('Page 1 of 1 • 1 row(s)')).toBeInTheDocument()
  })

  it('opens drill-down dialog when clicking a department row', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Explore Data' }))

    const sectionTitle = screen.getByText('By Department (2)')
    const section = sectionTitle.closest('div')?.parentElement
    const tableRow = section?.querySelector('tbody tr') as HTMLElement
    fireEvent.click(tableRow)

    expect(screen.getByText('Detailed breakdown by purpose')).toBeInTheDocument()
    expect(screen.getByText('Top Purposes')).toBeInTheDocument()
  })
})
