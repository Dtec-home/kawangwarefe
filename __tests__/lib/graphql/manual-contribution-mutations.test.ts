import { describe, it, expect } from 'vitest'
import {
  CREATE_MANUAL_CONTRIBUTION,
  CREATE_MANUAL_MULTI_CONTRIBUTION,
  LOOKUP_MEMBER_BY_PHONE,
} from '@/lib/graphql/manual-contribution-mutations'

const bodyOf = (doc: any) => doc.loc?.source?.body || ''

describe('manual-contribution-mutations', () => {
  it('exports CREATE_MANUAL_CONTRIBUTION as DocumentNode', () => {
    expect(CREATE_MANUAL_CONTRIBUTION).toBeDefined()
    expect(CREATE_MANUAL_CONTRIBUTION.kind).toBe('Document')
  })

  it('CREATE_MANUAL_CONTRIBUTION contains createManualContribution operation', () => {
    const body = (CREATE_MANUAL_CONTRIBUTION as any).loc?.source?.body || ''
    expect(body).toContain('createManualContribution')
  })

  it('exports LOOKUP_MEMBER_BY_PHONE as DocumentNode', () => {
    expect(LOOKUP_MEMBER_BY_PHONE).toBeDefined()
    expect(LOOKUP_MEMBER_BY_PHONE.kind).toBe('Document')
  })

  it('LOOKUP_MEMBER_BY_PHONE contains lookupMemberByPhone operation', () => {
    const body = (LOOKUP_MEMBER_BY_PHONE as any).loc?.source?.body || ''
    expect(body).toContain('lookupMemberByPhone')
  })

  it('CREATE_MANUAL_CONTRIBUTION takes optional phoneNumber + giverName (Ticket 7)', () => {
    const body = bodyOf(CREATE_MANUAL_CONTRIBUTION)
    // optional => no "!" after String
    expect(body).toContain('$phoneNumber: String\n')
    expect(body).toContain('$giverName: String')
    expect(body).toContain('$purposeId: ID')
  })

  it('CREATE_MANUAL_MULTI_CONTRIBUTION wires the multi-line mutation (Ticket 6)', () => {
    expect(CREATE_MANUAL_MULTI_CONTRIBUTION.kind).toBe('Document')
    const body = bodyOf(CREATE_MANUAL_MULTI_CONTRIBUTION)
    expect(body).toContain('createManualMultiContribution')
    expect(body).toContain('[ManualCategoryAmountInput!]!')
    expect(body).toContain('giverName')
  })

  it('CREATE_MANUAL_MULTI_CONTRIBUTION returns the system receipt number (T1.8)', () => {
    expect(bodyOf(CREATE_MANUAL_MULTI_CONTRIBUTION)).toContain('receiptNumber')
  })

  it('no longer exports the retired receipt-sequence documents (RC-3)', async () => {
    const mod: Record<string, unknown> = await import('@/lib/graphql/manual-contribution-mutations')
    expect(mod.GET_NEXT_RECEIPT_NUMBER).toBeUndefined()
    expect(mod.SET_RECEIPT_SEQUENCE).toBeUndefined()
  })
})
