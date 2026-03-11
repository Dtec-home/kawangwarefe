/**
 * useUserRole Hook Tests
 *
 * Replaces the placeholder test with real behaviour assertions.
 * Uses MockedProvider + renderHook for isolation.
 *
 * FIRST: Fast (no network), Independent (MockedProvider per test)
 * ISTQB: Tests staff path, category-admin path, error/default path
 */

import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { gql } from '@apollo/client'
import React from 'react'
import { useUserRole } from '@/lib/hooks/use-user-role'

// Mirror the query document from the hook (must match exactly for MockedProvider)
const GET_CURRENT_USER_ROLE = gql`
  query GetCurrentUserRole {
    currentUserRole {
      isAuthenticated
      isStaff
      isCategoryAdmin
      adminCategoryIds
      adminCategories {
        id
        name
        code
        description
      }
    }
  }
`

const makeWrapper =
  (mocks: Parameters<typeof MockedProvider>[0]['mocks']) =>
    ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    )

const staffRoleMock = {
  request: { query: GET_CURRENT_USER_ROLE },
  result: {
    data: {
      currentUserRole: {
        isAuthenticated: true,
        isStaff: true,
        isCategoryAdmin: false,
        adminCategoryIds: [],
        adminCategories: [],
      },
    },
  },
}

const categoryAdminMock = {
  request: { query: GET_CURRENT_USER_ROLE },
  result: {
    data: {
      currentUserRole: {
        isAuthenticated: true,
        isStaff: false,
        isCategoryAdmin: true,
        adminCategoryIds: ['cat-1'],
        adminCategories: [{ id: 'cat-1', name: 'Tithe', code: 'TITHE', description: '' }],
      },
    },
  },
}

const unauthMock = {
  request: { query: GET_CURRENT_USER_ROLE },
  result: {
    data: {
      currentUserRole: {
        isAuthenticated: false,
        isStaff: false,
        isCategoryAdmin: false,
        adminCategoryIds: [],
        adminCategories: [],
      },
    },
  },
}

describe('useUserRole', () => {
  it('returns loading=true initially before data arrives', () => {
    const { result } = renderHook(() => useUserRole(), {
      wrapper: makeWrapper([staffRoleMock]),
    })
    expect(result.current.loading).toBe(true)
  })

  describe('staff user', () => {
    it('sets isStaff=true for a staff user', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isStaff).toBe(true)
    })

    it('sets canAccessAdmin=true for a staff user', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('canAccessFeature("members") returns true for staff', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('members')).toBe(true)
    })

    it('canAccessFeature("reports") returns true for staff', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('reports')).toBe(true)
    })
  })

  describe('category admin user', () => {
    it('sets isCategoryAdmin=true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isCategoryAdmin).toBe(true)
    })

    it('canAccessFeature("contributions") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('contributions')).toBe(true)
    })

    it('canAccessFeature("members") returns false for category admin', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('members')).toBe(false)
    })

    it('populates adminCategories list', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.adminCategories).toHaveLength(1)
      expect(result.current.adminCategories[0].name).toBe('Tithe')
    })
  })

  describe('unauthenticated / defaults', () => {
    it('returns isAuthenticated=false when user is not logged in', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('returns isStaff=false by default', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isStaff).toBe(false)
    })

    it('returns empty adminCategories by default', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.adminCategories).toHaveLength(0)
    })
  })
})
