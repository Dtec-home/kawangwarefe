import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin',
}))

// Sprint 8 — layout now fetches me.avatarUrl for the sidebar avatar.
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: { me: null }, loading: false, error: null }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Test User', phoneNumber: '254712345678' }, logout: vi.fn() }),
}))

const { navState } = vi.hoisted(() => ({ navState: { canVoidReceipts: false, pending: 0 } }))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true, isCategoryAdmin: false, isGroupAdmin: false, isContentAdmin: false,
    canVoidReceipts: navState.canVoidReceipts,
    canAccessFeature: () => true, adminCategories: [], loading: false,
  }),
}))

// T2.6 — pending void-request badge
const pendingCountSpy = vi.fn()
vi.mock('@/lib/hooks/use-pending-void-request-count', () => ({
  usePendingVoidRequestCount: (opts: { enabled: boolean }) => {
    pendingCountSpy(opts)
    return opts.enabled ? navState.pending : 0
  },
}))

vi.mock('@/components/layouts/admin-bottom-nav', () => ({
  AdminBottomNav: () => <div data-testid="admin-bottom-nav" />,
}))

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

import { AdminLayout } from '@/components/layouts/admin-layout'

describe('AdminLayout', () => {
  it('renders children', () => {
    render(<AdminLayout><div>Page content</div></AdminLayout>)
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders Church Admin title', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getAllByText('Church Admin').length).toBeGreaterThan(0)
  })

  it('shows staff admin badge', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Staff Admin')).toBeInTheDocument()
  })

  it('shows nav items', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Contributions')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Receipts')).toBeInTheDocument()
  })

  it('shows user info', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('shows Member View button', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getAllByText('Member View').length).toBeGreaterThan(0)
  })

  it('shows Logout button', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('renders admin bottom nav', () => {
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(screen.getByTestId('admin-bottom-nav')).toBeInTheDocument()
  })

  it('does not ask for void requests or show a badge without canVoidReceipts', () => {
    navState.canVoidReceipts = false
    navState.pending = 4
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(pendingCountSpy).toHaveBeenLastCalledWith({ enabled: false })
    expect(screen.queryByLabelText(/pending void requests/)).not.toBeInTheDocument()
  })

  it('shows the pending void-request count on Receipts for treasurers/admins', () => {
    navState.canVoidReceipts = true
    navState.pending = 4
    render(<AdminLayout><div>C</div></AdminLayout>)
    expect(pendingCountSpy).toHaveBeenLastCalledWith({ enabled: true })
    expect(screen.getByLabelText('4 pending void requests')).toHaveTextContent('4')
  })
})
