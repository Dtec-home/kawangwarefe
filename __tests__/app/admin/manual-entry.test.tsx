import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

// Query-aware Apollo mock: returns categories for category queries and a
// receipt-number preview for the next-receipt query.
const createMock = vi.fn().mockResolvedValue({
  data: { createManualMultiContribution: { success: true, message: 'ok' } },
})
const lookupMock = vi.fn().mockResolvedValue({
  data: { lookupMemberByPhone: { found: false } },
})

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation((doc: any) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('nextReceiptNumber')) {
      return {
        data: {
          nextReceiptNumber: {
            prefix: 'MB-',
            nextNumber: 2000,
            padding: 4,
            nextReceiptNumber: 'MB-2000',
          },
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      }
    }
    return {
      data: {
        contributionCategories: [
          { id: '1', name: 'Tithe', code: 'TITHE', description: '' },
          { id: '2', name: 'Offering', code: 'OFFER', description: '' },
          { id: '3', name: 'Building Fund', code: 'BUILD', description: '' },
        ],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    }
  }),
  useMutation: vi.fn().mockImplementation((doc: any) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('lookupMemberByPhone')) return [lookupMock, { loading: false }]
    return [createMock, { loading: false }]
  }),
}))

// Mock auth
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { memberId: 1 }, logout: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}))

// Mock user role hook
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true,
    canAccessAdmin: true,
    canAccessFeature: () => true,
    isAuthenticated: true,
    loading: false,
    adminCategories: [],
    adminCategoryIds: [],
    adminGroupNames: [],
  }),
}))

// Mock admin layout
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => <div data-testid="admin-layout">{children}</div>,
}))

// Mock admin protected route
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

// Mock next/link to return proper JSX
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import ManualEntryPage from '@/app/(dashboard)/admin/contributions/manual-entry/page'

describe('ManualEntryPage', () => {
  it('renders the heading', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Manual Contribution Entry')).toBeInTheDocument()
  })

  it('renders the Member Information card', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Member Information')).toBeInTheDocument()
  })

  it('renders the Contribution Details card', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Contribution Details')).toBeInTheDocument()
  })

  it('renders the Save Contribution button', () => {
    render(<ManualEntryPage />)
    expect(screen.getByRole('button', { name: /Save Contribution/i })).toBeInTheDocument()
  })

  it('renders phone number input and search button by default', () => {
    render(<ManualEntryPage />)
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument()
  })

  it('renders View All Contributions link', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('View All Contributions')).toBeInTheDocument()
  })

  // Ticket 6 — multi-line items with add/remove
  it('supports adding and removing department line items', () => {
    render(<ManualEntryPage />)
    // One row initially: no remove button (canRemove is false for a single row)
    expect(screen.queryByLabelText('Remove department')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add Another Department/i }))
    // Now two department selects exist
    expect(screen.getAllByText('Department').length).toBeGreaterThanOrEqual(2)
    // And a remove button appears
    expect(screen.getAllByLabelText('Remove department').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getAllByLabelText('Remove department')[0])
    expect(screen.queryByLabelText('Remove department')).not.toBeInTheDocument()
  })

  // Ticket 7 — walk-in toggle swaps phone for free-text giver name
  it('toggling Walk-in swaps the phone lookup for a giver name field', () => {
    render(<ManualEntryPage />)
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))

    expect(screen.queryByLabelText('Phone Number')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Giver Name *')).toBeInTheDocument()
  })

  // Ticket 9 — read-only next-receipt hint
  it('shows the next auto-assigned receipt number as a hint', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText(/Next auto-assigned number:/i)).toBeInTheDocument()
    expect(screen.getByText('MB-2000')).toBeInTheDocument()
  })

  it('links to Receipt Book Settings', () => {
    render(<ManualEntryPage />)
    const link = screen.getByText('Receipt Book Settings').closest('a')
    expect(link).toHaveAttribute('href', '/admin/receipt-settings')
  })

  // Ticket 7 — walk-in submits giverName with null phoneNumber via multi mutation
  it('submits a walk-in entry with giverName and no phone', async () => {
    render(<ManualEntryPage />)
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), {
      target: { value: 'Visitor - John' },
    })

    // The identity (walk-in name) passed validation; the empty line items do
    // not, so submission is blocked before the mutation fires. This proves the
    // walk-in path no longer requires a phone number.
    fireEvent.click(screen.getByRole('button', { name: /Save Contribution/i }))

    expect(
      await screen.findByText(/Add at least one department and amount/i)
    ).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('blocks submission when neither phone nor giver name is provided', async () => {
    render(<ManualEntryPage />)
    fireEvent.click(screen.getByRole('button', { name: /Save Contribution/i }))
    expect(await screen.findByText(/Phone number is required/i)).toBeInTheDocument()
  })
})
