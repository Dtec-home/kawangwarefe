/**
 * VerifyOtpPage Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VerifyOtpPage from '@/app/(auth)/verify-otp/page'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (k: string) => k === 'phone' ? '254797030300' : null }),
}))

const mockLogin = vi.fn()
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ login: mockLogin }) }))

const { mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({ default: { error: mockToastError, success: mockToastSuccess } }))

function renderPage() { return render(<VerifyOtpPage />) }

describe('VerifyOtpPage', () => {
  beforeEach(() => { mockPush.mockClear(); mockLogin.mockClear(); mockToastError.mockClear() })

  it('renders Verify Your Phone heading', () => {
    renderPage()
    expect(screen.getByText(/verify your phone/i)).toBeInTheDocument()
  })

  it('renders 6 OTP digit inputs', () => {
    renderPage()
    expect(screen.getAllByRole('textbox').length).toBe(6)
  })

  it('renders the phone number in the description', () => {
    renderPage()
    expect(screen.getByText('254797030300')).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /verify|verifying/i })
    expect(btn).toBeInTheDocument()
  })

  it('submit button is disabled when OTP is incomplete', () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /verify|verifying/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('renders Back to Login button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument()
  })

  it('renders resend OTP link', () => {
    renderPage()
    expect(screen.getByText(/didn.*t receive|request new otp/i)).toBeInTheDocument()
  })

  it('calls login with phone and OTP when last digit is entered', async () => {
    mockLogin.mockResolvedValue({ success: true, message: 'OK' })
    renderPage()
    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: String(i + 1) } })
    }
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('254797030300', '123456'))
  })

  it('navigates to /dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ success: true, message: 'OK' })
    renderPage()
    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: String(i + 1) } })
    }
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows error toast on failed login', async () => {
    mockLogin.mockResolvedValue({ success: false, message: 'Invalid OTP' })
    renderPage()
    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: String(i + 1) } })
    }
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Invalid OTP'))
  })
})
