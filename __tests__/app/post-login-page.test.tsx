/**
 * /post-login landing route (T5.3): the middleware sends signed-in visitors
 * of /login here; roles decide the landing page.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const { mockReplace, params, auth } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  params: { current: {} as Record<string, string> },
  auth: { isAuthenticated: true, isLoading: false },
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => ({ get: (k: string) => params.current[k] ?? null }),
}))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => auth }))

import PostLoginPage from '@/app/(auth)/post-login/page'
import { safeRedirectPath } from '@/lib/auth/post-login-redirect'

function stubRole(role: { isStaff: boolean; isRecorder: boolean }) {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: { currentUserRole: role } }) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('PostLoginPage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    params.current = {}
    auth.isAuthenticated = true
    auth.isLoading = false
    localStorage.setItem('access_token', 'jwt-token')
  })
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('shows a spinner while deciding', () => {
    stubRole({ isStaff: false, isRecorder: false })
    render(<PostLoginPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Signing you in')
  })

  it('sends a pure recorder to /record', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    render(<PostLoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/record'))
  })

  it('sends staff and members to /dashboard', async () => {
    stubRole({ isStaff: true, isRecorder: true })
    render(<PostLoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'))
  })

  it('honours a safe explicit redirect without asking for roles', async () => {
    const fetchMock = stubRole({ isStaff: false, isRecorder: true })
    params.current = { redirect: '/admin/reports' }
    render(<PostLoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin/reports'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores an unsafe redirect', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    params.current = { redirect: '//evil.example.com' }
    render(<PostLoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/record'))
  })

  it('waits for the auth check before deciding', async () => {
    const fetchMock = stubRole({ isStaff: false, isRecorder: true })
    auth.isLoading = true
    render(<PostLoginPage />)
    await new Promise((r) => setTimeout(r, 10))
    expect(mockReplace).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears a stale session cookie and returns to /login when not signed in', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    auth.isAuthenticated = false
    document.cookie = 'has_session=1; path=/'
    render(<PostLoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'))
    expect(document.cookie).not.toContain('has_session=1')
  })
})

describe('safeRedirectPath', () => {
  it('accepts same-origin paths only', () => {
    expect(safeRedirectPath('/admin/reports?tab=x')).toBe('/admin/reports?tab=x')
    expect(safeRedirectPath('https://evil.example.com')).toBeNull()
    expect(safeRedirectPath('//evil.example.com')).toBeNull()
    expect(safeRedirectPath('/\\evil.example.com')).toBeNull()
    expect(safeRedirectPath('')).toBeNull()
    expect(safeRedirectPath(null)).toBeNull()
  })

  it('rejects the auth routes to avoid loops', () => {
    expect(safeRedirectPath('/login')).toBeNull()
    expect(safeRedirectPath('/verify-otp?x=1')).toBeNull()
    expect(safeRedirectPath('/post-login')).toBeNull()
  })
})
