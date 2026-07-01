import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: vi.fn(),
}))

import { useAuth } from '@/lib/auth/auth-context'
import { useUserRole } from '@/lib/hooks/use-user-role'
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route'

describe('AdminProtectedRoute', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders children when authenticated staff', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as any)
    vi.mocked(useUserRole).mockReturnValue({
      isStaff: true, isCategoryAdmin: false, canAccessContent: true, canAccessAdmin: true,
      loading: false, roleInfo: { isAuthenticated: true },
    } as any)
    render(<AdminProtectedRoute><div>Admin page</div></AdminProtectedRoute>)
    expect(screen.getByText('Admin page')).toBeInTheDocument()
  })

  it('shows loading when auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true } as any)
    vi.mocked(useUserRole).mockReturnValue({
      isStaff: false, isCategoryAdmin: false, canAccessContent: false, canAccessAdmin: false,
      loading: true, roleInfo: undefined,
    } as any)
    render(<AdminProtectedRoute><div>Content</div></AdminProtectedRoute>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false } as any)
    vi.mocked(useUserRole).mockReturnValue({
      isStaff: false, isCategoryAdmin: false, canAccessContent: false, canAccessAdmin: false,
      loading: false, roleInfo: { isAuthenticated: false },
    } as any)
    render(<AdminProtectedRoute><div>Hidden</div></AdminProtectedRoute>)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('redirects to dashboard when no admin access', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as any)
    vi.mocked(useUserRole).mockReturnValue({
      isStaff: false, isCategoryAdmin: false, canAccessContent: false, canAccessAdmin: false,
      loading: false, roleInfo: { isAuthenticated: true },
    } as any)
    render(<AdminProtectedRoute><div>Hidden</div></AdminProtectedRoute>)
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
