import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      events: [
        {
          id: 'e1',
          title: 'Sunday Service',
          description: 'Weekly worship service for all members',
          eventDate: '2027-04-15',
          eventTime: '09:00',
          location: 'Main Sanctuary',
          registrationLink: 'https://register.example.com',
          isActive: true,
          featuredImageUrl: '',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'e2',
          title: 'Youth Camp',
          description: 'Annual youth camp retreat',
          eventDate: '2027-06-20',
          eventTime: '08:00',
          location: 'Naivasha Conference Center',
          registrationLink: '',
          isActive: true,
          featuredImageUrl: '',
          createdAt: '2025-02-01T00:00:00Z',
          updatedAt: '2025-02-01T00:00:00Z',
        },
        {
          id: 'e3',
          title: 'Christmas Celebration',
          description: 'Festive end of year event',
          eventDate: '2024-12-25',
          eventTime: '10:00',
          location: 'Church Grounds',
          registrationLink: '',
          isActive: false,
          featuredImageUrl: '',
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-01T00:00:00Z',
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
  isPast: (d: any) => new Date(d) < new Date(),
  isFuture: (d: any) => new Date(d) > new Date(),
  isToday: () => false,
  parseISO: (s: string) => new Date(s),
}))

import EventsManagementPage from '@/app/(dashboard)/admin/events/page'

describe('EventsManagementPage', () => {
  it('renders the heading', () => {
    render(<EventsManagementPage />)
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  it('renders statistics cards', () => {
    render(<EventsManagementPage />)
    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('Past Events')).toBeInTheDocument()
  })

  it('renders event titles', () => {
    render(<EventsManagementPage />)
    expect(screen.getByText('Sunday Service')).toBeInTheDocument()
    expect(screen.getByText('Youth Camp')).toBeInTheDocument()
    expect(screen.getByText('Christmas Celebration')).toBeInTheDocument()
  })

  it('renders New Event button', () => {
    render(<EventsManagementPage />)
    expect(screen.getByRole('button', { name: /New Event/i })).toBeInTheDocument()
  })

  it('renders event locations', () => {
    render(<EventsManagementPage />)
    expect(screen.getByText('Main Sanctuary')).toBeInTheDocument()
    expect(screen.getByText('Naivasha Conference Center')).toBeInTheDocument()
    expect(screen.getByText('Church Grounds')).toBeInTheDocument()
  })
})
