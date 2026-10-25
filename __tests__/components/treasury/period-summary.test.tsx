/**
 * Period summary on the Cash Statement card (T4.1 local fund ledger, T4.2
 * remittances). Rendered through MockedProvider with the real documents so
 * query and mutation variables are checked against what the backend receives.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import type { MockLink } from '@apollo/client/testing'
import React from 'react'

vi.mock('@/components/ui/select', async () => (await import('../../fixtures/treasury-period-summary')).selectMock())
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from 'sonner'
import { PeriodSummary } from '@/components/treasury/period-summary'
import { formatEntryDate } from '@/lib/treasury/entry-dates'
import {
  CREATE_REMITTANCE,
  DELETE_REMITTANCE,
  SET_LOCAL_FUND_OPENING_BALANCE,
  UPDATE_REMITTANCE,
} from '@/lib/graphql/treasury-mutations'
import {
  mutationMock,
  opening,
  remittance,
  roleMock,
  summaryMock,
  type Persona,
} from '../../fixtures/treasury-period-summary'

const FROM = '2026-09-01'
const TO = '2026-09-30'

function renderSummary(persona: Persona, mocks: MockLink.MockedResponse[], props = { dateFrom: FROM, dateTo: TO }) {
  const allMocks = [roleMock(persona), ...mocks]
  const view = render(
    <MockedProvider mocks={allMocks}>
      <PeriodSummary {...props} />
    </MockedProvider>,
  )
  return {
    ...view,
    rerenderWith: (next: { dateFrom: string; dateTo: string; refreshKey?: number }) =>
      view.rerender(
        <MockedProvider mocks={allMocks}>
          <PeriodSummary {...next} />
        </MockedProvider>,
      ),
  }
}

const field = (label: RegExp | string) => screen.getByLabelText(label)
const type = (label: RegExp | string, value: string) => fireEvent.change(field(label), { target: { value } })

describe('PeriodSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-17T09:00:00Z'))
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows skeletons while loading, then the local fund statement', async () => {
    renderSummary('treasurer', [summaryMock(FROM, TO, { note: 'Opening balance set on 1 Jan 2026' })])
    expect(screen.getByTestId('period-summary-loading')).toBeInTheDocument()

    const statement = await screen.findByTestId('local-fund-statement')
    const rows = within(statement)
    expect(rows.getByText('Balance brought forward').nextSibling).toHaveTextContent('KES 15,000.00')
    expect(rows.getByText('Received').nextSibling).toHaveTextContent('KES 8,000.00')
    expect(rows.getByText('Total').nextSibling).toHaveTextContent('KES 23,000.00')
    expect(rows.getByText('Less payments').nextSibling).toHaveTextContent('KES 3,000.00')
    expect(rows.getByText('Balance at end').nextSibling).toHaveTextContent('KES 20,000.00')
    expect(screen.getByText('Opening balance set on 1 Jan 2026')).toBeInTheDocument()
    expect(screen.getByTestId('local-fund-opening')).toHaveTextContent('KES 12,500.00')
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
  })

  it('shows a dash for a blank balance brought forward and an empty remittances state', async () => {
    renderSummary('treasurer', [summaryMock(FROM, TO, { opening: null, balanceBroughtForward: null })])
    const statement = await screen.findByTestId('local-fund-statement')
    expect(within(statement).getByText('Balance brought forward').nextSibling).toHaveTextContent('—')
    expect(screen.getByText('No remittances')).toBeInTheDocument()
    expect(screen.getByTestId('remittance-total')).toHaveTextContent('KES 0.00')
  })

  it('lists remittances with totals by method', async () => {
    renderSummary('treasurer', [
      summaryMock(FROM, TO, {
        remittances: [remittance(), remittance({ id: '8', method: 'cash', methodLabel: 'Cash', amount: '5000.00', reference: '' })],
        summary: { bankSlip: '45000.00', cash: '5000.00', total: '50000.00' },
      }),
    ])
    const row = await screen.findByTestId('remittance-row-7')
    expect(row).toHaveTextContent('Bank slip')
    expect(row).toHaveTextContent('KES 45,000.00')
    expect(row).toHaveTextContent('SLIP-001')
    expect(row).toHaveTextContent(formatEntryDate('2026-09-14'))
    const totals = within(screen.getByTestId('remittance-totals'))
    expect(totals.getByText('Cash').nextSibling).toHaveTextContent('KES 5,000.00')
    expect(totals.getByText('Bank slip').nextSibling).toHaveTextContent('KES 45,000.00')
    expect(totals.getByText('Cheque').nextSibling).toHaveTextContent('KES 0.00')
    expect(totals.getByText('Money order').nextSibling).toHaveTextContent('KES 0.00')
    expect(screen.getByTestId('remittance-total')).toHaveTextContent('KES 50,000.00')
    expect(screen.getByText(/flags any\s+mismatch/)).toBeInTheDocument()
  })

  it('sets the opening balance from the call to action (negative amounts allowed)', async () => {
    const calls = { count: 0 }
    let hasOpening = false
    let sent: Record<string, unknown> | null = null
    renderSummary('treasurer', [
      summaryMock(FROM, TO, () => ({ opening: hasOpening ? opening({ amount: '-250.50', asOfDate: '2026-08-31' }) : null }), calls),
      mutationMock(SET_LOCAL_FUND_OPENING_BALANCE, (v) => {
        sent = v
        hasOpening = true
      }, {
        setLocalFundOpeningBalance: {
          __typename: 'LocalFundOpeningBalanceResponse',
          success: true,
          message: 'Opening balance saved',
          openingBalance: opening({ amount: '-250.50', asOfDate: '2026-08-31' }),
        },
      }),
    ])

    fireEvent.click(await screen.findByRole('button', { name: 'Set local fund opening balance' }))
    const dialog = await screen.findByRole('dialog')
    type('Amount (KES)', '-250.50')
    type('As of', '2026-09-18')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save opening balance' }))
    expect(await within(dialog).findByText('The as-of date cannot be in the future')).toBeInTheDocument()
    expect(sent).toBeNull()

    type('As of', '2026-08-31')
    type(/Note/, '  Carried over from the paper books ')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save opening balance' }))

    await waitFor(() => expect(sent).toEqual({ amount: '-250.50', asOfDate: '2026-08-31', note: 'Carried over from the paper books' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledWith('Opening balance saved')
    expect(await screen.findByTestId('local-fund-opening')).toHaveTextContent('-250.50')
    expect(calls.count).toBeGreaterThanOrEqual(2)
  })

  it('records a remittance with the card range as the default period', async () => {
    const calls = { count: 0 }
    let sent: Record<string, unknown> | null = null
    renderSummary('treasurer', [
      summaryMock(FROM, TO, {}, calls),
      mutationMock(CREATE_REMITTANCE, (v) => { sent = v }, {
        createRemittance: { __typename: 'RemittanceResponse', success: true, message: 'Remittance recorded', remittance: remittance() },
      }),
    ])

    fireEvent.click(await screen.findByRole('button', { name: /Add remittance/ }))
    const dialog = await screen.findByRole('dialog')
    expect(field('Period from')).toHaveValue(FROM)
    expect(field('Period to')).toHaveValue(TO)
    expect(field('Remitted on')).toHaveValue('2026-09-17')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Record remittance' }))
    expect(await within(dialog).findByText('Choose a method')).toBeInTheDocument()
    expect(within(dialog).getByText('Enter an amount')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Method' }), { target: { value: 'bank_slip' } })
    type('Amount (KES)', '0')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Record remittance' }))
    expect(await within(dialog).findByText('The amount must be greater than 0')).toBeInTheDocument()

    type('Amount (KES)', '45000')
    type('Reference', ' SLIP-001 ')
    type('Remitted on', '2026-09-14')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Record remittance' }))

    await waitFor(() =>
      expect(sent).toEqual({
        periodFrom: FROM,
        periodTo: TO,
        method: 'bank_slip',
        amount: '45000',
        remittedOn: '2026-09-14',
        reference: 'SLIP-001',
        note: '',
      }),
    )
    await waitFor(() => expect(calls.count).toBeGreaterThanOrEqual(2))
  })

  it('edits a remittance', async () => {
    let sent: Record<string, unknown> | null = null
    renderSummary('admin', [
      summaryMock(FROM, TO, { remittances: [remittance()] }),
      mutationMock(UPDATE_REMITTANCE, (v) => { sent = v }, {
        updateRemittance: { __typename: 'RemittanceResponse', success: true, message: 'Remittance updated', remittance: remittance({ method: 'cheque' }) },
      }),
    ])

    fireEvent.click(await screen.findByRole('button', { name: 'Edit remittance SLIP-001' }))
    const dialog = await screen.findByRole('dialog')
    expect(field('Amount (KES)')).toHaveValue('45000.00')
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Method' }), { target: { value: 'cheque' } })
    type('Amount (KES)', '45500.00')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(sent).toEqual({
        id: '7',
        periodFrom: '2026-09-01',
        periodTo: '2026-09-30',
        method: 'cheque',
        amount: '45500.00',
        remittedOn: '2026-09-14',
        reference: 'SLIP-001',
        note: '',
      }),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Remittance updated'))
  })

  it('deletes a remittance only after confirming', async () => {
    let sent: Record<string, unknown> | null = null
    let deleted = false
    renderSummary('treasurer', [
      summaryMock(FROM, TO, () => ({ remittances: deleted ? [] : [remittance()] })),
      mutationMock(DELETE_REMITTANCE, (v) => {
        sent = v
        deleted = true
      }, {
        deleteRemittance: { __typename: 'RemittanceResponse', success: true, message: 'Remittance deleted' },
      }),
    ])

    fireEvent.click(await screen.findByRole('button', { name: 'Delete remittance SLIP-001' }))
    const confirm = await screen.findByRole('alertdialog')
    expect(confirm).toHaveTextContent('Delete this remittance?')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(sent).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete remittance SLIP-001' }))
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete remittance' }))
    await waitFor(() => expect(sent).toEqual({ id: '7' }))
    expect(await screen.findByText('No remittances')).toBeInTheDocument()
  })

  it('is read-only for a pastor', async () => {
    renderSummary('pastor', [summaryMock(FROM, TO, { opening: null, remittances: [remittance()] })])
    await screen.findByTestId('remittance-row-7')
    expect(await screen.findByText(/Read-only/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set local fund opening balance' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add remittance/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit remittance/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete remittance/ })).not.toBeInTheDocument()
    expect(screen.getByText(/The treasurer can set one/)).toBeInTheDocument()
  })

  it('refetches when the range changes and when the card asks for a refresh', async () => {
    const september = { count: 0 }
    const august = { count: 0 }
    const { rerenderWith } = renderSummary('treasurer', [
      summaryMock(FROM, TO, { received: '8000.00' }, september),
      summaryMock('2026-08-01', '2026-08-31', { received: '6100.00' }, august),
    ])
    await screen.findByTestId('local-fund-statement')
    expect(september.count).toBe(1)

    rerenderWith({ dateFrom: '2026-08-01', dateTo: '2026-08-31' })
    await waitFor(() => expect(august.count).toBe(1))
    await waitFor(() =>
      expect(within(screen.getByTestId('local-fund-statement')).getByText('Received').nextSibling).toHaveTextContent('KES 6,100.00'),
    )

    rerenderWith({ dateFrom: '2026-08-01', dateTo: '2026-08-31', refreshKey: 1 })
    await waitFor(() => expect(august.count).toBe(2))
  })
})
