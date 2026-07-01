import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      youtubeVideos: [
        {
          id: 'v1',
          title: 'Sunday Sermon - Faith in Action',
          videoId: 'abc123',
          description: 'Pastor delivers a powerful message on faith',
          category: 'sermon',
          isFeatured: true,
          source: 'manual',
          channelId: 'UC123',
          playlistId: '',
          publishDate: '2025-03-15T00:00:00Z',
          duration: 2700,
          viewCount: 1500,
          likeCount: 120,
          embedUrl: 'https://youtube.com/embed/abc123',
          watchUrl: 'https://youtube.com/watch?v=abc123',
          thumbnailUrl: 'https://img.youtube.com/vi/abc123/0.jpg',
          createdAt: '2025-03-15T00:00:00Z',
        },
        {
          id: 'v2',
          title: 'Worship Night Highlights',
          videoId: 'def456',
          description: 'Highlights from our monthly worship night',
          category: 'worship',
          isFeatured: false,
          source: 'channel',
          channelId: 'UC123',
          playlistId: '',
          publishDate: '2025-03-10T00:00:00Z',
          duration: 1800,
          viewCount: 800,
          likeCount: 65,
          embedUrl: 'https://youtube.com/embed/def456',
          watchUrl: 'https://youtube.com/watch?v=def456',
          thumbnailUrl: 'https://img.youtube.com/vi/def456/0.jpg',
          createdAt: '2025-03-10T00:00:00Z',
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

import YouTubeManagementPage from '@/app/(dashboard)/admin/youtube/page'

describe('YouTubeManagementPage', () => {
  it('renders the heading', () => {
    render(<YouTubeManagementPage />)
    expect(screen.getByText('YouTube Videos')).toBeInTheDocument()
  })

  it('renders video titles', () => {
    render(<YouTubeManagementPage />)
    expect(screen.getByText('Sunday Sermon - Faith in Action')).toBeInTheDocument()
    expect(screen.getByText('Worship Night Highlights')).toBeInTheDocument()
  })

  it('renders Add Video and Sync buttons', () => {
    render(<YouTubeManagementPage />)
    expect(screen.getByRole('button', { name: /Add Video/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /YouTube/i })).toBeInTheDocument()
  })

  it('renders video count', () => {
    render(<YouTubeManagementPage />)
    expect(screen.getByText('Videos (2)')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 video(s)')).toBeInTheDocument()
  })

  it('renders category badges on videos', () => {
    render(<YouTubeManagementPage />)
    expect(screen.getByText('sermon')).toBeInTheDocument()
    expect(screen.getByText('worship')).toBeInTheDocument()
  })
})
