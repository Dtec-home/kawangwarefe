import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const attachMutation = vi.fn().mockResolvedValue({
  data: { attachBookReceiptNumber: { success: true, message: 'ok', contribution: { id: 'c1', manualReceiptNumber: 'MB-1003' } } },
})
const refetchSpy = vi.fn()

// Mock Apollo
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      contributionCategories: [
        { id: '1', name: 'Tithe', code: 'TITHE' },
        { id: '2', name: 'Offering', code: 'OFFER' },
      ],
      contributionStats: {
        totalAmount: '150000.00',
        totalCount: 45,
        completedAmount: '120000.00',
        completedCount: 38,
        pendingAmount: '25000.00',
        pendingCount: 5,
        failedCount: 2,
      },
      allContributions: {
        items: [
          {
            id: 'c1',
            amount: '5000.00',
            status: 'completed',
            transactionDate: '2025-03-20T10:30:00Z',
            notes: null,
            manualReceiptNumber: null,
            member: { id: 'm1', fullName: 'John Kamau', phoneNumber: '254712345678', memberNumber: 'MEM001' },
            category: { id: '1', name: 'Tithe', code: 'TITHE' },
            mpesaTransaction: { id: 't1', mpesaReceiptNumber: 'RCT001ABC', status: 'completed', resultDesc: null },
          },
          {
            id: 'c2',
            amount: '2000.00',
            status: 'pending',
            transactionDate: null,
            notes: 'Pending verification',
            manualReceiptNumber: 'MB-2001',
            member: { id: 'm2', fullName: 'Jane Wanjiku', phoneNumber: '254798765432', memberNumber: null },
            category: { id: '2', name: 'Offering', code: 'OFFER' },
            mpesaTransaction: null,
          },
          {
            id: 'c3',
            amount: '10000.00',
            status: 'failed',
            transactionDate: '2025-03-18T14:00:00Z',
            notes: null,
            manualReceiptNumber: null,
            member: { id: 'm3', fullName: 'Peter Odhiambo', phoneNumber: '254700111222', memberNumber: 'MEM003' },
            category: { id: '1', name: 'Tithe', code: 'TITHE' },
            mpesaTransaction: { id: 't3', mpesaReceiptNumber: null, status: 'failed', resultDesc: 'Insufficient funds' },
          },
        ],
        total: 3,
        hasMore: false,
      },
      myGroupNames: [],
      groupContributions: [],
    },
    loading: false,
    error: null,
    refetch: refetchSpy,
  })),
  useMutation: () => [attachMutation, { loading: false }],
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
    isCategoryAdmin: false,
    isGroupAdmin: false,
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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import ContributionsPage from '@/app/(dashboard)/admin/contributions/page'

describe('ContributionsPage', () => {
  it('renders the heading', () => {
    render(<ContributionsPage />)
    expect(screen.getByText('Contributions')).toBeInTheDocument()
  })

  it('renders the statistics cards with data', () => {
    render(<ContributionsPage />)
    expect(screen.getByText('Total Amount')).toBeInTheDocument()
    expect(screen.getByText('45 transactions')).toBeInTheDocument()
    expect(screen.getByText('38 successful')).toBeInTheDocument()
    expect(screen.getByText('Failed transactions')).toBeInTheDocument()
  })

  it('renders contribution rows with member names', () => {
    render(<ContributionsPage />)
    expect(screen.getAllByText('John Kamau').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Jane Wanjiku').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Peter Odhiambo').length).toBeGreaterThan(0)
  })

  it('renders the contributions count description', () => {
    render(<ContributionsPage />)
    expect(screen.getByText('3 contributions found')).toBeInTheDocument()
  })

  it('renders the Manual Entry link', () => {
    render(<ContributionsPage />)
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()
  })

  it('renders the filters section', () => {
    render(<ContributionsPage />)
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
  })

  it('renders the Book Receipt # column with existing book numbers', () => {
    render(<ContributionsPage />)
    expect(screen.getAllByText('Book Receipt #').length).toBeGreaterThan(0)
    // Jane's contribution has both an M-Pesa-less row and a book number set
    expect(screen.getAllByText('MB-2001').length).toBeGreaterThan(0)
  })

  it('attaches a book receipt number via the edit dialog and refetches', async () => {
    attachMutation.mockClear()
    refetchSpy.mockClear()
    render(<ContributionsPage />)

    // Open the dialog for the first row (desktop table edit button)
    const editButtons = screen.getAllByLabelText(/book receipt number/i)
    fireEvent.click(editButtons[0])

    const dialog = await screen.findByRole('dialog')
    const input = within(dialog).getByLabelText('Book Receipt #')
    fireEvent.change(input, { target: { value: 'MB-1003' } })
    fireEvent.click(within(dialog).getByText('Save'))

    await waitFor(() => {
      expect(attachMutation).toHaveBeenCalledWith({
        variables: { contributionId: 'c1', receiptNumber: 'MB-1003' },
      })
    })
    await waitFor(() => expect(refetchSpy).toHaveBeenCalled())
  })
})
