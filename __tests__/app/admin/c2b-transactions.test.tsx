import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mutable so individual tests can override what the stale-STK query returns
// without disturbing the other three queries this page fires.
let mockStaleMpesaTransactions: any[] = []

// Mock Apollo. Distinguish the stale-STK-transactions query from the other
// three queries this page fires by inspecting the GraphQL operation body
// (same idiom as __tests__/app/admin/categories.test.tsx).
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation((query: any) => {
    const body = query?.loc?.source?.body || ''
    if (body.includes('GetStaleMpesaTransactions')) {
      return {
        data: { staleMpesaTransactions: mockStaleMpesaTransactions },
        loading: false,
        error: null,
        refetch: vi.fn(),
      }
    }
    return {
      data: {
        contributionCategories: [
          { id: '1', name: 'Tithe', code: 'TITHE' },
          { id: '2', name: 'Offering', code: 'OFFER' },
        ],
        c2bTransactionStats: {
          totalAmount: '250000.00',
          totalCount: 60,
          processedCount: 50,
          unmatchedCount: 7,
          failedCount: 3,
        },
        c2bTransactions: {
          items: [
            {
              id: 'tx1',
              transId: 'MPESA001',
              transTime: '2025-03-20T10:30:00Z',
              transAmount: '5000.00',
              billRefNumber: 'TITHE',
              msisdn: '254712345678',
              customerName: 'John Kamau',
              firstName: 'John',
              middleName: '',
              lastName: 'Kamau',
              status: 'processed',
              matchedCategoryCode: 'TITHE',
              matchMethod: 'exact',
              createdAt: '2025-03-20T10:30:00Z',
            },
            {
              id: 'tx2',
              transId: 'MPESA002',
              transTime: '2025-03-19T14:00:00Z',
              transAmount: '2000.00',
              billRefNumber: 'UNKNOWN',
              msisdn: '254798765432',
              customerName: 'Jane Wanjiku',
              firstName: 'Jane',
              middleName: '',
              lastName: 'Wanjiku',
              status: 'unmatched',
              matchedCategoryCode: '',
              matchMethod: '',
              createdAt: '2025-03-19T14:00:00Z',
            },
          ],
          total: 2,
          hasMore: false,
        },
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    }
  }),
  useMutation: () => [vi.fn(), { loading: false }],
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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import C2BTransactionsPage from '@/app/(dashboard)/admin/c2b-transactions/page'

describe('C2BTransactionsPage', () => {
  beforeEach(() => {
    mockStaleMpesaTransactions = []
  })

  it('renders the heading', () => {
    render(<C2BTransactionsPage />)
    expect(screen.getByText('C2B Transactions')).toBeInTheDocument()
  })

  it('renders stats cards with data', () => {
    render(<C2BTransactionsPage />)
    expect(screen.getByText('Total Received')).toBeInTheDocument()
    expect(screen.getByText('60 transactions')).toBeInTheDocument()
    expect(screen.getByText('Successfully matched')).toBeInTheDocument()
    expect(screen.getByText('Needs manual resolution')).toBeInTheDocument()
  })

  it('renders unmatched alert banner', () => {
    render(<C2BTransactionsPage />)
    expect(screen.getByText(/7 unmatched transactions? need attention/)).toBeInTheDocument()
    expect(screen.getByText('View Unmatched')).toBeInTheDocument()
  })

  it('renders transaction data in table', () => {
    render(<C2BTransactionsPage />)
    expect(screen.getByText('Pay Bill Transactions')).toBeInTheDocument()
    expect(screen.getByText('2 transactions found')).toBeInTheDocument()
    expect(screen.getAllByText('John Kamau').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Jane Wanjiku').length).toBeGreaterThan(0)
  })

  it('renders Refresh button', () => {
    render(<C2BTransactionsPage />)
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument()
  })

  it('renders an empty state when no STK transactions are stale', () => {
    render(<C2BTransactionsPage />)
    expect(screen.getByText('Stale STK Transactions')).toBeInTheDocument()
    expect(screen.getByText('Nothing needs review')).toBeInTheDocument()
  })

  it('renders stale STK transactions when present', () => {
    mockStaleMpesaTransactions = [
      {
        id: 'stk1',
        phoneNumber: '254711000111',
        amount: '250.00',
        status: 'stale',
        checkoutRequestId: 'ws_CO_STALE001',
        merchantRequestId: 'merchant_STALE001',
        mpesaReceiptNumber: null,
        transactionDate: null,
        resultDesc: null,
      },
    ]
    render(<C2BTransactionsPage />)
    expect(screen.getByText('Stale STK Transactions')).toBeInTheDocument()
    expect(screen.queryByText('Nothing needs review')).not.toBeInTheDocument()
    expect(screen.getByText('254711000111')).toBeInTheDocument()
    expect(screen.getByText('ws_CO_STALE001')).toBeInTheDocument()
  })
})
