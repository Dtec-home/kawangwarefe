import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation((doc: any) => {
    const name = doc?.definitions?.[0]?.name?.value ?? ''
    if (name === 'GetAdminAnnouncements') {
      return {
        data: {
          adminAnnouncements: {
            total: 3,
            hasMore: false,
            items: [
              {
                id: 'a1',
                title: 'Church Renovation Update',
                content: 'The renovation of the main sanctuary is on track',
                publishDate: '2025-03-15T00:00:00Z',
                isActive: true,
                priority: 2,
                createdAt: '2025-03-10T00:00:00Z',
                updatedAt: '2025-03-10T00:00:00Z',
              },
              {
                id: 'a2',
                title: 'Bible Study Schedule',
                content: 'New bible study sessions start next week on Wednesday evenings',
                publishDate: '2025-03-01T00:00:00Z',
                isActive: true,
                priority: 0,
                createdAt: '2025-02-28T00:00:00Z',
                updatedAt: '2025-02-28T00:00:00Z',
              },
              {
                id: 'a3',
                title: 'Old Announcement',
                content: 'This announcement is no longer active',
                publishDate: '2025-01-01T00:00:00Z',
                isActive: false,
                priority: 0,
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-01T00:00:00Z',
              },
            ],
          },
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      }
    }
    if (name === 'GetAdminAnnouncementCounts') {
      return {
        data: {
          adminAnnouncementCounts: {
            total: 3,
            active: 2,
            inactive: 1,
            scheduled: 0,
            expired: 0,
            highPriority: 1,
          },
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      }
    }
    return { data: null, loading: false, error: null, refetch: vi.fn() }
  }),
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

// Mock confirm dialog hook
vi.mock('@/hooks/use-confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    ConfirmDialog: () => null,
  }),
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: any, fmt: string) => 'Jan 1, 2025',
  isPast: () => false,
  isFuture: () => true,
  isToday: () => false,
}))

import AnnouncementsManagementPage from '@/app/(dashboard)/admin/announcements/page'

describe('AnnouncementsManagementPage', () => {
  it('renders the heading', () => {
    render(<AnnouncementsManagementPage />)
    expect(screen.getByText('Announcements')).toBeInTheDocument()
  })

  it('renders statistics cards', () => {
    render(<AnnouncementsManagementPage />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('High Priority')).toBeInTheDocument()
  })

  it('renders announcement titles', () => {
    render(<AnnouncementsManagementPage />)
    expect(screen.getByText('Church Renovation Update')).toBeInTheDocument()
    expect(screen.getByText('Bible Study Schedule')).toBeInTheDocument()
    expect(screen.getByText('Old Announcement')).toBeInTheDocument()
  })

  it('renders New Announcement button', () => {
    render(<AnnouncementsManagementPage />)
    expect(screen.getByRole('button', { name: /New Announcement/i })).toBeInTheDocument()
  })

  it('shows active and inactive badges', () => {
    render(<AnnouncementsManagementPage />)
    const activeBadges = screen.getAllByText('Active')
    expect(activeBadges.length).toBeGreaterThanOrEqual(2)
    const inactiveBadges = screen.getAllByText('Inactive')
    expect(inactiveBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('renders priority badge for high priority announcement', () => {
    render(<AnnouncementsManagementPage />)
    expect(screen.getByText('Priority 2')).toBeInTheDocument()
  })
})
