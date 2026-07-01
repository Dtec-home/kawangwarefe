/**
 * Profile page tests (Sprint 1 / Epic E1.1).
 *
 * Verifies:
 * - the page renders the current member's info + department/groups,
 * - the pure helper `eligibleGroupsFor` restricts by allowedGroups when set,
 * - the Save button invokes `updateMemberProfile`.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const updateMutationFn = vi.fn().mockResolvedValue({
  data: { updateMemberProfile: { success: true, message: 'Profile updated', member: null } },
})

// Apollo hooks — minimal mock returning the shapes the page expects.
vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: any) => {
    const name = doc?.definitions?.[0]?.name?.value ?? ''
    if (name === 'GetMe') {
      return {
        loading: false,
        error: null,
        refetch: vi.fn(),
        data: {
          me: {
            id: '1',
            firstName: 'Jane',
            lastName: 'Wanjiku',
            phoneNumber: '254700000001',
            memberNumber: '000001',
            email: null,
            fullName: 'Jane Wanjiku',
            avatarUrl: null,
            department: { id: '10', name: 'Music', code: 'MUSIC', allowedGroups: [{ id: '100', name: 'Choir' }] },
            groups: [{ id: '100', name: 'Choir' }],
          },
        },
      }
    }
    if (name === 'GetContributionCategories') {
      return {
        loading: false,
        error: null,
        data: {
          contributionCategories: [
            { id: '10', name: 'Music', code: 'MUSIC', allowedGroups: [{ id: '100', name: 'Choir' }] },
            { id: '20', name: 'Youth', code: 'YOUTH', allowedGroups: [] },
          ],
        },
      }
    }
    if (name === 'GetGroupsList') {
      return { loading: false, error: null, data: { groupsList: [{ id: '100', name: 'Choir' }, { id: '200', name: 'Ushers' }] } }
    }
    return { loading: false, error: null, data: null }
  },
  useMutation: () => [updateMutationFn, { loading: false }],
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}))

vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: any) => React.createElement('div', null, children),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { fullName: 'Jane Wanjiku', memberId: 1, phoneNumber: '254700000001' },
    accessToken: 'test-jwt',
    isLoading: false,
  }),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    canAccessAdmin: false,
    canAccessContent: false,
    isStaff: false,
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import ProfilePage, { eligibleGroupsFor } from '@/app/(dashboard)/profile/page'

describe('eligibleGroupsFor (pure helper)', () => {
  it('returns department.allowedGroups when non-empty', () => {
    const dept = { id: '1', name: 'x', code: 'X', allowedGroups: [{ id: 'a', name: 'A' }] }
    const all = [{ id: 'b', name: 'B' }]
    expect(eligibleGroupsFor(dept as any, all)).toEqual([{ id: 'a', name: 'A' }])
  })

  it('falls back to all groups when department has no allowedGroups', () => {
    const dept = { id: '1', name: 'x', code: 'X', allowedGroups: [] }
    const all = [{ id: 'b', name: 'B' }]
    expect(eligibleGroupsFor(dept as any, all)).toEqual([{ id: 'b', name: 'B' }])
  })

  it('returns all groups when no department selected', () => {
    const all = [{ id: 'b', name: 'B' }]
    expect(eligibleGroupsFor(null, all)).toEqual([{ id: 'b', name: 'B' }])
  })
})

describe('ProfilePage', () => {
  it("renders the authenticated member's profile", () => {
    render(<ProfilePage />)
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getAllByText('Jane Wanjiku').length).toBeGreaterThan(0)
    expect(screen.getAllByText('254700000001').length).toBeGreaterThan(0)
  })

  it('invokes updateMemberProfile when Save is clicked', async () => {
    render(<ProfilePage />)
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)
    expect(updateMutationFn).toHaveBeenCalled()
    const call = updateMutationFn.mock.calls[updateMutationFn.mock.calls.length - 1][0]
    expect(call).toMatchObject({
      variables: expect.objectContaining({
        departmentId: expect.any(String),
      }),
    })
  })

  it('shows an Upload photo control when no avatar is set', () => {
    render(<ProfilePage />)
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument()
  })
})
