// @vitest-environment node
/**
 * Route middleware (T5.3): signed-in visitors of /login and /verify-otp go
 * to the role-aware /post-login route instead of /dashboard.
 */
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware, config } from '@/middleware'

function request(path: string, session: boolean) {
  const req = new NextRequest(new URL(path, 'http://localhost:3000'))
  if (session) req.cookies.set('has_session', '1')
  return req
}

const location = (res: Response) => res.headers.get('location')

describe('middleware', () => {
  it('sends a signed-in visitor of /login to /post-login', () => {
    expect(location(middleware(request('/login', true)))).toBe('http://localhost:3000/post-login')
    expect(location(middleware(request('/verify-otp', true)))).toBe('http://localhost:3000/post-login')
  })

  it('keeps a safe redirect target and drops an unsafe one', () => {
    expect(location(middleware(request('/login?redirect=%2Fadmin%2Freports', true)))).toBe(
      'http://localhost:3000/post-login?redirect=%2Fadmin%2Freports'
    )
    expect(location(middleware(request('/login?redirect=%2F%2Fevil.example.com', true)))).toBe(
      'http://localhost:3000/post-login'
    )
  })

  it('lets anonymous visitors see /login', () => {
    expect(location(middleware(request('/login', false)))).toBeNull()
  })

  it('protects /post-login and the app routes', () => {
    expect(location(middleware(request('/post-login', false)))).toBe(
      'http://localhost:3000/login?redirect=%2Fpost-login'
    )
    expect(location(middleware(request('/record', false)))).toBe('http://localhost:3000/login?redirect=%2Frecord')
    expect(location(middleware(request('/record', true)))).toBeNull()
    expect(config.matcher).toContain('/post-login')
  })
})
