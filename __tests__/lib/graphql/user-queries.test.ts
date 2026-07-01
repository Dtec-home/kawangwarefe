import { describe, it, expect } from 'vitest'
import { CHECK_USER_ROLE } from '@/lib/graphql/user-queries'

describe('user-queries', () => {
  it('exports CHECK_USER_ROLE as DocumentNode', () => {
    expect(CHECK_USER_ROLE).toBeDefined()
    expect(CHECK_USER_ROLE.kind).toBe('Document')
  })

  it('CHECK_USER_ROLE contains dashboardStats query', () => {
    const body = (CHECK_USER_ROLE as any).loc?.source?.body || ''
    expect(body).toContain('dashboardStats')
  })
})
