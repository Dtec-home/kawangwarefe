import { describe, it, expect } from 'vitest'
import {
  REQUEST_OTP,
  VERIFY_OTP,
  REFRESH_TOKEN,
  LOGOUT,
} from '@/lib/graphql/auth-mutations'

describe('auth-mutations', () => {
  it('exports REQUEST_OTP as DocumentNode', () => {
    expect(REQUEST_OTP).toBeDefined()
    expect(REQUEST_OTP.kind).toBe('Document')
  })

  it('REQUEST_OTP contains requestOtp operation', () => {
    const body = (REQUEST_OTP as any).loc?.source?.body || ''
    expect(body).toContain('requestOtp')
  })

  it('exports VERIFY_OTP as DocumentNode', () => {
    expect(VERIFY_OTP).toBeDefined()
    expect(VERIFY_OTP.kind).toBe('Document')
  })

  it('VERIFY_OTP contains verifyOtp operation', () => {
    const body = (VERIFY_OTP as any).loc?.source?.body || ''
    expect(body).toContain('verifyOtp')
  })

  it('exports REFRESH_TOKEN as DocumentNode', () => {
    expect(REFRESH_TOKEN).toBeDefined()
    expect(REFRESH_TOKEN.kind).toBe('Document')
  })

  it('REFRESH_TOKEN contains refreshToken operation', () => {
    const body = (REFRESH_TOKEN as any).loc?.source?.body || ''
    expect(body).toContain('refreshToken')
  })

  it('exports LOGOUT as DocumentNode', () => {
    expect(LOGOUT).toBeDefined()
    expect(LOGOUT.kind).toBe('Document')
  })

  it('LOGOUT contains logout operation', () => {
    const body = (LOGOUT as any).loc?.source?.body || ''
    expect(body).toContain('logout')
  })
})
