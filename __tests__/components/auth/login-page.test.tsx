/**
 * LoginPage Component Tests
 *
 * Uses vi.mock for Apollo to avoid Radix UI issues with MockedProvider + Suspense.
 * The Apollo mock is scoped to this file only via module isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}))

const { mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({ default: { error: mockToastError, success: mockToastSuccess } }))

const { mockRequestOtp } = vi.hoisted(() => ({ mockRequestOtp: vi.fn() }))
vi.mock('@apollo/client/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client/react')>()
  return { ...actual, useMutation: () => [mockRequestOtp, { loading: false }] }
})

// Import after mocks are set up
import LoginPage from '@/app/(auth)/login/page'

function renderLogin() {
  return render(<LoginPage />)
}

describe('LoginPage', () => {
  beforeEach(() => { mockPush.mockClear(); mockToastError.mockClear(); mockToastSuccess.mockClear(); mockRequestOtp.mockClear() })

  it('renders Member Login heading', () => {
    renderLogin()
    expect(screen.getByText(/member login/i)).toBeInTheDocument()
  })

  it('renders +254 prefix', () => {
    renderLogin()
    expect(screen.getByText('+254')).toBeInTheDocument()
  })

  it('renders phone number input', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('797030300')).toBeInTheDocument()
  })

  it('renders Send Verification Code button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument()
  })

  it('submit button is disabled when phone is empty', () => {
    renderLogin()
    const btn = screen.getByRole('button', { name: /send verification code/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('submit button is disabled when phone is less than 9 digits', () => {
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('797030300'), { target: { value: '12345' } })
    const btn = screen.getByRole('button', { name: /send verification code/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('submit button is enabled when phone is exactly 9 digits', () => {
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('797030300'), { target: { value: '797030300' } })
    const btn = screen.getByRole('button', { name: /send verification code/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('strips leading zero from phone input', () => {
    renderLogin()
    const input = screen.getByPlaceholderText('797030300') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0797030300' } })
    expect(input.value).toBe('797030300')
  })

  it('navigates to /verify-otp on successful OTP request', async () => {
    mockRequestOtp.mockResolvedValue({ data: { requestOtp: { success: true, message: 'OTP sent' } } })
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('797030300'), { target: { value: '797030300' } })
    fireEvent.click(screen.getByRole('button', { name: /send verification code/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/verify-otp')))
  })

  it('shows error toast on failed OTP request', async () => {
    mockRequestOtp.mockResolvedValue({ data: { requestOtp: { success: false, message: 'Member not found' } } })
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('797030300'), { target: { value: '797030300' } })
    fireEvent.click(screen.getByRole('button', { name: /send verification code/i }))
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
  })
})
