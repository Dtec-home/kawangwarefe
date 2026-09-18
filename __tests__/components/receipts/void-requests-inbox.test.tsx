/**
 * Void-request inbox (T2.6)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { state, mockDecide, mockRefetch, toastMock } = vi.hoisted(() => ({
  state: {
    requests: [] as unknown[],
    variables: undefined as Record<string, unknown> | undefined,
    mutationOptions: undefined as Record<string, unknown> | undefined,
  },
  mockDecide: vi.fn(),
  mockRefetch: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: (_doc: unknown, options?: { variables?: Record<string, unknown> }) => {
    state.variables = options?.variables
    return { data: { voidRequests: state.requests }, loading: false, error: undefined, refetch: mockRefetch }
  },
  useMutation: (_doc: unknown, options?: Record<string, unknown>) => {
    state.mutationOptions = options
    return [mockDecide, { loading: false }]
  },
}))

vi.mock('sonner', () => ({ toast: toastMock }))

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

import { VoidRequestsInbox } from '@/components/receipts/void-requests-inbox'

const pending = {
  id: '5',
  requestedByName: 'Tom Recorder',
  reason: 'Typed 5000 instead of 500',
  status: 'pending',
  decidedByName: null,
  decidedAt: null,
  decisionNote: '',
  createdAt: '2026-09-17T08:00:00Z',
  receipt: {
    id: '41',
    number: '20260917-0007',
    receiptDate: '2026-09-17',
    channel: 'cash',
    status: 'issued',
    totalAmount: '5000.00',
    giverName: 'Visitor - John',
    memberName: 'Guest',
  },
}

describe('VoidRequestsInbox', () => {
  beforeEach(() => {
    state.requests = [pending]
    mockDecide.mockReset()
    mockRefetch.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
  })

  it('lists pending requests by default', () => {
    render(<VoidRequestsInbox />)
    expect(state.variables).toEqual({ status: 'pending' })
    expect(screen.getByRole('link', { name: '20260917-0007' })).toHaveAttribute('href', '/receipts/20260917-0007')
    expect(screen.getByText('Typed 5000 instead of 500')).toBeInTheDocument()
    expect(screen.getByText(/Requested by Tom Recorder/)).toBeInTheDocument()
    expect(screen.getByText(/Visitor - John · KES 5,000.00/)).toBeInTheDocument()
  })

  it('filters by status', () => {
    render(<VoidRequestsInbox />)
    fireEvent.change(screen.getByLabelText('voidRequestStatus'), { target: { value: 'rejected' } })
    expect(state.variables).toEqual({ status: 'rejected' })
  })

  it('shows the empty state', () => {
    state.requests = []
    render(<VoidRequestsInbox />)
    expect(screen.getByText('No pending void requests')).toBeInTheDocument()
  })

  it('shows the decision on decided requests without action buttons', () => {
    state.requests = [
      { ...pending, status: 'rejected', decidedByName: 'Grace Treasurer', decidedAt: '2026-09-17T09:00:00Z', decisionNote: 'Amount is correct' },
    ]
    render(<VoidRequestsInbox />)
    expect(screen.getByText(/Rejected by Grace Treasurer/)).toHaveTextContent('Amount is correct')
    expect(screen.queryByRole('button', { name: /Approve void request/ })).not.toBeInTheDocument()
  })

  it('approves with a note', async () => {
    mockDecide.mockResolvedValue({
      data: { decideVoidRequest: { success: true, message: 'Void request approved', receiptNumber: '20260917-0007', status: 'void' } },
    })
    render(<VoidRequestsInbox />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve void request for 20260917-0007' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Note (optional)'), { target: { value: ' Confirmed with giver ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve and void' }))
    await waitFor(() =>
      expect(mockDecide).toHaveBeenCalledWith({ variables: { requestId: '5', approve: true, note: 'Confirmed with giver' } })
    )
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith('Void approved — receipt 20260917-0007 is now VOID')
    )
    expect(mockRefetch).toHaveBeenCalled()
    expect(state.mutationOptions?.refetchQueries).toContain('GetPendingVoidRequestCount')
  })

  it('rejects without a note (sent as null)', async () => {
    mockDecide.mockResolvedValue({
      data: { decideVoidRequest: { success: true, message: 'Void request rejected', receiptNumber: '20260917-0007', status: 'issued' } },
    })
    render(<VoidRequestsInbox />)
    fireEvent.click(screen.getByRole('button', { name: 'Reject void request for 20260917-0007' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject request' }))
    await waitFor(() =>
      expect(mockDecide).toHaveBeenCalledWith({ variables: { requestId: '5', approve: false, note: null } })
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Void request for 20260917-0007 rejected'))
  })

  it('shows a backend refusal as an error toast', async () => {
    mockDecide.mockResolvedValue({
      data: { decideVoidRequest: { success: false, message: 'Void request is already decided', receiptNumber: null, status: null } },
    })
    render(<VoidRequestsInbox />)
    fireEvent.click(screen.getByRole('button', { name: 'Reject void request for 20260917-0007' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject request' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Void request is already decided'))
    expect(mockRefetch).not.toHaveBeenCalled()
  })
})
