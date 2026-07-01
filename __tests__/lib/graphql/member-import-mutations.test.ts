import { describe, it, expect } from 'vitest'
import {
  IMPORT_MEMBERS,
  GET_MEMBER_IMPORT_TEMPLATE,
} from '@/lib/graphql/member-import-mutations'

describe('member-import-mutations', () => {
  it('exports IMPORT_MEMBERS as DocumentNode', () => {
    expect(IMPORT_MEMBERS).toBeDefined()
    expect(IMPORT_MEMBERS.kind).toBe('Document')
  })

  it('IMPORT_MEMBERS contains importMembers operation', () => {
    const body = (IMPORT_MEMBERS as any).loc?.source?.body || ''
    expect(body).toContain('importMembers')
  })

  it('exports GET_MEMBER_IMPORT_TEMPLATE as DocumentNode', () => {
    expect(GET_MEMBER_IMPORT_TEMPLATE).toBeDefined()
    expect(GET_MEMBER_IMPORT_TEMPLATE.kind).toBe('Document')
  })

  it('GET_MEMBER_IMPORT_TEMPLATE contains getMemberImportTemplate operation', () => {
    const body = (GET_MEMBER_IMPORT_TEMPLATE as any).loc?.source?.body || ''
    expect(body).toContain('getMemberImportTemplate')
  })
})
