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

  type AuthValue = ReturnType<typeof useAuth>
  type RoleValue = ReturnType<typeof useUserRole>

  describe('recorder (T2.4)', () => {
    const pureRecorder = {
      isStaff: false, isCategoryAdmin: false, canAccessContent: false, canAccessAdmin: false,
      canSendBulkMessage: false, isRecorder: true, isPureRecorder: true,
      loading: false, roleInfo: { isAuthenticated: true },
    }

    it('lets a pure recorder into a requiredAccess="recorder" route', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)
      vi.mocked(useUserRole).mockReturnValue(pureRecorder as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="recorder"><div>Record page</div></AdminProtectedRoute>)
      expect(screen.getByText('Record page')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('lets staff into a requiredAccess="recorder" route', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)
      vi.mocked(useUserRole).mockReturnValue({ ...pureRecorder, isStaff: true, isRecorder: false, isPureRecorder: false, canAccessAdmin: true } as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="recorder"><div>Record page</div></AdminProtectedRoute>)
      expect(screen.getByText('Record page')).toBeInTheDocument()
    })

    it('redirects a pure recorder hitting another admin route to /record', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)
      vi.mocked(useUserRole).mockReturnValue(pureRecorder as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="staff"><div>Reports</div></AdminProtectedRoute>)
      expect(screen.queryByText('Reports')).not.toBeInTheDocument()
      expect(mockPush).toHaveBeenCalledWith('/record')
    })

    it('redirects a regular member hitting the recorder route to /dashboard', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)
      vi.mocked(useUserRole).mockReturnValue({ ...pureRecorder, isRecorder: false, isPureRecorder: false } as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="recorder"><div>Record page</div></AdminProtectedRoute>)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('department reports (DR-4, D1)', () => {
    const base = {
      isStaff: false, isCategoryAdmin: false, canAccessContent: false, canAccessAdmin: false,
      canSendBulkMessage: false, isRecorder: false, isPureRecorder: false, ledDepartmentIds: [] as string[],
      loading: false, roleInfo: { isAuthenticated: true },
    }
    const page = <AdminProtectedRoute requiredAccess="department-reports"><div>Reports page</div></AdminProtectedRoute>

    it.each([
      ['staff', { isStaff: true }],
      ['a category admin', { isCategoryAdmin: true }],
      ['a leader known only through a department-admin scope', { ledDepartmentIds: ['7'] }],
    ])('lets %s in', (_who, overrides) => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)
      vi.mocked(useUserRole).mockReturnValue({ ...base, ...overrides } as unknown as RoleValue)
      render(page)
      expect(screen.getByText('Reports page')).toBeInTheDocument()
    })

    it('keeps a pure recorder out', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)
      vi.mocked(useUserRole).mockReturnValue({ ...base, isRecorder: true, isPureRecorder: true } as unknown as RoleValue)
      render(page)
      expect(screen.queryByText('Reports page')).not.toBeInTheDocument()
      expect(mockPush).toHaveBeenCalledWith('/record')
    })
  })

  describe('clerk (R4)', () => {
    const base = {
      isStaff: false, isCategoryAdmin: false, canAccessContent: false, canAccessAdmin: false,
      canSendBulkMessage: false, isRecorder: false, isPureRecorder: false, ledDepartmentIds: [] as string[],
      isClerk: false, isPureClerk: false,
      loading: false, roleInfo: { isAuthenticated: true },
    }
    const clerk = { ...base, isClerk: true, isPureClerk: true }
    const signedIn = () =>
      vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as unknown as AuthValue)

    it('lets a clerk into department reports', () => {
      signedIn()
      vi.mocked(useUserRole).mockReturnValue(clerk as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="department-reports"><div>Reports page</div></AdminProtectedRoute>)
      expect(screen.getByText('Reports page')).toBeInTheDocument()
    })

    it.each([
      ['staff', { isStaff: true }, true],
      ['a clerk', { isClerk: true, isPureClerk: true }, true],
      ['a department leader', { isCategoryAdmin: true, ledDepartmentIds: ['7'] }, false],
      ['a plain member', {}, false],
    ])('reports-viewer (tracker, periods): %s → %s', (_who, overrides, allowed) => {
      signedIn()
      vi.mocked(useUserRole).mockReturnValue({ ...base, ...overrides } as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="reports-viewer"><div>Tracker</div></AdminProtectedRoute>)
      if (allowed) expect(screen.getByText('Tracker')).toBeInTheDocument()
      else expect(screen.queryByText('Tracker')).not.toBeInTheDocument()
    })

    it.each([
      ['staff', { isStaff: true }, true],
      ['a department leader', { isCategoryAdmin: true }, true],
      ['a scoped leader', { ledDepartmentIds: ['7'] }, true],
      ['a clerk', { isClerk: true, isPureClerk: true }, false],
      ['a plain member', {}, false],
    ])('department-leaders (fund transfers): %s → %s', (_who, overrides, allowed) => {
      signedIn()
      vi.mocked(useUserRole).mockReturnValue({ ...base, ...overrides } as unknown as RoleValue)
      render(<AdminProtectedRoute requiredAccess="department-leaders"><div>Transfers</div></AdminProtectedRoute>)
      if (allowed) expect(screen.getByText('Transfers')).toBeInTheDocument()
      else expect(screen.queryByText('Transfers')).not.toBeInTheDocument()
    })

    it.each(['staff', 'any-admin', 'category-admin', 'recorder', 'messaging', 'content-admin', 'department-leaders'] as const)(
      'keeps a clerk out of %s routes and sends them to Department Reports',
      (access) => {
        signedIn()
        vi.mocked(useUserRole).mockReturnValue(clerk as unknown as RoleValue)
        render(<AdminProtectedRoute requiredAccess={access}><div>Money page</div></AdminProtectedRoute>)
        expect(screen.queryByText('Money page')).not.toBeInTheDocument()
        expect(mockPush).toHaveBeenCalledWith('/admin/department-reports')
      },
    )
  })
})
