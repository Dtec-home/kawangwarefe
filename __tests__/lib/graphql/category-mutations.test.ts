import { describe, it, expect } from 'vitest'
import {
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  GET_ALL_CATEGORIES,
} from '@/lib/graphql/category-mutations'

describe('category-mutations', () => {
  it('exports CREATE_CATEGORY as DocumentNode', () => {
    expect(CREATE_CATEGORY).toBeDefined()
    expect(CREATE_CATEGORY.kind).toBe('Document')
  })

  it('CREATE_CATEGORY contains createCategory operation', () => {
    const body = (CREATE_CATEGORY as any).loc?.source?.body || ''
    expect(body).toContain('createCategory')
  })

  it('exports UPDATE_CATEGORY as DocumentNode', () => {
    expect(UPDATE_CATEGORY).toBeDefined()
    expect(UPDATE_CATEGORY.kind).toBe('Document')
  })

  it('UPDATE_CATEGORY contains updateCategory operation', () => {
    const body = (UPDATE_CATEGORY as any).loc?.source?.body || ''
    expect(body).toContain('updateCategory')
  })

  it('exports DELETE_CATEGORY as DocumentNode', () => {
    expect(DELETE_CATEGORY).toBeDefined()
    expect(DELETE_CATEGORY.kind).toBe('Document')
  })

  it('DELETE_CATEGORY contains deleteCategory operation', () => {
    const body = (DELETE_CATEGORY as any).loc?.source?.body || ''
    expect(body).toContain('deleteCategory')
  })

  it('exports GET_ALL_CATEGORIES as DocumentNode', () => {
    expect(GET_ALL_CATEGORIES).toBeDefined()
    expect(GET_ALL_CATEGORIES.kind).toBe('Document')
  })

  it('GET_ALL_CATEGORIES contains contributionCategories query', () => {
    const body = (GET_ALL_CATEGORIES as any).loc?.source?.body || ''
    expect(body).toContain('contributionCategories')
  })

  it('GET_ALL_CATEGORIES accepts and passes includeInactive so admins see inactive departments', () => {
    const body = (GET_ALL_CATEGORIES as any).loc?.source?.body || ''
    expect(body).toContain('$includeInactive: Boolean')
    expect(body).toContain('includeInactive: $includeInactive')
  })
})
