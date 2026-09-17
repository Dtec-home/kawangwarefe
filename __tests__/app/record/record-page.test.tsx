import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

/**
 * Recorder workspace `/record` (T2.5).
 */

const { state, toastMock } = vi.hoisted(() => ({
  state: {
    unlockDates: [] as string[],
    recorded: null as unknown,
  },
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

const createMock = vi.fn()
const lookupMock = vi.fn()
const resendMock = vi.fn()
const requestVoidMock = vi.fn()
const refetchMock = vi.fn().mockResolvedValue({})

type GqlDoc = { loc?: { source?: { body?: string } } }
type Children = { children: React.ReactNode }

const CATEGORIES = [
  { id: '1', name: 'Tithe', code: 'TITHE', description: '' },
  { id: '2', name: 'Offering', code: 'OFFER', description: '' },
]

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation((doc: GqlDoc) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('myRecordedReceipts')) {
      return { data: state.recorded ?? undefined, loading: false, error: undefined, refetch: refetchMock }
    }
    if (body.includes('contributionCategories')) {
      return { data: { contributionCategories: CATEGORIES }, loading: false, refetch: vi.fn() }
    }
    return { data: undefined, loading: false, refetch: vi.fn() }
  }),
  useMutation: vi.fn().mockImplementation((doc: GqlDoc) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('lookupMemberByPhone')) return [lookupMock, { loading: false }]
    if (body.includes('resendReceiptSms')) return [resendMock, { loading: false }]
    if (body.includes('requestReceiptVoid')) return [requestVoidMock, { loading: false }]
    return [createMock, { loading: false }]
  }),
}))

vi.mock('sonner', () => ({ toast: toastMock }))

vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({
    unlocks: [],
    unlockDates: state.unlockDates,
    hasActiveUnlocks: state.unlockDates.length > 0,
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({ isPureRecorder: true, isRecorder: true, isStaff: false, loading: false }),
}))

// Native <select> so a choice can be made in jsdom; `name` becomes the label.
vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: Children & { name?: string; value?: string; onValueChange?: (v: string) => void }) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: Children) => <>{children}</>,
  SelectItem: ({ value, children }: Children & { value: string }) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: Children) => <div data-testid="admin-layout">{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: Children) => <div>{children}</div>,
}))

import RecordGivingPage from '@/app/(dashboard)/record/page'

function departmentSelects() {
  return screen
    .getAllByRole('combobox')
    .filter((el) => el.querySelector('option[value="1"]')) as HTMLSelectElement[]
}

function fillLine(index: number, categoryId: string, amount: string) {
  fireEvent.change(departmentSelects()[index], { target: { value: categoryId } })
  fireEvent.change(document.getElementById(`amount-${index}`) as HTMLInputElement, { target: { value: amount } })
}

async function lookUpMary() {
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '0712345678' } })
  fireEvent.click(screen.getByRole('button', { name: /Search/ }))
  await screen.findByText('Mary Wanjiru')
}

async function reviewAndConfirm() {
  fireEvent.click(screen.getByRole('button', { name: /Review & save/ }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))
  return dialog
}

function receipt(overrides: Record<string, unknown>) {
  return {
    id: '1',
    number: '20260917-0012',
    receiptDate: '2026-09-17',
    channel: 'cash',
    status: 'issued',
    totalAmount: '1500.00',
    giverName: null,
    memberName: 'Mary Wanjiru',
    issuedByName: 'Rita',
    legacyBookNumber: null,
    mpesaCode: null,
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-09-17T07:05:00Z',
    lines: [],
    ...overrides,
  }
}

