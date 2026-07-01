import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: null, loading: false, error: null, refetch: vi.fn() }),
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

// Mock file upload component
vi.mock('@/components/admin/file-upload', () => ({
  FileUpload: (props: any) => <div data-testid="file-upload">File Upload</div>,
}))

// Mock next/link to return proper JSX
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import ImportMembersPage from '@/app/(dashboard)/admin/members/import/page'

describe('ImportMembersPage', () => {
  it('renders the heading', () => {
    render(<ImportMembersPage />)
    expect(screen.getByText('Import Members')).toBeInTheDocument()
  })

  it('renders the instructions section', () => {
    render(<ImportMembersPage />)
    expect(screen.getByText('Instructions')).toBeInTheDocument()
    expect(screen.getByText(/Download the CSV template/)).toBeInTheDocument()
  })

  it('renders Download Template button', () => {
    render(<ImportMembersPage />)
    expect(screen.getByRole('button', { name: /Download Template/i })).toBeInTheDocument()
  })

  it('renders the Upload File section', () => {
    render(<ImportMembersPage />)
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.getByText('Select a CSV or Excel file containing member data')).toBeInTheDocument()
  })

  it('renders the file upload component', () => {
    render(<ImportMembersPage />)
    expect(screen.getByTestId('file-upload')).toBeInTheDocument()
  })
})
