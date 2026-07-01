import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      contributionCategories: [
        { id: '1', name: 'Tithe', code: 'TITHE', description: 'Monthly tithe', isActive: true },
        { id: '2', name: 'Offering', code: 'OFFER', description: 'Sunday offering', isActive: true },
      ],
      membersList: {
        items: [
          { id: 'm1', fullName: 'John Kamau', phoneNumber: '254712345678', memberNumber: 'MEM001', email: 'john@test.com' },
          { id: 'm2', fullName: 'Jane Wanjiku', phoneNumber: '254798765432', memberNumber: 'MEM002', email: null },
        ],
        total: 2,
        hasMore: false,
      },
      categoryAdmins: [
        {
          id: 'ca1',
          member: { id: 'm1', fullName: 'John Kamau', phoneNumber: '254712345678', memberNumber: 'MEM001', email: 'john@test.com' },
          category: { id: '1', name: 'Tithe', code: 'TITHE', description: 'Monthly tithe', isActive: true },
          assignedBy: { id: 'a1', fullName: 'Admin User' },
          assignedAt: '2025-01-15T08:00:00Z',
          isActive: true,
        },
        {
          id: 'ca2',
          member: { id: 'm2', fullName: 'Jane Wanjiku', phoneNumber: '254798765432', memberNumber: 'MEM002', email: null },
          category: { id: '1', name: 'Tithe', code: 'TITHE', description: 'Monthly tithe', isActive: true },
          assignedBy: null,
          assignedAt: '2025-02-10T10:00:00Z',
          isActive: true,
        },
      ],
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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import CategoryAdminsPage from '@/app/(dashboard)/admin/category-admins/page'

describe('CategoryAdminsPage', () => {
  it('renders the heading', () => {
    render(<CategoryAdminsPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Department Admins/ })).toBeInTheDocument()
  })

  it('renders statistics cards', () => {
    render(<CategoryAdminsPage />)
    expect(screen.getByText('Total Departments')).toBeInTheDocument()
    expect(screen.getByText('Departments with Admins')).toBeInTheDocument()
    expect(screen.getByText('Total admin assignments')).toBeInTheDocument()
  })

  it('renders admin count as 2', () => {
    render(<CategoryAdminsPage />)
    expect(screen.getByText('2 admin assignments found')).toBeInTheDocument()
  })

  it('renders category admin names', () => {
    render(<CategoryAdminsPage />)
    expect(screen.getAllByText('John Kamau').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Jane Wanjiku').length).toBeGreaterThan(0)
  })

  it('renders Assign Department Admin section', () => {
    render(<CategoryAdminsPage />)
    expect(screen.getByText('Assign Department Admin')).toBeInTheDocument()
  })
})