describe('Recorder workspace /record', () => {
  beforeEach(() => {
    state.unlockDates = []
    state.recorded = null
    try {
      window.sessionStorage.clear()
    } catch {
      /* ignore */
    }
    for (const mock of [createMock, lookupMock, resendMock, requestVoidMock, toastMock.success, toastMock.error]) {
      mock.mockReset()
    }
    lookupMock.mockResolvedValue({
      data: {
        lookupMemberByPhone: {
          success: true,
          found: true,
          message: 'Member found',
          member: null,
          giver: { id: '7', displayName: 'Mary Wanjiru' },
        },
      },
    })
    createMock.mockResolvedValue({
      data: {
        createManualMultiContribution: {
          success: true,
          message: 'ok',
          receiptNumber: '20260917-0012',
          smsSent: true,
        },
      },
    })
  })

  it('shows the giver name returned by the phone lookup', async () => {
    render(<RecordGivingPage />)
    expect(screen.getByRole('heading', { name: 'Record giving' })).toBeInTheDocument()
    await lookUpMary()
    expect(lookupMock).toHaveBeenCalledWith({ variables: { phoneNumber: '0712345678' } })
    expect(screen.getByTestId('giver-found')).toHaveTextContent('Confirm the name with the giver')
  })

  it('adds and removes lines with a running total', () => {
    render(<RecordGivingPage />)
    fillLine(0, '1', '500')
    expect(screen.getByTestId('lines-total')).toHaveTextContent('KES 500.00')
    fireEvent.click(screen.getByRole('button', { name: /Add another fund/ }))
    fillLine(1, '2', '250')
    expect(screen.getByTestId('lines-total')).toHaveTextContent('KES 750.00')
    fireEvent.click(screen.getAllByLabelText('Remove department')[1])
    expect(screen.getByTestId('lines-total')).toHaveTextContent('KES 500.00')
  })

  it('confirms and records a looked-up giver as cash for today by default', async () => {
    render(<RecordGivingPage />)
    await lookUpMary()
    fillLine(0, '1', '1000')
    fireEvent.click(screen.getByRole('button', { name: /Add another fund/ }))
    fillLine(1, '2', '500')

    fireEvent.click(screen.getByRole('button', { name: /Review & save/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Mary Wanjiru')).toBeInTheDocument()
    expect(within(dialog).getByText('Tithe')).toBeInTheDocument()
    expect(within(dialog).getByTestId('confirm-total')).toHaveTextContent('KES 1,500.00')
    expect(within(dialog).getByText('Today')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    const { variables } = createMock.mock.calls[0][0]
    expect(variables).toEqual({
      contributions: [
        { categoryId: '1', amount: '1000', purposeId: null, memberIdentifier: null },
        { categoryId: '2', amount: '500', purposeId: null, memberIdentifier: null },
      ],
      phoneNumber: '0712345678',
      giverName: null,
      entryType: 'cash',
    })
    expect(variables).not.toHaveProperty('transactionDate')

    expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent('20260917-0012')
    expect(screen.getByTestId('sms-status')).toHaveTextContent('SMS receipt sent')
    expect(screen.getByRole('link', { name: /Print receipt/ })).toHaveAttribute('href', '/receipts/20260917-0012')
    expect(toastMock.success).toHaveBeenCalledWith('Receipt 20260917-0012 issued')
    expect(refetchMock).toHaveBeenCalled()
  })

  it('records a walk-in by name with no phone and says no SMS is sent', async () => {
    render(<RecordGivingPage />)
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: 'Visitor - John' } })
    fillLine(0, '2', '200')
    await reviewAndConfirm()

    await waitFor(() => expect(createMock).toHaveBeenCalled())
    const { variables } = createMock.mock.calls[0][0]
    expect(variables.phoneNumber).toBeNull()
    expect(variables.giverName).toBe('Visitor - John')
    expect(lookupMock).not.toHaveBeenCalled()
    expect(await screen.findByTestId('sms-status')).toHaveTextContent('Walk-in: no SMS sent')
  })

  it('sends the catch-up date only when one is chosen, and keeps the entry type for the next giver', async () => {
    state.unlockDates = ['2026-08-29']
    render(<RecordGivingPage />)
    fireEvent.click(screen.getByRole('radio', { name: 'Envelope' }))
    fireEvent.change(screen.getByLabelText('recordFor'), { target: { value: '2026-08-29' } })
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: 'Visitor' } })
    fillLine(0, '1', '300')
    await reviewAndConfirm()

    await waitFor(() => expect(createMock).toHaveBeenCalled())
    const { variables } = createMock.mock.calls[0][0]
    expect(variables.entryType).toBe('envelope')
    expect(variables.transactionDate).toBe('2026-08-29')

    fireEvent.click(await screen.findByRole('button', { name: /Next giver/ }))
    // Giver and lines reset, entry type kept
    expect(screen.getByLabelText('Phone Number')).toHaveValue('')
    expect(screen.getByTestId('lines-total')).toHaveTextContent('KES 0.00')
    expect(screen.getByRole('radio', { name: 'Envelope' })).toHaveAttribute('aria-checked', 'true')
  })

  it('ignores a double tap on confirm while saving', async () => {
    let resolve: (value: unknown) => void = () => {}
    createMock.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<RecordGivingPage />)
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: 'Visitor' } })
    fillLine(0, '1', '100')
    const dialog = await reviewAndConfirm()
    const confirm = within(dialog).getByRole('button', { name: /Saving|Confirm/ })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(createMock).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(confirm).toBeDisabled())
    resolve({ data: { createManualMultiContribution: { success: true, message: 'ok', receiptNumber: '20260917-0013', smsSent: false } } })
    expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent('20260917-0013')
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('shows the backend message when recording is refused', async () => {
    createMock.mockResolvedValue({
      data: {
        createManualMultiContribution: {
          success: false,
          message: 'Entries can only be recorded for today unless a catch-up window is open',
        },
      },
    })
    render(<RecordGivingPage />)
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: 'Visitor' } })
    fillLine(0, '1', '100')
    await reviewAndConfirm()
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        'Entries can only be recorded for today unless a catch-up window is open'
      )
    )
    expect(screen.queryByTestId('issued-receipt-number')).not.toBeInTheDocument()
  })

  it('blocks review until a department and amount are given', async () => {
    render(<RecordGivingPage />)
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: 'Visitor' } })
    fireEvent.click(screen.getByRole('button', { name: /Review & save/ }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Add at least one department and amount'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe("Today's entries", () => {
    beforeEach(() => {
      state.recorded = {
        myRecordedReceipts: {
          date: '2026-09-17',
          count: 2,
          voidCount: 1,
          totalAmount: '1500.00',
          items: [
            receipt({}),
            receipt({ id: '2', number: '20260917-0011', status: 'void', giverName: 'Visitor - John', totalAmount: '5000.00' }),
          ],
        },
      }
    })

    function openToday() {
      fireEvent.mouseDown(screen.getByRole('tab', { name: "Today's entries (2)" }))
    }

    it('lists receipts with count, total and VOID badge', async () => {
      render(<RecordGivingPage />)
      openToday()
      const summary = await screen.findByTestId('todays-summary')
      expect(summary).toHaveTextContent('2')
      expect(summary).toHaveTextContent('1 void')
      expect(summary).toHaveTextContent('KES 1,500.00')

      const issued = screen.getByTestId('entry-20260917-0012')
      expect(issued).toHaveTextContent('Mary Wanjiru')
      expect(within(issued).getByRole('link', { name: /Print/ })).toHaveAttribute('href', '/receipts/20260917-0012')
      expect(within(issued).getByRole('button', { name: /Resend SMS/ })).toBeInTheDocument()

      const voided = screen.getByTestId('entry-20260917-0011')
      expect(within(voided).getByText('VOID')).toBeInTheDocument()
      expect(within(voided).queryByRole('button', { name: /Resend SMS/ })).not.toBeInTheDocument()
      expect(within(voided).queryByRole('button', { name: /Request void/ })).not.toBeInTheDocument()
    })

    it('hides Resend SMS for walk-ins', async () => {
      state.recorded = {
        myRecordedReceipts: {
          date: '2026-09-17', count: 2, voidCount: 0, totalAmount: '200.00',
          items: [receipt({ number: '20260917-0020', giverName: 'Visitor' }), receipt({ id: '3', number: '20260917-0021' })],
        },
      }
      render(<RecordGivingPage />)
      openToday()
      const walkIn = await screen.findByTestId('entry-20260917-0020')
      expect(within(walkIn).queryByRole('button', { name: /Resend SMS/ })).not.toBeInTheDocument()
      expect(within(walkIn).getByRole('button', { name: /Request void/ })).toBeInTheDocument()
    })

    it('resends the SMS and shows the resends remaining', async () => {
      resendMock.mockResolvedValue({
        data: { resendReceiptSms: { success: true, message: 'Receipt 20260917-0012 SMS queued', receiptNumber: '20260917-0012', resendsRemaining: 2 } },
      })
      render(<RecordGivingPage />)
      openToday()
      const issued = await screen.findByTestId('entry-20260917-0012')
      fireEvent.click(within(issued).getByRole('button', { name: /Resend SMS/ }))
      await waitFor(() => expect(resendMock).toHaveBeenCalledWith({ variables: { receiptNumber: '20260917-0012' } }))
      expect(await within(issued).findByRole('button', { name: 'Resend SMS (2 left)' })).toBeInTheDocument()
      expect(toastMock.success).toHaveBeenCalledWith('Receipt 20260917-0012 SMS queued')
    })

    it('requests a void with a reason of at least 10 characters', async () => {
      requestVoidMock.mockResolvedValue({
        data: { requestReceiptVoid: { success: true, message: 'Void requested for receipt 20260917-0012', receiptNumber: '20260917-0012', voidRequest: { id: '9', status: 'pending' } } },
      })
      render(<RecordGivingPage />)
      openToday()
      const issued = await screen.findByTestId('entry-20260917-0012')
      fireEvent.click(within(issued).getByRole('button', { name: /Request void/ }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'typo' } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
      expect(await within(dialog).findByText(/at least 10 characters/)).toBeInTheDocument()
      expect(requestVoidMock).not.toHaveBeenCalled()

      fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'Recorded against the wrong giver' } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
      await waitFor(() =>
        expect(requestVoidMock).toHaveBeenCalledWith({
          variables: { receiptNumber: '20260917-0012', reason: 'Recorded against the wrong giver' },
        })
      )
      expect(await within(issued).findByText('Void requested')).toBeInTheDocument()
      expect(within(issued).queryByRole('button', { name: /Request void/ })).not.toBeInTheDocument()
    })
  })
})
