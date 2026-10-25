/**
 * resolvePostLoginRedirect — role-based landing page (T2.4 / RR-4)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect'

function mockRole(role: { isStaff: boolean; isRecorder: boolean }) {
  return vi.fn().mockResolvedValue({ json: async () => ({ data: { currentUserRole: role } }) })
}

describe('resolvePostLoginRedirect', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'jwt-token')
  })
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('returns an explicit redirect without asking the server', async () => {
    const fetchMock = mockRole({ isStaff: false, isRecorder: true })
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolvePostLoginRedirect('/admin/reports')).resolves.toBe('/admin/reports')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a pure recorder to /record', async () => {
    const fetchMock = mockRole({ isStaff: false, isRecorder: true })
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolvePostLoginRedirect(null)).resolves.toBe('/record')
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.authorization).toBe('Bearer jwt-token')
  })

  it('sends staff (even with recorder role) to /dashboard', async () => {
    vi.stubGlobal('fetch', mockRole({ isStaff: true, isRecorder: true }))
    await expect(resolvePostLoginRedirect(null)).resolves.toBe('/dashboard')
  })

  it('sends a regular member to /dashboard', async () => {
    vi.stubGlobal('fetch', mockRole({ isStaff: false, isRecorder: false }))
    await expect(resolvePostLoginRedirect(null)).resolves.toBe('/dashboard')
  })

  it('falls back to /dashboard when the role lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(resolvePostLoginRedirect(null)).resolves.toBe('/dashboard')
  })

  it('falls back to /dashboard without a token', async () => {
    localStorage.clear()
    const fetchMock = mockRole({ isStaff: false, isRecorder: true })
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolvePostLoginRedirect(null)).resolves.toBe('/dashboard')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
