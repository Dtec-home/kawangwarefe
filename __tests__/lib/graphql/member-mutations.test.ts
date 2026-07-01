import { describe, it, expect } from 'vitest'
import {
  CREATE_MEMBER,
  UPDATE_MEMBER,
  TOGGLE_MEMBER_STATUS,
  DELETE_MEMBER,
  ASSIGN_ROLE,
  REMOVE_ROLE,
  SET_MEMBER_GROUPS,
} from '@/lib/graphql/member-mutations'

describe('member-mutations', () => {
  it('exports CREATE_MEMBER as DocumentNode', () => {
    expect(CREATE_MEMBER).toBeDefined()
    expect(CREATE_MEMBER.kind).toBe('Document')
  })

  it('CREATE_MEMBER contains createMember operation', () => {
    const body = (CREATE_MEMBER as any).loc?.source?.body || ''
    expect(body).toContain('createMember')
  })

  it('exports UPDATE_MEMBER as DocumentNode', () => {
    expect(UPDATE_MEMBER).toBeDefined()
    expect(UPDATE_MEMBER.kind).toBe('Document')
  })

  it('UPDATE_MEMBER contains updateMember operation', () => {
    const body = (UPDATE_MEMBER as any).loc?.source?.body || ''
    expect(body).toContain('updateMember')
  })

  it('exports TOGGLE_MEMBER_STATUS as DocumentNode', () => {
    expect(TOGGLE_MEMBER_STATUS).toBeDefined()
    expect(TOGGLE_MEMBER_STATUS.kind).toBe('Document')
  })

  it('TOGGLE_MEMBER_STATUS contains toggleMemberStatus operation', () => {
    const body = (TOGGLE_MEMBER_STATUS as any).loc?.source?.body || ''
    expect(body).toContain('toggleMemberStatus')
  })

  it('exports DELETE_MEMBER as DocumentNode', () => {
    expect(DELETE_MEMBER).toBeDefined()
    expect(DELETE_MEMBER.kind).toBe('Document')
  })

  it('DELETE_MEMBER contains deleteMember operation', () => {
    const body = (DELETE_MEMBER as any).loc?.source?.body || ''
    expect(body).toContain('deleteMember')
  })

  it('exports ASSIGN_ROLE as DocumentNode', () => {
    expect(ASSIGN_ROLE).toBeDefined()
    expect(ASSIGN_ROLE.kind).toBe('Document')
  })

  it('ASSIGN_ROLE contains assignRole operation', () => {
    const body = (ASSIGN_ROLE as any).loc?.source?.body || ''
    expect(body).toContain('assignRole')
  })

  it('exports REMOVE_ROLE as DocumentNode', () => {
    expect(REMOVE_ROLE).toBeDefined()
    expect(REMOVE_ROLE.kind).toBe('Document')
  })

  it('REMOVE_ROLE contains removeRole operation', () => {
    const body = (REMOVE_ROLE as any).loc?.source?.body || ''
    expect(body).toContain('removeRole')
  })

  it('exports SET_MEMBER_GROUPS as DocumentNode', () => {
    expect(SET_MEMBER_GROUPS).toBeDefined()
    expect(SET_MEMBER_GROUPS.kind).toBe('Document')
  })

  it('SET_MEMBER_GROUPS contains setMemberGroups operation', () => {
    const body = (SET_MEMBER_GROUPS as any).loc?.source?.body || ''
    expect(body).toContain('setMemberGroups')
  })
})
