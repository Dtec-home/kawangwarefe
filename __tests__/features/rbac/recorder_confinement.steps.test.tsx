/**
 * Binding for `rbac/recorder_confinement.feature` (T2.4).
 *
 * Drives the real `useUserRole()` hook (via MockedProvider), the real
 * `AdminProtectedRoute`, `AdminBottomNav` and the post-login redirect helper.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  usePathname: () => '/record',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}))

import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route'
import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav'
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect'

const feature = loadFeature('./recorder_confinement.feature', { loadRelativePath: true })

function role(overrides: Record<string, unknown>) {
  return {
    isAuthenticated: true,
    isStaff: false,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: false,
    isRecorder: false,
    canVoidReceipts: false,
    adminCategoryIds: [],
    adminGroupNames: [],
    adminCategories: [],
    ...overrides,
  }
}

const PURE_RECORDER = role({ isRecorder: true })
const STAFF = role({ isStaff: true, canSendBulkMessage: true, canVoidReceipts: true })

function renderWithRole(currentUserRole: Record<string, unknown>, ui: React.ReactElement) {
  const mocks = [{ request: { query: GET_CURRENT_USER_ROLE }, result: { data: { currentUserRole } } }]
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {ui}
    </MockedProvider>
  )
}

function navLabels() {
  return screen.getAllByRole('button').map((b) => b.textContent?.trim())
}

defineFeature(feature, (test) => {
  beforeEach(() => {
    mockPush.mockClear()
    cleanup()
  })
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  test('A pure recorder lands on the recording workspace after login', ({ given, when, then }) => {
    let landing = ''
    given(/^a signed-in member whose only extra role is "(.*)"$/, () => {
      localStorage.setItem('access_token', 'jwt')
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: async () => ({ data: { currentUserRole: { isStaff: false, isRecorder: true } } }),
      }))
    })
    when('they finish logging in without a redirect target', async () => {
      landing = await resolvePostLoginRedirect(null)
    })
    then(/^they land on "(.*)"$/, (path: string) => {
      expect(landing).toBe(path)
    })
  })

  test('A pure recorder is sent back to /record from admin pages', ({ given, when, then, and }) => {
    given(/^a signed-in member whose only extra role is "(.*)"$/, () => {})
    when('they open an admin page that requires staff access', () => {
      renderWithRole(PURE_RECORDER, (
        <AdminProtectedRoute requiredAccess="staff"><div>Financial reports</div></AdminProtectedRoute>
      ))
    })
    then('the admin page is not shown', async () => {
      await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
      expect(screen.queryByText('Financial reports')).not.toBeInTheDocument()
    })
    and(/^they are redirected to "(.*)"$/, async (path: string) => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith(path))
      expect(mockPush).not.toHaveBeenCalledWith('/dashboard')
    })
  })

  test('A pure recorder can use the recording workspace', ({ given, when, then, and }) => {
    given(/^a signed-in member whose only extra role is "(.*)"$/, () => {})
    when('they open the recording workspace', () => {
      renderWithRole(PURE_RECORDER, (
        <AdminProtectedRoute requiredAccess="recorder">
          <div>Recording workspace</div>
          <AdminBottomNav />
        </AdminProtectedRoute>
      ))
    })
    then('the recording workspace is shown', async () => {
      expect(await screen.findByText('Recording workspace')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
    and(/^the admin navigation offers only "(.*)"$/, (label: string) => {
      expect(navLabels()).toEqual([label])
    })
  })

  test('Staff are not confined', ({ given, when, then, and }) => {
    given('a signed-in staff member', () => {})
    when('they open an admin page that requires staff access', () => {
      renderWithRole(STAFF, (
        <AdminProtectedRoute requiredAccess="staff">
          <div>Financial reports</div>
          <AdminBottomNav />
        </AdminProtectedRoute>
      ))
    })
    then('the admin page is shown', async () => {
      expect(await screen.findByText('Financial reports')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
    and(/^the admin navigation offers "(.*)" among other items$/, async (label: string) => {
      fireEvent.click(screen.getByText('More'))
      expect(await screen.findByText(label)).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })
  })
})
