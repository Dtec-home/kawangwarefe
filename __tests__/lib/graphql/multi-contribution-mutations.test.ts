import { describe, it, expect } from 'vitest'
import { INITIATE_MULTI_CONTRIBUTION } from '@/lib/graphql/multi-contribution-mutations'

describe('multi-contribution-mutations', () => {
  it('exports INITIATE_MULTI_CONTRIBUTION as DocumentNode', () => {
    expect(INITIATE_MULTI_CONTRIBUTION).toBeDefined()
    expect(INITIATE_MULTI_CONTRIBUTION.kind).toBe('Document')
  })

  it('INITIATE_MULTI_CONTRIBUTION contains initiateMultiCategoryContribution operation', () => {
    const body = (INITIATE_MULTI_CONTRIBUTION as any).loc?.source?.body || ''
    expect(body).toContain('initiateMultiCategoryContribution')
  })
})
