import { describe, it, expect } from 'vitest'
import {
  GET_CATEGORY_ADMINS,
  GET_MY_CATEGORY_ADMIN_ROLES,
  ASSIGN_CATEGORY_ADMIN,
  REMOVE_CATEGORY_ADMIN,
  CHECK_CATEGORY_ADMIN_ACCESS,
} from '@/lib/graphql/category-admin-queries'

describe('category-admin-queries', () => {
  it('exports GET_CATEGORY_ADMINS as DocumentNode', () => {
    expect(GET_CATEGORY_ADMINS).toBeDefined()
    expect(GET_CATEGORY_ADMINS.kind).toBe('Document')
  })

  it('GET_CATEGORY_ADMINS contains categoryAdmins query', () => {
    const body = (GET_CATEGORY_ADMINS as any).loc?.source?.body || ''
    expect(body).toContain('categoryAdmins')
  })

  it('exports GET_MY_CATEGORY_ADMIN_ROLES as DocumentNode', () => {
    expect(GET_MY_CATEGORY_ADMIN_ROLES).toBeDefined()
    expect(GET_MY_CATEGORY_ADMIN_ROLES.kind).toBe('Document')
  })

  it('GET_MY_CATEGORY_ADMIN_ROLES contains myCategoryAdminRoles query', () => {
    const body = (GET_MY_CATEGORY_ADMIN_ROLES as any).loc?.source?.body || ''
    expect(body).toContain('myCategoryAdminRoles')
  })

  it('exports ASSIGN_CATEGORY_ADMIN as DocumentNode', () => {
    expect(ASSIGN_CATEGORY_ADMIN).toBeDefined()
    expect(ASSIGN_CATEGORY_ADMIN.kind).toBe('Document')
  })

  it('ASSIGN_CATEGORY_ADMIN contains assignCategoryAdmin operation', () => {
    const body = (ASSIGN_CATEGORY_ADMIN as any).loc?.source?.body || ''
    expect(body).toContain('assignCategoryAdmin')
  })

  it('exports REMOVE_CATEGORY_ADMIN as DocumentNode', () => {
    expect(REMOVE_CATEGORY_ADMIN).toBeDefined()
    expect(REMOVE_CATEGORY_ADMIN.kind).toBe('Document')
  })

  it('REMOVE_CATEGORY_ADMIN contains removeCategoryAdmin operation', () => {
    const body = (REMOVE_CATEGORY_ADMIN as any).loc?.source?.body || ''
    expect(body).toContain('removeCategoryAdmin')
  })

  it('exports CHECK_CATEGORY_ADMIN_ACCESS as DocumentNode', () => {
    expect(CHECK_CATEGORY_ADMIN_ACCESS).toBeDefined()
    expect(CHECK_CATEGORY_ADMIN_ACCESS.kind).toBe('Document')
  })

  it('CHECK_CATEGORY_ADMIN_ACCESS contains isCategoryAdmin query', () => {
    const body = (CHECK_CATEGORY_ADMIN_ACCESS as any).loc?.source?.body || ''
    expect(body).toContain('isCategoryAdmin')
  })
})
