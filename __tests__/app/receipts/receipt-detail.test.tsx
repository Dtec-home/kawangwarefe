/**
 * Receipt detail / print page /receipts/[number] (T1.8)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { state, mockVoid, mockRefetch, toastMock } = vi.hoisted(() => ({
  state: {
    receipt: null as Record<string, unknown> | null,
    loading: false,
    role: { canVoidReceipts: false, isStaff: false, isRecorder: false, loading: false },
    variables: undefined as Record<string, unknown> | undefined,
    number: '20260829-0017',
  },
  mockVoid: vi.fn(),
  mockRefetch: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: (_doc: unknown, options?: { variables?: Record<string, unknown> }) => {
    state.variables = options?.variables
    return {
      data: state.loading ? undefined : { receipt: state.receipt, churchProfile: { displayName: 'SDA Church Kawangware' } },
      loading: state.loading,
      error: undefined,
      refetch: mockRefetch,
    }
  },
  useMutation: () => [mockVoid, { loading: false }],
}))

vi.mock('sonner', () => ({ toast: toastMock }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/receipts/x',
  useParams: () => ({ number: state.number }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => state.role,
}))

vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}))
vi.mock('@/components/layouts/member-layout', () => ({
  MemberLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="member-layout">{children}</div>,
}))

import ReceiptPage from '@/app/(dashboard)/receipts/[number]/page'

const receipt = {
  id: '41',
  number: '20260829-0017',
  receiptDate: '2026-08-29',
  channel: 'mpesa_c2b',
  status: 'issued',
  totalAmount: '2500.00',
  giverName: null,
  memberName: 'Mary Wanjiru',
  issuedByName: null,
  legacyBookNumber: '1043',
  mpesaCode: 'TIH12ABC34',
  voidedAt: null,
  voidReason: '',
  createdAt: '2026-08-29T07:15:00Z',
  lines: [
    { id: '1', categoryName: 'Tithe', purposeName: null, amount: '2000.00' },
    { id: '2', categoryName: 'Combined Offering', purposeName: 'Camp meeting', amount: '500.00' },
  ],
}

describe('ReceiptPage', () => {
  beforeEach(() => {
    state.receipt = { ...receipt }
    state.loading = false
    state.number = '20260829-0017'
    state.role = { canVoidReceipts: false, isStaff: false, isRecorder: false, loading: false }
    mockVoid.mockReset()
    mockRefetch.mockReset()
    toastMock.success.mockReset()
  })

  it('queries the receipt by the number in the URL', () => {
    render(<ReceiptPage />)
    expect(state.variables).toEqual({ number: '20260829-0017' })
  })

  it('renders church name, number, date, giver, lines, total and M-Pesa code', () => {
    render(<ReceiptPage />)
    const card = screen.getByRole('article', { name: 'Receipt 20260829-0017' })
    expect(within(card).getByText('SDA Church Kawangware')).toBeInTheDocument()
    expect(within(card).getByText('20260829-0017')).toBeInTheDocument()
    expect(within(card).getByText('Sat, 29 Aug 2026')).toBeInTheDocument()
    expect(within(card).getByText('Mary Wanjiru')).toBeInTheDocument()
    expect(within(card).getByText('Tithe')).toBeInTheDocument()
    expect(within(card).getByText('KES 2,000.00')).toBeInTheDocument()
    expect(within(card).getByText('Combined Offering')).toBeInTheDocument()
    expect(within(card).getByText('Camp meeting')).toBeInTheDocument()
    expect(within(card).getByText('KES 2,500.00')).toBeInTheDocument()
    expect(within(card).getByText('M-Pesa Pay Bill')).toBeInTheDocument()
    expect(within(card).getByText('TIH12ABC34')).toBeInTheDocument()
    expect(within(card).getByText('1043')).toBeInTheDocument()
    expect(within(card).queryByText(/This receipt is VOID/)).not.toBeInTheDocument()
  })

  it('uses the member layout for members and the admin layout for staff', () => {
    const { unmount } = render(<ReceiptPage />)
    expect(screen.getByTestId('member-layout')).toBeInTheDocument()
    unmount()
    state.role = { ...state.role, isStaff: true }
    render(<ReceiptPage />)
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
  })

  it('prints with window.print and ships print CSS that hides app chrome', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<ReceiptPage />)
    fireEvent.click(screen.getByRole('button', { name: /Print/ }))
    expect(printSpy).toHaveBeenCalled()
    const css = screen.getByTestId('receipt-print-styles').textContent || ''
    expect(css).toContain('@media print')
    expect(css).toContain('.receipt-print-area')
    expect(css).toContain('72mm')
    printSpy.mockRestore()
  })

  it('shows the VOID state with its reason', () => {
    state.receipt = {
      ...receipt,
      status: 'void',
      voidReason: 'Duplicate of 20260829-0016',
      voidedAt: '2026-08-29T09:00:00Z',
    }
    render(<ReceiptPage />)
    expect(screen.getByText('This receipt is VOID')).toBeInTheDocument()
    expect(screen.getByText('Reason: Duplicate of 20260829-0016')).toBeInTheDocument()
    expect(screen.getAllByText('VOID').length).toBeGreaterThanOrEqual(2) // watermark + badge
  })

  it('shows not found when the backend returns null', () => {
    state.receipt = null
    render(<ReceiptPage />)
    expect(screen.getByText('Receipt not found or not accessible')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Print/ })).not.toBeInTheDocument()
  })

  it('shows a skeleton while loading', () => {
    state.loading = true
    render(<ReceiptPage />)
    expect(screen.getByTestId('receipt-loading')).toBeInTheDocument()
  })

  it('hides the void action when the user cannot void receipts', () => {
    state.role = { ...state.role, isStaff: true }
    render(<ReceiptPage />)
    expect(screen.queryByRole('button', { name: /^Void$/ })).not.toBeInTheDocument()
  })

  it('lets a treasurer void from the detail page', async () => {
    state.role = { canVoidReceipts: true, isStaff: true, isRecorder: false, loading: false }
    mockVoid.mockResolvedValue({
      data: { voidReceipt: { success: true, message: 'Receipt 20260829-0017 voided', receiptNumber: '20260829-0017', status: 'void' } },
    })
    render(<ReceiptPage />)
    fireEvent.click(screen.getByRole('button', { name: /^Void$/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'Entered against wrong member' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Void receipt' }))
    await waitFor(() =>
      expect(mockVoid).toHaveBeenCalledWith({ variables: { receiptId: '41', reason: 'Entered against wrong member' } })
    )
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled())
  })
})
