import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { navState } = vi.hoisted(() => ({ navState: { canVoidReceipts: false, pending: 0 } }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin',
}))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true, canAccessFeature: () => true, canVoidReceipts: navState.canVoidReceipts,
  }),
}))
vi.mock('@/lib/hooks/use-pending-void-request-count', () => ({
  usePendingVoidRequestCount: ({ enabled }: { enabled: boolean }) => (enabled ? navState.pending : 0),
}))

import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav'

describe('AdminBottomNav', () => {
  it('renders primary nav links', () => {
    render(<AdminBottomNav />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Funds')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('renders More button', () => {
    render(<AdminBottomNav />)
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('lists Receipts under More', () => {
    navState.canVoidReceipts = false
    navState.pending = 0
    render(<AdminBottomNav />)
    fireEvent.click(screen.getByText('More'))
    expect(screen.getByText('Receipts')).toBeInTheDocument()
    expect(screen.queryByLabelText(/pending void requests/)).not.toBeInTheDocument()
  })

  it('badges Receipts with pending void requests for treasurers/admins', () => {
    navState.canVoidReceipts = true
    navState.pending = 3
    render(<AdminBottomNav />)
    fireEvent.click(screen.getByText('More'))
    expect(screen.getByLabelText('3 pending void requests')).toHaveTextContent('3')
  })
})
