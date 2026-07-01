import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo with data
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      membersList: {
        items: [
          { id: '1', fullName: 'John Doe', firstName: 'John', lastName: 'Doe', phone: '254712345678', email: 'john@test.com', isActive: true, roles: ['admin'], groups: [{ id: '1', name: 'Youth' }], createdAt: '2024-01-01' },
          { id: '2', fullName: 'Jane Smith', firstName: 'Jane', lastName: 'Smith', phone: '254798765432', email: null, isActive: false, roles: [], groups: [], createdAt: '2024-02-01' },
        ],
        total: 2,
        hasMore: false,
      },
      groupsList: [{ id: '1', name: 'Youth' }, { id: '2', name: 'Choir' }],
    },
    loading: false, error: null, refetch: vi.fn(),
  })),
  useMutation: () => [vi.fn().mockResolvedValue({ data: {} }), { loading: false }],
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

// Mock next/link to return proper JSX
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import MembersPage from '@/app/(dashboard)/admin/members/page'

describe('MembersPage', () => {
  it('renders the heading', () => {
    render(<MembersPage />)
    expect(screen.getByText('Members')).toBeInTheDocument()
  })

  it('shows stats cards', () => {
    render(<MembersPage />)
    expect(screen.getByText('Total Members')).toBeInTheDocument()
    // "Active" and "Inactive" appear in stats cards and potentially as status text
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0)
  })

  it('renders member names', () => {
    render(<MembersPage />)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0)
  })

  it('shows Add Member button', () => {
    render(<MembersPage />)
    expect(screen.getByText('Add Member')).toBeInTheDocument()
  })

  it('shows search input', () => {
    render(<MembersPage />)
    expect(screen.getByPlaceholderText(/name, phone/i)).toBeInTheDocument()
  })

  it('shows role badges for members with roles', () => {
    render(<MembersPage />)
    expect(screen.getAllByText('admin').length).toBeGreaterThan(0)
  })

  it('shows group badges', () => {
    render(<MembersPage />)
    expect(screen.getAllByText('Youth').length).toBeGreaterThan(0)
  })

  it('shows pagination info', () => {
    render(<MembersPage />)
    expect(screen.getByText(/1-2 of 2|Showing/)).toBeInTheDocument()
  })

  it('shows Import Members link', () => {
    render(<MembersPage />)
    expect(screen.getByText('Import')).toBeInTheDocument()
  })
})
