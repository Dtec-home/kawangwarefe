/**
 * Receipt register /admin/receipts (T1.8)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { state, mockVoid, mockRefetch, toastMock, pushMock } = vi.hoisted(() => ({
  state: {
    canVoidReceipts: true,
    receipts: [] as unknown[],
    totalCount: 0,
    queryCalls: [] as Array<{ body: string; variables: Record<string, unknown> | undefined }>,
  },
  mockVoid: vi.fn(),
  mockRefetch: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
  pushMock: vi.fn(),
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: { loc?: { source?: { body?: string } } }, options?: { variables?: Record<string, unknown> }) => {
    const body = doc?.loc?.source?.body || ''
    state.queryCalls.push({ body, variables: options?.variables })
    return {
      data: { receipts: { items: state.receipts, totalCount: state.totalCount } },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    }
  },
  useMutation: () => [mockVoid, { loading: false }],
}))

vi.mock('sonner', () => ({ toast: toastMock }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => '/admin/receipts',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({ isStaff: true, canVoidReceipts: state.canVoidReceipts, loading: false }),
}))

vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}))

const { protectedProps } = vi.hoisted(() => ({ protectedProps: { requiredAccess: '' as string | undefined } }))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children, requiredAccess }: { children: React.ReactNode; requiredAccess?: string }) => {
    protectedProps.requiredAccess = requiredAccess
    return <div>{children}</div>
  },
}))

interface SelectMockProps {
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: SelectMockProps) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

import ReceiptsPage from '@/app/(dashboard)/admin/receipts/page'

const issued = {
  id: '11',
  number: '20260917-0003',
  receiptDate: '2026-09-17',
  channel: 'envelope',
  status: 'issued',
  totalAmount: '1500.00',
  giverName: null,
  memberName: 'Mary Wanjiru',
  issuedByName: 'Tom Recorder',
  legacyBookNumber: null,
  mpesaCode: null,
  voidedAt: null,
  voidReason: '',
  createdAt: '2026-09-17T07:00:00Z',
  lines: [],
}
const voided = {
  ...issued,
  id: '12',
  number: '20260917-0004',
  channel: 'mpesa_c2b',
  status: 'void',
  memberName: 'John Otieno',
  issuedByName: null,
  mpesaCode: 'TIH12ABC34',
  voidReason: 'Duplicate entry for the same gift',
}

const lastReceiptsVariables = () =>
  [...state.queryCalls].reverse().find((c) => c.body.includes('receipts('))?.variables

describe('ReceiptsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 23:30 UTC on 16 Sep = 02:30 on 17 Sep in Nairobi
    vi.setSystemTime(new Date('2026-09-16T23:30:00Z'))
    state.canVoidReceipts = true
    state.receipts = [issued, voided]
    state.totalCount = 2
    state.queryCalls = []
    mockVoid.mockReset()
    mockRefetch.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    pushMock.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the header and is gated as staff', () => {
    render(<ReceiptsPage />)
    expect(screen.getByRole('heading', { name: 'Receipts' })).toBeInTheDocument()
    expect(protectedProps.requiredAccess).toBe('staff')
    expect(screen.getByText('Search by number, name or M-Pesa code')).toBeInTheDocument()
  })

  it('defaults the date range to today in Nairobi', () => {
    render(<ReceiptsPage />)
    expect(screen.getByLabelText('From')).toHaveValue('2026-09-17')
    expect(screen.getByLabelText('To')).toHaveValue('2026-09-17')
    expect(lastReceiptsVariables()).toEqual({
      filter: { dateFrom: '2026-09-17', dateTo: '2026-09-17', channel: null, status: null, search: null },
      limit: 50,
      offset: 0,
    })
  })

  it('maps filters and search to query variables', () => {
    render(<ReceiptsPage />)
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-08-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-08-31' } })
    fireEvent.change(screen.getByLabelText('channel'), { target: { value: 'mpesa_c2b' } })
    fireEvent.change(screen.getByLabelText('status'), { target: { value: 'void' } })
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '  TIH12ABC34 ' } })
    fireEvent.click(screen.getByRole('button', { name: /^Search$/ }))
    expect(lastReceiptsVariables()).toEqual({
      filter: { dateFrom: '2026-08-01', dateTo: '2026-08-31', channel: 'mpesa_c2b', status: 'void', search: 'TIH12ABC34' },
      limit: 50,
      offset: 0,
    })
  })

  it('pages with offset', () => {
    state.totalCount = 120
    render(<ReceiptsPage />)
    expect(screen.getByText('Showing 1–50 of 120')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(lastReceiptsVariables()?.offset).toBe(50)
    expect(screen.getByText('Showing 51–100 of 120')).toBeInTheDocument()
  })

  it('lists receipts with number, giver, channel, total, VOID badge and issuer', () => {
    render(<ReceiptsPage />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('20260917-0003')).toBeInTheDocument()
    expect(within(table).getByText('Mary Wanjiru')).toBeInTheDocument()
    expect(within(table).getByText('Envelope')).toBeInTheDocument()
    expect(within(table).getByText('M-Pesa Pay Bill')).toBeInTheDocument()
    expect(within(table).getAllByText('KES 1,500.00').length).toBe(2)
    expect(within(table).getByText('VOID')).toBeInTheDocument()
    expect(within(table).getByText('Tom Recorder')).toBeInTheDocument()
    expect(within(table).getByText('System')).toBeInTheDocument()
  })

  it('opens the receipt detail when a row is clicked', () => {
    render(<ReceiptsPage />)
    fireEvent.click(within(screen.getByRole('table')).getByText('20260917-0003'))
    expect(pushMock).toHaveBeenCalledWith('/receipts/20260917-0003')
  })

  it('shows the empty state', () => {
    state.receipts = []
    state.totalCount = 0
    render(<ReceiptsPage />)
    expect(screen.getByText('No receipts found')).toBeInTheDocument()
  })

  it('hides the void action when the user cannot void receipts', () => {
    state.canVoidReceipts = false
    render(<ReceiptsPage />)
    expect(screen.queryByLabelText(/Void receipt/)).not.toBeInTheDocument()
  })

  it('offers void only on issued receipts', () => {
    render(<ReceiptsPage />)
    expect(screen.getAllByLabelText('Void receipt 20260917-0003').length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('Void receipt 20260917-0004')).not.toBeInTheDocument()
  })

  it('requires a reason of at least 10 characters before voiding', async () => {
    render(<ReceiptsPage />)
    fireEvent.click(screen.getAllByLabelText('Void receipt 20260917-0003')[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'typo' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Void receipt' }))
    expect(within(dialog).getByText(/at least 10 characters/)).toBeInTheDocument()
    expect(mockVoid).not.toHaveBeenCalled()
  })

  it('voids with the receipt id and trimmed reason, then toasts and refetches', async () => {
    mockVoid.mockResolvedValue({
      data: { voidReceipt: { success: true, message: 'Receipt 20260917-0003 voided', receiptNumber: '20260917-0003', status: 'void' } },
    })
    render(<ReceiptsPage />)
    fireEvent.click(screen.getAllByLabelText('Void receipt 20260917-0003')[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: '  Amount entered wrongly ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Void receipt' }))
    await waitFor(() =>
      expect(mockVoid).toHaveBeenCalledWith({ variables: { receiptId: '11', reason: 'Amount entered wrongly' } })
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Receipt 20260917-0003 voided'))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows a backend refusal as an error toast', async () => {
    mockVoid.mockResolvedValue({
      data: { voidReceipt: { success: false, message: 'Permission denied: only a treasurer or admin can void receipts', receiptNumber: null, status: null } },
    })
    render(<ReceiptsPage />)
    fireEvent.click(screen.getAllByLabelText('Void receipt 20260917-0003')[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'Amount entered wrongly' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Void receipt' }))
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith('Permission denied: only a treasurer or admin can void receipts')
    )
    expect(mockRefetch).not.toHaveBeenCalled()
  })
})
