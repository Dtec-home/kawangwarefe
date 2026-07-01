import { describe, it, expect } from 'vitest'
import {
  CREATE_MANUAL_CONTRIBUTION,
  CREATE_MANUAL_MULTI_CONTRIBUTION,
  LOOKUP_MEMBER_BY_PHONE,
  GET_NEXT_RECEIPT_NUMBER,
  SET_RECEIPT_SEQUENCE,
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

  it('GET_NEXT_RECEIPT_NUMBER previews the next receipt (Ticket 9)', () => {
    expect(GET_NEXT_RECEIPT_NUMBER.kind).toBe('Document')
    const body = bodyOf(GET_NEXT_RECEIPT_NUMBER)
    expect(body).toContain('nextReceiptNumber')
  })

  it('SET_RECEIPT_SEQUENCE configures the sequence (Ticket 9)', () => {
    expect(SET_RECEIPT_SEQUENCE.kind).toBe('Document')
    const body = bodyOf(SET_RECEIPT_SEQUENCE)
    expect(body).toContain('setReceiptSequence')
    expect(body).toContain('$nextNumber: Int')
    expect(body).toContain('$prefix: String')
    expect(body).toContain('$padding: Int')
  })
})
