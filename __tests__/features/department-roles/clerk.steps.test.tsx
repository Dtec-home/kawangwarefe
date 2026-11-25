/**
 * Binding for `department-roles/clerk.feature` (R4).
 *
 * Drives the real `useUserRole()` hook (via MockedProvider), the real
 * `AdminProtectedRoute`, `AdminBottomNav`, the tracker route, `ReportActions`
 * and the post-login redirect helper.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  usePathname: () => '/admin/department-reports',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '3' }),
}))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/department-reports/staff/period-tracker', () => ({
  PeriodTracker: ({ periodId }: { periodId: string }) => <div>Tracker for period {periodId}</div>,
}))

import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route'
import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav'
import { ReportActions } from '@/components/department-reports/staff/report-actions'
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { GET_REPORT_SECTION_SPECS } from '@/lib/graphql/department-reports'
import { DEFAULT_SECTION_SPECS } from '@/lib/department-reports/sections'
import TrackerPage from '@/app/(dashboard)/admin/department-reports/period/[id]/page'

import { makeReport } from '../../components/department-reports/staff/fixtures'

const feature = loadFeature('./clerk.feature', { loadRelativePath: true })

const CLERK = {
  isAuthenticated: true,
  isStaff: false,
  isCategoryAdmin: false,
  isGroupAdmin: false,
  isContentAdmin: false,
  canSendBulkMessage: false,
  isRecorder: false,
  canVoidReceipts: false,
  isAdmin: false,
  isTreasurer: false,
  isClerk: true,
  adminCategoryIds: [],
  ledDepartmentIds: [],
  adminGroupNames: [],
  adminCategories: [],
}

const specsMock: MockedResponse = {
  request: { query: GET_REPORT_SECTION_SPECS },
  result: {
    data: { reportSectionSpecs: DEFAULT_SECTION_SPECS.map((s) => ({ __typename: 'ReportSectionSpec', ...s })) },
  },
  maxUsageCount: 10,
}

function renderAsClerk(ui: React.ReactElement) {
  const mocks: MockedResponse[] = [
    { request: { query: GET_CURRENT_USER_ROLE }, result: { data: { currentUserRole: CLERK } }, maxUsageCount: 10 },
    specsMock,
  ]
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {ui}
    </MockedProvider>,
  )
}

const givenClerk = (given: (re: RegExp, fn: () => void) => void) =>
  given(/^a signed-in member whose only extra role is "(.*)"$/, () => {})

defineFeature(feature, (test) => {
  beforeEach(() => {
    mockPush.mockClear()
    cleanup()
  })
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  test('A clerk lands on Department Reports after login', ({ given, when, then }) => {
    let landing = ''
    given(/^a signed-in member whose only extra role is "(.*)"$/, () => {
      localStorage.setItem('access_token', 'jwt')
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: async () => ({
          data: { currentUserRole: { isStaff: false, isRecorder: false, isClerk: true, isCategoryAdmin: false, ledDepartmentIds: [] } },
        }),
      }))
    })
    when('they finish logging in without a redirect target', async () => {
      landing = await resolvePostLoginRedirect(null)
    })
    then(/^they land on "(.*)"$/, (path: string) => {
      expect(landing).toBe(path)
    })
  })

  test("A clerk's navigation offers only Department Reports", ({ given, when, then, and }) => {
    givenClerk(given)
    when('they open Department Reports', () => {
      renderAsClerk(
        <AdminProtectedRoute requiredAccess="department-reports">
          <div>My reports</div>
          <AdminBottomNav />
        </AdminProtectedRoute>,
      )
    })
    then('the page is shown', async () => {
      expect(await screen.findByText('My reports')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
    and(/^the admin navigation offers only "(.*)"$/, (label: string) => {
      expect(screen.getAllByRole('button').map((b) => b.textContent?.trim())).toEqual([label])
    })
  })

  test('A clerk can open the tracker', ({ given, when, then }) => {
    givenClerk(given)
    when('they open the tracker for a period', () => {
      renderAsClerk(<TrackerPage />)
    })
    then('the tracker is shown', async () => {
      expect(await screen.findByText('Tracker for period 3')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  test('A clerk is kept away from money pages', ({ given, when, then, and }) => {
    givenClerk(given)
    when('they open an admin page that requires staff access', () => {
      renderAsClerk(
        <AdminProtectedRoute requiredAccess="staff">
          <div>Financial reports</div>
        </AdminProtectedRoute>,
      )
    })
    then('the admin page is not shown', async () => {
      await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
      expect(screen.queryByText('Financial reports')).not.toBeInTheDocument()
    })
    and(/^they are redirected to "(.*)"$/, async (path: string) => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith(path))
    })
  })

  test('A clerk reads a report but cannot review it', ({ given, when, then, but, and }) => {
    givenClerk(given)
    when('they open a submitted report', () => {
      // The server answers the clerk's report with every review flag off and
      // no live books (ReportPermissions, R4).
      renderAsClerk(<ReportActions report={makeReport({ status: 'submitted' })} onChanged={vi.fn()} />)
    })
    then('they can download it as PDF and Word', () => {
      expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download Word' })).toBeInTheDocument()
    })
    but(/^they see no "(.*)", "(.*)" or "(.*)"$/, (a: string, b: string, c: string) => {
      for (const name of [a, b, c]) {
        expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
      }
    })
    and('they see no books-today comparison', () => {
      expect(screen.queryByTestId('dept-report-live-financial')).not.toBeInTheDocument()
    })
  })
})
