/**
 * ProtectedRoute Component Tests
 *
 * FIRST: Independent — AuthContext is mocked per test via a custom wrapper
 * ISTQB: Defect-clustering — auth guard is a high-risk, high-impact path
 *
 * Three behaviours:
 *   1. isLoading=true → show spinner, no redirect
 *   2. isLoading=false, isAuthenticated=false → redirect to /login, render nothing
 *   3. isLoading=false, isAuthenticated=true → render children
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AuthContext } from '@/lib/auth/auth-context'
import React from 'react'

// Type matches what AuthContext.Provider expects
const makeAuthValue = (overrides: Partial<{
  isAuthenticated: boolean
  isLoading: boolean
  user: null
  accessToken: null
  login: () => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}> = {}) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  accessToken: null,
  login: vi.fn().mockResolvedValue({ success: false, message: '' }),
  logout: vi.fn().mockResolvedValue(undefined),
  refreshAccessToken: vi.fn().mockResolvedValue(false),
  ...overrides,
})

function renderWithAuth(
  authValue: ReturnType<typeof makeAuthValue>,
  children: React.ReactNode = <div>Protected Content</div>
) {
  return render(
    <AuthContext.Provider value={authValue}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthContext.Provider>
  )
}

const mockRouter = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), pathname: '/' }
vi.mock('next/navigation', () => ({ useRouter: () => mockRouter, usePathname: () => '/' }))

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('while loading', () => {
    it('renders a loading spinner', () => {
      renderWithAuth(makeAuthValue({ isLoading: true }))
      // Loader2 renders as an SVG + "Loading..." text
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('does NOT render children while loading', () => {
      renderWithAuth(makeAuthValue({ isLoading: true }))
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('does NOT redirect while loading', () => {
      renderWithAuth(makeAuthValue({ isLoading: true }))
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('when NOT authenticated', () => {
    it('renders nothing (returns null) when not authenticated', () => {
      renderWithAuth(makeAuthValue({ isLoading: false, isAuthenticated: false }))
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('triggers a redirect to /login when not authenticated', () => {
      renderWithAuth(makeAuthValue({ isLoading: false, isAuthenticated: false }))
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })

  describe('when authenticated', () => {
    it('renders children when the user is authenticated', () => {
      renderWithAuth(makeAuthValue({ isLoading: false, isAuthenticated: true }))
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('does NOT redirect when authenticated', () => {
      renderWithAuth(makeAuthValue({ isLoading: false, isAuthenticated: true }))
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })
})
