import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation with useParams
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return { ...actual, useParams: () => ({ id: '1' }) }
})

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      departmentPurposes: [
        { id: 'p1', name: 'Camp Meeting', code: 'CAMP', description: 'Annual camp meeting fund', isActive: true },
        { id: 'p2', name: 'Mission Trip', code: 'MISSION', description: 'Overseas mission support', isActive: true },
        { id: 'p3', name: 'Building Repairs', code: 'REPAIR', description: '', isActive: false },
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

// Mock next/link to return proper JSX
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import PurposesPage from '@/app/(dashboard)/admin/categories/[id]/purposes/page'

describe('PurposesPage', () => {
  it('renders the heading', () => {
    render(<PurposesPage />)
    expect(screen.getByText('Department Purposes')).toBeInTheDocument()
  })

  it('renders purpose names and codes', () => {
    render(<PurposesPage />)
    expect(screen.getAllByText('Camp Meeting').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CAMP').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mission Trip').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MISSION').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Building Repairs').length).toBeGreaterThan(0)
  })

  it('renders purpose count in header', () => {
    render(<PurposesPage />)
    expect(screen.getByText('Current Purposes (3)')).toBeInTheDocument()
  })

  it('renders Add Purpose form', () => {
    render(<PurposesPage />)
    expect(screen.getByText('Add Purpose')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Purpose/i })).toBeInTheDocument()
  })

  it('renders Delete buttons for each purpose', () => {
    render(<PurposesPage />)
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
    expect(deleteButtons.length).toBe(3)
  })

  it('renders Back to Departments link', () => {
    render(<PurposesPage />)
    expect(screen.getByText('Back to Departments')).toBeInTheDocument()
  })
})
