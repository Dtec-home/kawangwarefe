/**
 * Web binding for `treasury/period_summary.feature`.
 *
 * Renders the real CashStatementExportCard (and its PeriodSummary) against
 * Apollo's MockedProvider with the production documents, so query and
 * mutation variables must match what the backend receives.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import type { MockLink } from '@apollo/client/testing'
import { afterEach, expect, vi } from 'vitest'
import React from 'react'

vi.mock('@/components/ui/select', async () => (await import('../../fixtures/treasury-period-summary')).selectMock())
vi.mock('@/lib/download-base64-file', () => ({ downloadBase64File: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { CashStatementExportCard } from '@/components/treasury/cash-statement-export-card'
import { CREATE_REMITTANCE, SET_LOCAL_FUND_OPENING_BALANCE } from '@/lib/graphql/treasury-mutations'
import {
  mutationMock,
  opening,
  remittance,
  roleMock,
  summaryMock,
  type Persona,
  type SummaryOptions,
  type remittance as RemittanceBuilder,
} from '../../fixtures/treasury-period-summary'

const feature = loadFeature('./period_summary.feature', { loadRelativePath: true })

type World = {
  options: SummaryOptions
  remittances: ReturnType<typeof RemittanceBuilder>[]
  requested: Record<string, unknown> | null
}

function newWorld(): World {
  return { options: {}, remittances: [], requested: null }
}

function openCard(world: World, persona: Persona) {
  const current = () => ({ ...world.options, remittances: world.remittances })
  const ranges: Array<[string, string]> = [
    ['2026-09-12', '2026-09-12'],
    ['2026-08-01', '2026-08-31'],
    ['2026-08-01', '2026-09-12'],
  ]
  const mocks: MockLink.MockedResponse[] = [
    roleMock(persona),
    ...ranges.map(([from, to]) => summaryMock(from, to, current)),
    mutationMock(SET_LOCAL_FUND_OPENING_BALANCE, (v) => {
      world.requested = v
      world.options = { ...world.options, opening: opening({ amount: String(v.amount), asOfDate: String(v.asOfDate) }) }
    }, {
      setLocalFundOpeningBalance: {
        __typename: 'LocalFundOpeningBalanceResponse', success: true, message: 'Opening balance saved', openingBalance: null,
      },
    }),
    mutationMock(CREATE_REMITTANCE, (v) => {
      world.requested = v
      world.remittances.push(remittance({ id: '21', method: v.method, methodLabel: 'Cheque', amount: v.amount, reference: v.reference, remittedOn: v.remittedOn, periodFrom: v.periodFrom, periodTo: v.periodTo }))
    }, {
      createRemittance: { __typename: 'RemittanceResponse', success: true, message: 'Remittance recorded', remittance: null },
    }),
  ]
  render(
    <MockedProvider mocks={mocks}>
      <CashStatementExportCard />
    </MockedProvider>,
  )
}

const pick = (group: string, option: string) =>
  fireEvent.click(within(screen.getByRole('group', { name: group })).getByRole('button', { name: option }))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

defineFeature(feature, (test) => {
  const background = (given: (m: RegExp, fn: (d: string) => void) => void) =>
    given(/^today is \w+ (\d{4}-\d{2}-\d{2}) in Nairobi$/, (date: string) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(`${date}T10:00:00+03:00`))
    })

  const onCard = (step: (m: RegExp, fn: (p: string) => void) => void, world: World) =>
    step(/^the (treasurer|pastor) is on the Cash Statement export card$/, (persona: string) =>
      openCard(world, persona as Persona),
    )

  const choosesRange = (step: (m: RegExp, fn: (f: string, t: string) => void) => void) =>
    step(/^the treasurer chooses the range (\S+) to (\S+)$/, (from: string, to: string) => {
      pick('Period', 'Date range')
      fireEvent.change(screen.getByLabelText('From'), { target: { value: from } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: to } })
    })

  const opensSummary = (step: (m: RegExp, fn: () => Promise<void>) => void) =>
    step(/^the (?:treasurer|pastor) opens the period summary$/, async () => {
      fireEvent.click(screen.getByRole('button', { name: /Period summary/ }))
      await screen.findByTestId('period-summary')
    })

  const noOpening = (step: (m: string, fn: () => void) => void, world: World) =>
    step('no local fund opening balance has been set', () => {
      world.options = { ...world.options, opening: null, balanceBroughtForward: null }
    })

  test('Treasurer reviews the local church funds for a month', ({ given, and, when, then }) => {
    const world = newWorld()
    background(given)
    onCard(given, world)
    and(/^the local fund received (\S+) and paid out (\S+) in August 2026 with (\S+) brought forward$/, (received: string, paid: string, bf: string) => {
      const end = (Number(bf) + Number(received) - Number(paid)).toFixed(2)
      world.options = { received, lessPayment: paid, balanceBroughtForward: bf, total: (Number(bf) + Number(received)).toFixed(2), balanceEnd: end }
    })
    choosesRange(when)
    opensSummary(and)
    then(/^the local fund statement shows "(.+)" of "(.+)"$/, async (label: string, value: string) => {
      const statement = await screen.findByTestId('local-fund-statement')
      await waitFor(() => expect(within(statement).getByText(label).nextSibling).toHaveTextContent(value))
    })
  })

  test('Treasurer sets the missing local fund opening balance', ({ given, and, when, then }) => {
    const world = newWorld()
    background(given)
    noOpening(given, world)
    onCard(and, world)
    opensSummary(when)
    and(/^the treasurer sets the opening balance to "(.+)" as of (\S+)$/, async (amount: string, date: string) => {
      fireEvent.click(await screen.findByRole('button', { name: 'Set local fund opening balance' }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Amount (KES)'), { target: { value: amount } })
      fireEvent.change(within(dialog).getByLabelText('As of'), { target: { value: date } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save opening balance' }))
    })
    then(/^setLocalFundOpeningBalance is requested with amount "(.+)" as of (\S+)$/, async (amount: string, date: string) => {
      await waitFor(() => expect(world.requested).toEqual({ amount, asOfDate: date, note: '' }))
    })
    and(/^the card shows the opening balance "(.+)"$/, async (text: string) => {
      expect(await screen.findByTestId('local-fund-opening')).toHaveTextContent(text)
    })
  })

  test('Treasurer records a remittance for the month', ({ given, when, and, then }) => {
    const world = newWorld()
    background(given)
    onCard(given, world)
    choosesRange(when)
    opensSummary(and)
    and(/^the treasurer records a "(.+)" remittance of "(.+)" referenced "(.+)" remitted on (\S+)$/, async (method: string, amount: string, reference: string, remittedOn: string) => {
      fireEvent.click(await screen.findByRole('button', { name: /Add remittance/ }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByRole('combobox', { name: 'Method' }), { target: { value: method } })
      fireEvent.change(within(dialog).getByLabelText('Amount (KES)'), { target: { value: amount } })
      fireEvent.change(within(dialog).getByLabelText('Reference'), { target: { value: reference } })
      fireEvent.change(within(dialog).getByLabelText('Remitted on'), { target: { value: remittedOn } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Record remittance' }))
    })
    then(/^createRemittance is requested for (\S+) to (\S+) with method "(.+)" and amount "(.+)"$/, async (from: string, to: string, method: string, amount: string) => {
      await waitFor(() => expect(world.requested).toMatchObject({ periodFrom: from, periodTo: to, method, amount }))
    })
    and(/^the remittances table lists "(.+)"$/, async (reference: string) => {
      expect(await screen.findByTestId('remittance-row-21')).toHaveTextContent(reference)
    })
  })

  test('Pastor sees the period summary read-only', ({ given, and, when, then }) => {
    const world = newWorld()
    background(given)
    noOpening(given, world)
    onCard(and, world)
    opensSummary(when)
    then('the pastor cannot set the opening balance or add a remittance', async () => {
      expect(await screen.findByText(/Read-only/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Set local fund opening balance' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Add remittance/ })).not.toBeInTheDocument()
    })
  })
})
