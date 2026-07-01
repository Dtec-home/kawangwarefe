import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: {
      currentUserRole: {
        isAuthenticated: true,
        isStaff: true,
        isCategoryAdmin: false,
        isGroupAdmin: false,
        isContentAdmin: false,
        adminCategoryIds: [],
        adminGroupNames: [],
        adminCategories: [],
      },
    },
    loading: false, error: null, refetch: vi.fn(),
  }),
}))

import { useUserRole } from '@/lib/hooks/use-user-role'

describe('useUserRole', () => {
  it('returns staff flags correctly', () => {
    const { result } = renderHook(() => useUserRole())
    expect(result.current.isStaff).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.canAccessAdmin).toBe(true)
    expect(result.current.isFullAdmin).toBe(true)
  })

  it('staff can access all features', () => {
    const { result } = renderHook(() => useUserRole())
    expect(result.current.canAccessFeature('members')).toBe(true)
    expect(result.current.canAccessFeature('reports')).toBe(true)
    expect(result.current.canAccessFeature('contributions')).toBe(true)
    expect(result.current.canAccessFeature('content')).toBe(true)
  })

  it('returns empty arrays for admin categories/groups', () => {
    const { result } = renderHook(() => useUserRole())
    expect(result.current.adminCategoryIds).toEqual([])
    expect(result.current.adminGroupNames).toEqual([])
    expect(result.current.adminCategories).toEqual([])
  })
})
