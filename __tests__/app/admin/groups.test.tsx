import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      groupsList: [
        { id: 'g1', name: 'Youth' },
        { id: 'g2', name: 'Women Ministry' },
        { id: 'g3', name: 'Men Fellowship' },
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

import GroupsManagementPage from '@/app/(dashboard)/admin/groups/page'

describe('GroupsManagementPage', () => {
  it('renders the heading', () => {
    render(<GroupsManagementPage />)
    expect(screen.getByText('Groups')).toBeInTheDocument()
  })

  it('shows the create group button', () => {
    render(<GroupsManagementPage />)
    expect(screen.getByRole('button', { name: /Create Group/i })).toBeInTheDocument()
  })

  it('renders group names', () => {
    render(<GroupsManagementPage />)
    expect(screen.getByText('Youth')).toBeInTheDocument()
    expect(screen.getByText('Women Ministry')).toBeInTheDocument()
    expect(screen.getByText('Men Fellowship')).toBeInTheDocument()
  })

  it('shows correct group count in the header', () => {
    render(<GroupsManagementPage />)
    expect(screen.getByText('Existing Groups (3)')).toBeInTheDocument()
  })

  it('renders edit, delete, and add members buttons for each group', () => {
    render(<GroupsManagementPage />)
    const editButtons = screen.getAllByRole('button', { name: /Edit/i })
    expect(editButtons.length).toBe(3)
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
    expect(deleteButtons.length).toBe(3)
    const addMembersButtons = screen.getAllByRole('button', { name: /Add Members/i })
    expect(addMembersButtons.length).toBe(3)
  })
})
