/**
 * Recorder gift form: idempotent submissions (T5.3).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { createMock, toastMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

type GqlDoc = { loc?: { source?: { body?: string } } }
type Children = { children: React.ReactNode }

vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: GqlDoc) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('contributionCategories')) {
      return {
        data: { contributionCategories: [{ id: '1', name: 'Tithe', code: 'TITHE', description: '' }] },
        loading: false,
        refetch: vi.fn(),
      }
    }
    return { data: undefined, loading: false, refetch: vi.fn() }
  },
  useMutation: () => [createMock, { loading: false }],
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: Children & { value?: string; onValueChange?: (v: string) => void }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: Children) => <>{children}</>,
  SelectItem: ({ value, children }: Children & { value: string }) => <option value={value}>{children}</option>,
}))

import { RecordGiftForm } from '@/components/recorder/record-gift-form'

const issued = (number: string, replay = false) => ({
  data: {
    createManualMultiContribution: {
      success: true,
      message: replay ? 'Duplicate submission' : 'ok',
      receiptNumber: number,
      totalAmount: '200.00',
      smsSent: false,
      idempotentReplay: replay,
    },
  },
})

function renderForm(onRecorded = vi.fn()) {
  render(
    <RecordGiftForm
      entryType="cash"
      onEntryTypeChange={vi.fn()}
      unlockDates={[]}
      hasActiveUnlocks={false}
      nameOnly
      onRecorded={onRecorded}
    />
  )
  return onRecorded
}

function enterWalkInGift(name = 'Visitor - John', amount = '200') {
  fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
  fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: name } })
  const select = screen.getAllByRole('combobox').find((el) => el.querySelector('option[value="1"]')) as HTMLSelectElement
  fireEvent.change(select, { target: { value: '1' } })
  fireEvent.change(document.getElementById('amount-0') as HTMLInputElement, { target: { value: amount } })
}

async function review() {
  fireEvent.click(screen.getByRole('button', { name: /Review & save/ }))
  return screen.findByRole('dialog')
}

const keyOf = (call: number) => createMock.mock.calls[call][0].variables.idempotencyKey as string

describe('RecordGiftForm idempotency', () => {
  beforeEach(() => {
    createMock.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    toastMock.info.mockReset()
  })

  it('retries a failed submission with the same key and records once', async () => {
    createMock.mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce(issued('20260917-0013'))
    const onRecorded = renderForm()
    enterWalkInGift()
    const dialog = await review()
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))

    expect(await within(dialog).findByTestId('record-retry-notice')).toHaveTextContent('will not be recorded twice')
    expect(toastMock.error).toHaveBeenCalledWith('Failed to fetch')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }))

    expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent('20260917-0013')
    expect(createMock).toHaveBeenCalledTimes(2)
    expect(keyOf(0)).toMatch(/^[0-9a-f-]{36}$/)
    expect(keyOf(1)).toBe(keyOf(0))
    expect(onRecorded).toHaveBeenCalledTimes(1)
  })

  it('uses a new key for the next giver', async () => {
    createMock.mockResolvedValueOnce(issued('20260917-0013')).mockResolvedValueOnce(issued('20260917-0014'))
    renderForm()
    enterWalkInGift()
    fireEvent.click(within(await review()).getByRole('button', { name: /Confirm & issue receipt/ }))
    await screen.findByTestId('issued-receipt-number')
    fireEvent.click(screen.getByRole('button', { name: /Next giver/ }))

    // Same details again: still a different giver's gift
    enterWalkInGift()
    fireEvent.click(within(await review()).getByRole('button', { name: /Confirm & issue receipt/ }))
    expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent('20260917-0014')
    expect(keyOf(1)).not.toBe(keyOf(0))
  })

  it('shows the original receipt with an "Already recorded" toast on a replay', async () => {
    createMock.mockRejectedValueOnce(new Error('Network request failed')).mockResolvedValueOnce(issued('20260917-0013', true))
    renderForm()
    enterWalkInGift()
    const dialog = await review()
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Retry' }))

    expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent('20260917-0013')
    expect(toastMock.info).toHaveBeenCalledWith('Already recorded', {
      description: 'Showing the original receipt 20260917-0013.',
    })
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(keyOf(1)).toBe(keyOf(0))
  })

  it('drops the key after the server refuses the entry', async () => {
    createMock
      .mockResolvedValueOnce({ data: { createManualMultiContribution: { success: false, message: 'Date is certified' } } })
      .mockResolvedValueOnce(issued('20260917-0015'))
    renderForm()
    enterWalkInGift()
    const dialog = await review()
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Date is certified'))
    expect(within(dialog).queryByTestId('record-retry-notice')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))
    await screen.findByTestId('issued-receipt-number')
    expect(keyOf(1)).not.toBe(keyOf(0))
  })
})
