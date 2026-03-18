/**
 * ProtectedRoute Component Tests
 * Uses vi.mock for useAuth since AuthContext is not exported.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/auth/protected-route'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

const mockUseAuth = vi.fn()
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => mockUseAuth() }))

describe('ProtectedRoute', () => {
  beforeEach(() => mockPush.mockClear())

  describe('while loading', () => {
    beforeEach(() => mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false }))

    it('renders a loading spinner', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('does NOT render children while loading', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(screen.queryByText('Child')).not.toBeInTheDocument()
    })

    it('does NOT redirect while loading', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('when NOT authenticated', () => {
    beforeEach(() => mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false }))

    it('renders nothing when not authenticated', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(screen.queryByText('Child')).not.toBeInTheDocument()
    })

    it('triggers a redirect to /login', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('when authenticated', () => {
    beforeEach(() => mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: true }))

    it('renders children when authenticated', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(screen.getByText('Child')).toBeInTheDocument()
    })

    it('does NOT redirect when authenticated', () => {
      render(<ProtectedRoute><div>Child</div></ProtectedRoute>)
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
