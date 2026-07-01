import { describe, it, expect } from 'vitest'
import {
  CREATE_DEPARTMENT_PURPOSE,
  UPDATE_DEPARTMENT_PURPOSE,
  DELETE_DEPARTMENT_PURPOSE,
} from '@/lib/graphql/purpose-mutations'

describe('purpose-mutations', () => {
  it('exports CREATE_DEPARTMENT_PURPOSE as DocumentNode', () => {
    expect(CREATE_DEPARTMENT_PURPOSE).toBeDefined()
    expect(CREATE_DEPARTMENT_PURPOSE.kind).toBe('Document')
  })

  it('CREATE_DEPARTMENT_PURPOSE contains createDepartmentPurpose operation', () => {
    const body = (CREATE_DEPARTMENT_PURPOSE as any).loc?.source?.body || ''
    expect(body).toContain('createDepartmentPurpose')
  })

  it('exports UPDATE_DEPARTMENT_PURPOSE as DocumentNode', () => {
    expect(UPDATE_DEPARTMENT_PURPOSE).toBeDefined()
    expect(UPDATE_DEPARTMENT_PURPOSE.kind).toBe('Document')
  })

  it('UPDATE_DEPARTMENT_PURPOSE contains updateDepartmentPurpose operation', () => {
    const body = (UPDATE_DEPARTMENT_PURPOSE as any).loc?.source?.body || ''
    expect(body).toContain('updateDepartmentPurpose')
  })

  it('exports DELETE_DEPARTMENT_PURPOSE as DocumentNode', () => {
    expect(DELETE_DEPARTMENT_PURPOSE).toBeDefined()
    expect(DELETE_DEPARTMENT_PURPOSE.kind).toBe('Document')
  })

  it('DELETE_DEPARTMENT_PURPOSE contains deleteDepartmentPurpose operation', () => {
    const body = (DELETE_DEPARTMENT_PURPOSE as any).loc?.source?.body || ''
    expect(body).toContain('deleteDepartmentPurpose')
  })
})
