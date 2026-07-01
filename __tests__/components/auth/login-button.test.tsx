import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/lib/auth/auth-context'
import { LoginButton } from '@/components/auth/login-button'

describe('LoginButton', () => {
  it('renders login button when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false } as any)
    render(<LoginButton />)
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('hides when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as any)
    const { container } = render(<LoginButton />)
    expect(container.innerHTML).toBe('')
  })

  it('shows when authenticated if showWhenAuthenticated is true', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as any)
    render(<LoginButton showWhenAuthenticated />)
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('hides while loading', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: true } as any)
    const { container } = render(<LoginButton />)
    expect(container.innerHTML).toBe('')
  })

  it('navigates to /login on click', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false } as any)
    render(<LoginButton />)
    fireEvent.click(screen.getByText('Login'))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('renders custom children', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isLoading: false } as any)
    render(<LoginButton>Sign In</LoginButton>)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})
