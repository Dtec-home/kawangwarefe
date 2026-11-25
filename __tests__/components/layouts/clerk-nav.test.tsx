/**
 * Clerk navigation (R4): a clerk who is nothing else sees Department Reports
 * only — in the sidebar and in the bottom bar — and the badge says "Clerk".
 * Uses the real useUserRole (useQuery mocked) so the feature filter is real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/department-reports',
}))

const { roleState } = vi.hoisted(() => ({ roleState: { role: {} as Record<string, unknown> } }))

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: { me: null, currentUserRole: roleState.role },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Clara Clerk', phoneNumber: '254712345678' }, logout: vi.fn() }),
}))
vi.mock('@/lib/hooks/use-pending-void-request-count', () => ({
  usePendingVoidRequestCount: () => 0,
}))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

import { AdminLayout } from '@/components/layouts/admin-layout'
import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav'

const baseRole = {
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
  isClerk: false,
  adminCategoryIds: [],
  ledDepartmentIds: [],
  adminGroupNames: [],
  adminCategories: [],
}

describe('clerk navigation (R4)', () => {
  beforeEach(() => {
    roleState.role = { ...baseRole, isClerk: true }
  })

  it('sidebar shows Department Reports and nothing about money', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByRole('link', { name: 'Department Reports' })).toHaveAttribute('href', '/admin/department-reports')
    for (const name of ['Overview', 'Contributions', 'Members', 'Reports', 'Receipts', 'Expenses', 'Fund transfers', 'C2B / M-Pesa', 'Record giving', 'Campaigns', 'Departments', 'Dept. Admins', 'Leaders', 'Messaging']) {
      expect(screen.queryByText(name, { exact: true })).not.toBeInTheDocument()
    }
  })

  it('role badge says "Clerk"', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Clerk')).toBeInTheDocument()
  })

  it('staff who also hold clerk keep the Staff Admin badge', () => {
    roleState.role = { ...baseRole, isStaff: true, isClerk: true }
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Staff Admin')).toBeInTheDocument()
    expect(screen.queryByText('Clerk')).not.toBeInTheDocument()
  })

  it('bottom bar shows only Department Reports for a pure clerk', () => {
    const { container } = render(<AdminBottomNav />)
    const bar = container.querySelector('nav')!
    const buttons = within(bar).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['Department Reports'])
    expect(within(bar).queryByText('More')).not.toBeInTheDocument()
  })

  it('a clerk who also leads a department keeps the usual bar', () => {
    roleState.role = { ...baseRole, isClerk: true, isCategoryAdmin: true, ledDepartmentIds: ['7'], adminCategoryIds: ['7'] }
    const { container } = render(<AdminBottomNav />)
    const bar = container.querySelector('nav')!
    expect(within(bar).getByText('Overview')).toBeInTheDocument()
    expect(within(bar).getByText('More')).toBeInTheDocument()
  })
})
