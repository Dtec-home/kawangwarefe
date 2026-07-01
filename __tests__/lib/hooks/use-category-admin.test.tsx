import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// useQuery is shared by all three hooks; default it to the "has one role"
// shape and let individual tests override via mockReturnValue.
const useQuery = vi.fn()

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { memberId: 1 } }),
}))

import {
  useMyCategoryAdminRoles,
  useCategoryAdminIds,
  useCategoryAdminAccess,
} from '@/lib/hooks/use-category-admin'

beforeEach(() => {
  useQuery.mockReturnValue({
    data: {
      myCategoryAdminRoles: [
        { id: '1', category: { id: 'c1', name: 'Tithe', code: 'TITHE', description: '' }, assignedAt: '2024-01-01', isActive: true },
      ],
    },
    loading: false, error: null, refetch: vi.fn(),
  })
})

describe('useMyCategoryAdminRoles', () => {
  it('returns roles array', () => {
    const { result } = renderHook(() => useMyCategoryAdminRoles())
    expect(result.current.roles.length).toBe(1)
    expect(result.current.isAnyCategoryAdmin).toBe(true)
  })

  it('passes the member id as a string variable to the query', () => {
    renderHook(() => useMyCategoryAdminRoles())
    const [, opts] = useQuery.mock.calls.at(-1)!
    expect(opts.variables.memberId).toBe('1')
    expect(opts.skip).toBe(false)
  })

  it('reports no roles and not-any-admin when the list is empty', () => {
    useQuery.mockReturnValue({ data: { myCategoryAdminRoles: [] }, loading: false, error: null, refetch: vi.fn() })
    const { result } = renderHook(() => useMyCategoryAdminRoles())
    expect(result.current.roles).toEqual([])
    expect(result.current.isAnyCategoryAdmin).toBe(false)
  })

  it('falls back to defaults when data is undefined', () => {
    useQuery.mockReturnValue({ data: undefined, loading: true, error: null, refetch: vi.fn() })
    const { result } = renderHook(() => useMyCategoryAdminRoles())
    expect(result.current.roles).toEqual([])
    expect(result.current.isAnyCategoryAdmin).toBe(false)
    expect(result.current.loading).toBe(true)
  })
})

describe('useCategoryAdminIds', () => {
  it('returns category IDs', () => {
    const { result } = renderHook(() => useCategoryAdminIds())
    expect(result.current.categoryIds).toContain('c1')
    expect(result.current.categories.length).toBe(1)
  })
})

describe('useCategoryAdminAccess', () => {
  it('returns isAdmin=true when the access query resolves true', () => {
    useQuery.mockReturnValue({ data: { isCategoryAdmin: true }, loading: false, error: null })
    const { result } = renderHook(() => useCategoryAdminAccess('c1'))
    expect(result.current.isAdmin).toBe(true)
  })

  it('defaults isAdmin to false when data is missing', () => {
    useQuery.mockReturnValue({ data: undefined, loading: false, error: null })
    const { result } = renderHook(() => useCategoryAdminAccess('c1'))
    expect(result.current.isAdmin).toBe(false)
  })

  it('skips the query when no categoryId is supplied', () => {
    useQuery.mockReturnValue({ data: undefined, loading: false, error: null })
    renderHook(() => useCategoryAdminAccess(undefined))
    const [, opts] = useQuery.mock.calls.at(-1)!
    expect(opts.skip).toBe(true)
  })
})
