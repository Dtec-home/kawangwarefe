/**
 * Login + verify-OTP landing page for recorders (T2.4 / RR-4).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { mockPush, mockReplace, params } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  params: { current: {} as Record<string, string> },
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: (k: string) => params.current[k] ?? null }),
}))

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, login: mockLogin }),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock('@apollo/client/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client/react')>()
  return { ...actual, useMutation: () => [vi.fn(), { loading: false }] }
})

import LoginPage from '@/app/(auth)/login/page'
import VerifyOtpPage from '@/app/(auth)/verify-otp/page'

function stubRole(role: { isStaff: boolean; isRecorder: boolean }) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ data: { currentUserRole: role } }) }))
}

describe('post-login landing for recorders', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockReplace.mockClear()
    mockLogin.mockReset()
    params.current = {}
    localStorage.setItem('access_token', 'jwt-token')
  })
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('login page sends an already-authenticated pure recorder to /record', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    render(<LoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/record'))
  })

  it('login page keeps an explicit redirect for a pure recorder', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    params.current = { redirect: '/profile' }
    render(<LoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/profile'))
  })

  it('login page sends staff to /dashboard', async () => {
    stubRole({ isStaff: true, isRecorder: true })
    render(<LoginPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'))
  })

  function enterOtp() {
    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: String(i + 1) } })
    }
  }

  it('verify-OTP sends a pure recorder to /record after login', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    params.current = { phone: '254798765432' }
    mockLogin.mockResolvedValue({ success: true, message: 'OK' })
    render(<VerifyOtpPage />)
    enterOtp()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/record'))
  })

  it('verify-OTP honours an explicit redirect for a pure recorder', async () => {
    stubRole({ isStaff: false, isRecorder: true })
    params.current = { phone: '254798765432', redirect: '/admin/reports' }
    mockLogin.mockResolvedValue({ success: true, message: 'OK' })
    render(<VerifyOtpPage />)
    enterOtp()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/reports'))
  })

  it('verify-OTP sends a regular member to /dashboard', async () => {
    stubRole({ isStaff: false, isRecorder: false })
    params.current = { phone: '254798765432' }
    mockLogin.mockResolvedValue({ success: true, message: 'OK' })
    render(<VerifyOtpPage />)
    enterOtp()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })
})
