import { describe, it, expect } from 'vitest'
import {
  GET_GROUPS_LIST,
  CREATE_GROUP,
  UPDATE_GROUP,
  DELETE_GROUP,
  REMOVE_MEMBER_FROM_GROUP,
} from '@/lib/graphql/group-management'

describe('group-management', () => {
  it('exports GET_GROUPS_LIST as DocumentNode', () => {
    expect(GET_GROUPS_LIST).toBeDefined()
    expect(GET_GROUPS_LIST.kind).toBe('Document')
  })

  it('GET_GROUPS_LIST contains groupsList query', () => {
    const body = (GET_GROUPS_LIST as any).loc?.source?.body || ''
    expect(body).toContain('groupsList')
  })

  it('exports CREATE_GROUP as DocumentNode', () => {
    expect(CREATE_GROUP).toBeDefined()
    expect(CREATE_GROUP.kind).toBe('Document')
  })

  it('CREATE_GROUP contains createGroup operation', () => {
    const body = (CREATE_GROUP as any).loc?.source?.body || ''
    expect(body).toContain('createGroup')
  })

  it('exports UPDATE_GROUP as DocumentNode', () => {
    expect(UPDATE_GROUP).toBeDefined()
    expect(UPDATE_GROUP.kind).toBe('Document')
  })

  it('UPDATE_GROUP contains updateGroup operation', () => {
    const body = (UPDATE_GROUP as any).loc?.source?.body || ''
    expect(body).toContain('updateGroup')
  })

  it('exports DELETE_GROUP as DocumentNode', () => {
    expect(DELETE_GROUP).toBeDefined()
    expect(DELETE_GROUP.kind).toBe('Document')
  })

  it('DELETE_GROUP contains deleteGroup operation', () => {
    const body = (DELETE_GROUP as any).loc?.source?.body || ''
    expect(body).toContain('deleteGroup')
  })

  it('exports REMOVE_MEMBER_FROM_GROUP as DocumentNode', () => {
    expect(REMOVE_MEMBER_FROM_GROUP).toBeDefined()
    expect(REMOVE_MEMBER_FROM_GROUP.kind).toBe('Document')
  })

  it('REMOVE_MEMBER_FROM_GROUP contains removeMemberFromGroup operation', () => {
    const body = (REMOVE_MEMBER_FROM_GROUP as any).loc?.source?.body || ''
    expect(body).toContain('removeMemberFromGroup')
  })
})
