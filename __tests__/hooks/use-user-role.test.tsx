/**
 * useUserRole Hook Tests
 *
 * Covers the four primary role personas:
 *   1. Staff (admin / treasurer / pastor)  — can access EVERYTHING
 *   2. Content Admin                        — can only access "content"
 *   3. Category Admin                       — can only access contributions & overview
 *   4. Unauthenticated / default state
 *
 * FIRST: Fast (no network), Independent (MockedProvider per test)
 */

import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { gql } from '@apollo/client'
import React from 'react'
import { useUserRole } from '@/lib/hooks/use-user-role'

// Must mirror the query document used by the hook EXACTLY (including isContentAdmin)
const GET_CURRENT_USER_ROLE = gql`
  query GetCurrentUserRole {
    currentUserRole {
      isAuthenticated
      isStaff
      isCategoryAdmin
      isGroupAdmin
      isContentAdmin
      adminCategoryIds
      adminGroupNames
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

// ─── Mock payloads ────────────────────────────────────────────────────────────

const staffRoleMock = {
  request: { query: GET_CURRENT_USER_ROLE },
  result: {
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
  },
}

const contentAdminMock = {
  request: { query: GET_CURRENT_USER_ROLE },
  result: {
    data: {
      currentUserRole: {
        isAuthenticated: true,
        isStaff: false,
        isCategoryAdmin: false,
        isGroupAdmin: false,
        isContentAdmin: true,
        adminCategoryIds: [],
        adminGroupNames: [],
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
        isGroupAdmin: false,
        isContentAdmin: false,
        adminCategoryIds: ['cat-1'],
        adminGroupNames: [],
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
        isGroupAdmin: false,
        isContentAdmin: false,
        adminCategoryIds: [],
        adminGroupNames: [],
        adminCategories: [],
      },
    },
  },
}

const groupAdminMock = {
  request: { query: GET_CURRENT_USER_ROLE },
  result: {
    data: {
      currentUserRole: {
        isAuthenticated: true,
        isStaff: false,
        isCategoryAdmin: false,
        isGroupAdmin: true,
        isContentAdmin: false,
        adminCategoryIds: [],
        adminGroupNames: ['Youth'],
        adminCategories: [],
      },
    },
  },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useUserRole', () => {
  it('returns loading=true initially before data arrives', () => {
    const { result } = renderHook(() => useUserRole(), {
      wrapper: makeWrapper([staffRoleMock]),
    })
    expect(result.current.loading).toBe(true)
  })

  // ── Staff (Admin / Pastor / Treasurer) ─────────────────────────────────────
  describe('staff user — admin, pastor, or treasurer', () => {
    it('sets isStaff=true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isStaff).toBe(true)
    })

    it('sets canAccessAdmin=true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('sets isContentAdmin=false (staff is separate from content_admin role)', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isContentAdmin).toBe(false)
    })

    it('canAccessContent=true — staff can change ALL content', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessContent).toBe(true)
    })

    it('canAccessFeature("members") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('members')).toBe(true)
    })

    it('canAccessFeature("reports") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('reports')).toBe(true)
    })

    it('canAccessFeature("content") returns true — staff sees everything', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('content')).toBe(true)
    })

    it('canAccessFeature("contributions") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('contributions')).toBe(true)
    })

    it('canAccessFeature("c2b-transactions") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([staffRoleMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('c2b-transactions')).toBe(true)
    })
  })

  // ── Content Admin ──────────────────────────────────────────────────────────
  describe('content admin user', () => {
    it('sets isContentAdmin=true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isContentAdmin).toBe(true)
    })

    it('sets isStaff=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isStaff).toBe(false)
    })

    it('canAccessAdmin=true — content admin CAN enter the panel', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('canAccessContent=true — content admin can change content', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessContent).toBe(true)
    })

    it('canAccessFeature("content") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('content')).toBe(true)
    })

    it('canAccessFeature("members") returns false — content admin cannot manage members', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('members')).toBe(false)
    })

    it('canAccessFeature("contributions") returns false — content admin cannot see contributions', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('contributions')).toBe(false)
    })

    it('canAccessFeature("reports") returns false — content admin cannot generate reports', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('reports')).toBe(false)
    })

    it('canAccessFeature("c2b-transactions") returns false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([contentAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('c2b-transactions')).toBe(false)
    })
  })

  // ── Category Admin ─────────────────────────────────────────────────────────
  describe('category admin user', () => {
    it('sets isCategoryAdmin=true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isCategoryAdmin).toBe(true)
    })

    it('sets isContentAdmin=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isContentAdmin).toBe(false)
    })

    it('canAccessFeature("contributions") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('contributions')).toBe(true)
    })

    it('canAccessFeature("overview") returns true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('overview')).toBe(true)
    })

    it('canAccessFeature("members") returns false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('members')).toBe(false)
    })

    it('canAccessFeature("content") returns false — category admin cannot manage content', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([categoryAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('content')).toBe(false)
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

  // ── Group Admin ────────────────────────────────────────────────────────────
  describe('group admin user', () => {
    it('sets isGroupAdmin=true', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([groupAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isGroupAdmin).toBe(true)
    })

    it('can access contributions and overview only', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([groupAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessFeature('overview')).toBe(true)
      expect(result.current.canAccessFeature('contributions')).toBe(true)
      expect(result.current.canAccessFeature('members')).toBe(false)
      expect(result.current.canAccessFeature('reports')).toBe(false)
      expect(result.current.canAccessFeature('categories')).toBe(false)
      expect(result.current.canAccessFeature('groups')).toBe(false)
      expect(result.current.canAccessFeature('content')).toBe(false)
    })

    it('returns adminGroupNames for scoped UI selection', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([groupAdminMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.adminGroupNames).toEqual(['Youth'])
    })
  })

  // ── Unauthenticated / defaults ─────────────────────────────────────────────
  describe('unauthenticated / defaults', () => {
    it('returns isAuthenticated=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('returns isStaff=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isStaff).toBe(false)
    })

    it('returns isContentAdmin=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isContentAdmin).toBe(false)
    })

    it('returns canAccessContent=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessContent).toBe(false)
    })

    it('returns canAccessAdmin=false', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.canAccessAdmin).toBe(false)
    })

    it('returns empty adminCategories', async () => {
      const { result } = renderHook(() => useUserRole(), {
        wrapper: makeWrapper([unauthMock]),
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.adminCategories).toHaveLength(0)
    })
  })
})
