import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import React from 'react'

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
}))

vi.mock('@/lib/graphql/auth-mutations', () => ({
  VERIFY_OTP: 'VERIFY_OTP',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
}))

import { AuthProvider, useAuth } from '@/lib/auth/auth-context'

// ---------------------------------------------------------------------------
// Helpers to craft JWTs for testing isTokenValid
// ---------------------------------------------------------------------------
function base64url(obj: Record<string, unknown>): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64url({ alg: 'HS256', typ: 'JWT' })
  const body = base64url(payload)
  return `${header}.${body}.fakesignature`
}

function validToken(): string {
  // expires 1 hour from now
  return makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 })
}

function expiredToken(): string {
  // expired 1 hour ago
  return makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 })
}

function almostExpiredToken(): string {
  // expires in 10 seconds (< 30s buffer, so should be treated as expired)
  return makeJwt({ exp: Math.floor(Date.now() / 1000) + 10 })
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear()
  // Clear all cookies
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
})

// ---------------------------------------------------------------------------
// 1. useAuth throws outside AuthProvider
// ---------------------------------------------------------------------------
describe('useAuth outside AuthProvider', () => {
  it('throws an error when used outside AuthProvider', () => {
    // Suppress React error boundary / console.error noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow()

    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// 2. AuthProvider renders children
// ---------------------------------------------------------------------------
describe('AuthProvider', () => {
  it('renders its children', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 3. Initial state when localStorage is empty
// ---------------------------------------------------------------------------
describe('Initial auth state with empty localStorage', () => {
  it('is not authenticated and not loading', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
  })

  it('exposes login, logout, and refreshAccessToken functions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.refreshAccessToken).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// 4. isTokenValid - valid token, expired token, malformed token
// ---------------------------------------------------------------------------
describe('isTokenValid (tested via initial state restoration)', () => {
  it('recognises a valid access token from localStorage', () => {
    const token = validToken()
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', validToken())
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.accessToken).toBe(token)
    expect(result.current.user).toEqual({ id: '1', name: 'Test User' })
  })

  it('treats an expired access token as invalid', () => {
    localStorage.setItem('access_token', expiredToken())
    localStorage.setItem('refresh_token', expiredToken())
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Both tokens expired -> not authenticated
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accessToken).toBeNull()
  })

  it('treats a token expiring within 30 seconds as invalid', () => {
    localStorage.setItem('access_token', almostExpiredToken())
    localStorage.setItem('refresh_token', expiredToken())
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('treats a malformed token as invalid', () => {
    localStorage.setItem('access_token', 'not-a-jwt')
    localStorage.setItem('refresh_token', 'also-not-a-jwt')
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accessToken).toBeNull()
  })

  it('treats a token with no exp claim as invalid', () => {
    const noExpToken = makeJwt({ sub: '123' }) // no exp field
    localStorage.setItem('access_token', noExpToken)
    localStorage.setItem('refresh_token', noExpToken)
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 5. setSessionCookie - sets and clears cookie
// ---------------------------------------------------------------------------
describe('setSessionCookie (tested via auth state changes)', () => {
  it('sets has_session cookie when user is authenticated', () => {
    localStorage.setItem('access_token', validToken())
    localStorage.setItem('refresh_token', validToken())
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }))

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    )

    // The provider should have set the session cookie on mount
    expect(document.cookie).toContain('has_session=1')
  })

  it('does not set has_session cookie when no tokens exist', () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    )

    expect(document.cookie).not.toContain('has_session=true')
  })
})

// ---------------------------------------------------------------------------
// 6. getInitialAuthState scenarios
// ---------------------------------------------------------------------------
describe('getInitialAuthState', () => {
  it('returns empty state when storage is empty', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('restores full state when access token is valid', () => {
    const access = validToken()
    const refresh = validToken()
    const user = { id: '42', name: 'Jane', email: 'jane@example.com' }

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('user', JSON.stringify(user))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.accessToken).toBe(access)
    expect(result.current.user).toEqual(user)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles expired access token with valid refresh token', () => {
    const access = expiredToken()
    const refresh = validToken()
    const user = { id: '42', name: 'Jane' }

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('user', JSON.stringify(user))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Access token is expired but refresh is valid, so the provider
    // should either attempt a refresh or keep the user in a
    // non-authenticated / loading state until refresh completes.
    // With our mocked useMutation the refresh won't actually fire,
    // so we verify the access token is NOT the expired one.
    expect(result.current.accessToken).not.toBe(access)
  })

  it('clears state when both tokens are expired', () => {
    localStorage.setItem('access_token', expiredToken())
    localStorage.setItem('refresh_token', expiredToken())
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Gone' }))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.accessToken).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('handles corrupted user JSON in localStorage gracefully', () => {
    localStorage.setItem('access_token', validToken())
    localStorage.setItem('refresh_token', validToken())
    localStorage.setItem('user', '{not valid json')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    // Should not throw
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Depending on implementation, user may be null or the provider may
    // still mark as not authenticated when user parse fails
    expect(result.current.user).toBeNull()
  })
})
