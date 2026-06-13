/**
 * AuthProvider action tests: login / logout / refreshAccessToken.
 *
 * Complements auth-context.test.tsx (which covers init + token validation) by
 * driving the imperative auth methods. useMutation is routed by document so
 * each of VERIFY_OTP / LOGOUT / REFRESH_TOKEN gets its own controllable fn.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('@/lib/graphql/auth-mutations', () => ({
  VERIFY_OTP: 'VERIFY_OTP',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
}))

const verifyOtp = vi.fn()
const logoutFn = vi.fn()
const refreshFn = vi.fn()

vi.mock('@apollo/client/react', () => ({
  useMutation: (doc: string) => {
    if (doc === 'VERIFY_OTP') return [verifyOtp, { loading: false }]
    if (doc === 'LOGOUT') return [logoutFn, { loading: false }]
    if (doc === 'REFRESH_TOKEN') return [refreshFn, { loading: false }]
    return [vi.fn(), { loading: false }]
  },
}))

import { AuthProvider, useAuth } from '@/lib/auth/auth-context'

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: Record<string, unknown>) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`
}
const validToken = () => makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 })

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.cookie = `has_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
})

describe('login', () => {
  it('persists tokens + user and authenticates on success', async () => {
    verifyOtp.mockResolvedValue({
      data: {
        verifyOtp: {
          success: true,
          message: 'Welcome',
          accessToken: validToken(),
          refreshToken: validToken(),
          userId: 5,
          memberId: 9,
          phoneNumber: '254700000000',
          fullName: 'Jane Doe',
          isNewMember: true,
        },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    let res!: { success: boolean; isNewMember?: boolean }
    await act(async () => {
      res = await result.current.login('254700000000', '123456')
    })

    expect(res.success).toBe(true)
    expect(res.isNewMember).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toMatchObject({
      userId: 5,
      memberId: 9,
      fullName: 'Jane Doe',
    })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
  })

  it('returns the server failure message without storing tokens', async () => {
    verifyOtp.mockResolvedValue({
      data: { verifyOtp: { success: false, message: 'Bad OTP' } },
    })
    const { result } = renderHook(() => useAuth(), { wrapper })

    let res!: { success: boolean; message: string }
    await act(async () => {
      res = await result.current.login('254700000000', '000000')
    })
    expect(res).toEqual({ success: false, message: 'Bad OTP' })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('handles an empty server response', async () => {
    verifyOtp.mockResolvedValue({ data: null })
    const { result } = renderHook(() => useAuth(), { wrapper })
    let res!: { success: boolean; message: string }
    await act(async () => {
      res = await result.current.login('254700000000', '1')
    })
    expect(res.success).toBe(false)
    expect(res.message).toMatch(/No response/i)
  })

  it('returns the error message when the mutation throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    verifyOtp.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    let res!: { success: boolean; message: string }
    await act(async () => {
      res = await result.current.login('254700000000', '1')
    })
    expect(res).toEqual({ success: false, message: 'network down' })
  })
})

describe('logout', () => {
  it('calls the logout mutation and clears all storage', async () => {
    localStorage.setItem(TOKEN_KEY, validToken())
    localStorage.setItem(REFRESH_TOKEN_KEY, validToken())
    localStorage.setItem(USER_KEY, JSON.stringify({ userId: 1 }))
    logoutFn.mockResolvedValue({ data: { logout: { success: true } } })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.logout()
    })

    expect(logoutFn).toHaveBeenCalled()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('clears storage even when the logout mutation throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(TOKEN_KEY, validToken())
    localStorage.setItem(REFRESH_TOKEN_KEY, validToken())
    logoutFn.mockRejectedValue(new Error('server 500'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.logout()
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('skips the mutation when there is no refresh token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.logout()
    })
    expect(logoutFn).not.toHaveBeenCalled()
  })
})

describe('refreshAccessToken', () => {
  it('returns false when there is no refresh token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    let ok!: boolean
    await act(async () => {
      ok = await result.current.refreshAccessToken()
    })
    expect(ok).toBe(false)
    expect(refreshFn).not.toHaveBeenCalled()
  })

  it('stores the new access token and returns true on success', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, validToken())
    const fresh = validToken()
    refreshFn.mockResolvedValue({
      data: { refreshToken: { success: true, accessToken: fresh } },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let ok!: boolean
    await act(async () => {
      ok = await result.current.refreshAccessToken()
    })
    expect(ok).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe(fresh)
  })

  it('logs out and returns false when the refresh is rejected by the server', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, validToken())
    localStorage.setItem(TOKEN_KEY, validToken())
    refreshFn.mockResolvedValue({
      data: { refreshToken: { success: false, accessToken: null } },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let ok!: boolean
    await act(async () => {
      ok = await result.current.refreshAccessToken()
    })
    expect(ok).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('logs out and returns false when the mutation throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(REFRESH_TOKEN_KEY, validToken())
    refreshFn.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    let ok!: boolean
    await act(async () => {
      ok = await result.current.refreshAccessToken()
    })
    expect(ok).toBe(false)
  })
})
