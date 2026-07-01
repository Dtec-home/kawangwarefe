import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      devotionals: [
        {
          id: 'd1',
          title: 'Walking in Faith',
          content: 'Today we reflect on what it means to walk by faith',
          author: 'Pastor James',
          scriptureReference: 'Hebrews 11:1',
          publishDate: '2025-03-20T00:00:00Z',
          isPublished: true,
          isFeatured: true,
          featuredImageUrl: '',
          createdAt: '2025-03-18T00:00:00Z',
          updatedAt: '2025-03-18T00:00:00Z',
        },
        {
          id: 'd2',
          title: 'Grace and Mercy',
          content: 'Understanding the difference between grace and mercy',
          author: 'Elder Sarah',
          scriptureReference: 'Ephesians 2:8-9',
          publishDate: '2025-03-19T00:00:00Z',
          isPublished: true,
          isFeatured: false,
          featuredImageUrl: '',
          createdAt: '2025-03-17T00:00:00Z',
          updatedAt: '2025-03-17T00:00:00Z',
        },
        {
          id: 'd3',
          title: 'Draft Devotional',
          content: 'This is still being written',
          author: 'Deacon Paul',
          scriptureReference: '',
          publishDate: '2025-03-25T00:00:00Z',
          isPublished: false,
          isFeatured: false,
          featuredImageUrl: '',
          createdAt: '2025-03-15T00:00:00Z',
          updatedAt: '2025-03-15T00:00:00Z',
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

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: any, fmt: string) => 'Jan 1, 2025',
}))

import DevotionalsManagementPage from '@/app/(dashboard)/admin/devotionals/page'

describe('DevotionalsManagementPage', () => {
  it('renders the heading', () => {
    render(<DevotionalsManagementPage />)
    expect(screen.getByText('Devotionals')).toBeInTheDocument()
  })

  it('renders statistics cards', () => {
    render(<DevotionalsManagementPage />)
    expect(screen.getByText('Drafts')).toBeInTheDocument()
  })

  it('renders devotional titles', () => {
    render(<DevotionalsManagementPage />)
    expect(screen.getByText('Walking in Faith')).toBeInTheDocument()
    expect(screen.getByText('Grace and Mercy')).toBeInTheDocument()
    expect(screen.getByText('Draft Devotional')).toBeInTheDocument()
  })

  it('renders author names', () => {
    render(<DevotionalsManagementPage />)
    expect(screen.getByText('Pastor James')).toBeInTheDocument()
    expect(screen.getByText('Elder Sarah')).toBeInTheDocument()
    expect(screen.getByText('Deacon Paul')).toBeInTheDocument()
  })

  it('renders New Devotional button', () => {
    render(<DevotionalsManagementPage />)
    expect(screen.getByRole('button', { name: /New Devotional/i })).toBeInTheDocument()
  })

  it('renders scripture references', () => {
    render(<DevotionalsManagementPage />)
    expect(screen.getByText('Hebrews 11:1')).toBeInTheDocument()
    expect(screen.getByText('Ephesians 2:8-9')).toBeInTheDocument()
  })
})
