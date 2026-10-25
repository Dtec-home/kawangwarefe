/**
 * Web binding for `treasury/cash_statement_export.feature`.
 *
 * Renders the real CashStatementExportCard against Apollo's MockedProvider
 * with the production GENERATE_CASH_STATEMENT document, so the variables
 * must match exactly what the backend mutation receives.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { afterEach, expect, vi } from 'vitest'
import React from 'react'

import { GENERATE_CASH_STATEMENT } from '@/lib/graphql/treasury-mutations'

const { mockDownload } = vi.hoisted(() => ({ mockDownload: vi.fn() }))
vi.mock('@/lib/download-base64-file', () => ({ downloadBase64File: mockDownload }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { CashStatementExportCard } from '@/components/treasury/cash-statement-export-card'

const feature = loadFeature('./cash_statement_export.feature', { loadRelativePath: true })

type Ctx = { requested: Record<string, string> | null }

const FILENAMES: Record<string, string> = {
  pdf: 'Cash_Statement_2026-09-12.pdf',
  excel: 'Cash_Statement_2026-08-01_to_2026-08-31.xlsx',
}

function mockFor(ctx: Ctx, variables: Record<string, string>) {
  return {
    request: { query: GENERATE_CASH_STATEMENT, variables },
    result: () => {
      ctx.requested = variables
      return {
        data: {
          generateCashStatement: {
            success: true,
            message: 'Cash statement generated successfully',
            fileData: 'AAAA',
            filename: FILENAMES[variables.format],
            contentType: variables.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        },
      }
    },
  }
}

function renderCard(ctx: Ctx) {
  const mocks = [
    mockFor(ctx, { dateFrom: '2026-09-12', dateTo: '2026-09-12', format: 'pdf', paper: 'letter' }),
    mockFor(ctx, { dateFrom: '2026-08-01', dateTo: '2026-08-31', format: 'excel', paper: 'a4' }),
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
  vi.useRealTimers()
  mockDownload.mockReset()
})

defineFeature(feature, (test) => {
  const givenToday = (given: (m: RegExp, fn: (d: string) => void) => void) =>
    given(/^today is \w+ (\d{4}-\d{2}-\d{2}) in Nairobi$/, (date: string) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(`${date}T10:00:00+03:00`))
    })

  const onCard = (and: (s: string, fn: () => void) => void, ctx: Ctx) =>
    and('the treasurer is on the Cash Statement export card', () => renderCard(ctx))

  const generates = (whenOrAnd: (m: RegExp, fn: (f: string, p: string) => void) => void) =>
    whenOrAnd(/^the treasurer generates the statement as (PDF|Excel) on (Letter|A4) paper$/, (format: string, paper: string) => {
      pick('Format', format)
      pick('Paper', paper)
      fireEvent.click(screen.getByRole('button', { name: /Generate Cash Statement/i }))
    })

  const requested = (then: (m: RegExp, fn: (a: string, b: string) => Promise<void>) => void, ctx: Ctx) =>
    then(/^generateCashStatement is requested for (\S+) to (\S+)$/, async (from: string, to: string) => {
      await waitFor(() => expect(ctx.requested).not.toBeNull())
      expect(ctx.requested).toMatchObject({ dateFrom: from, dateTo: to })
    })

  const downloaded = (and: (m: RegExp, fn: (f: string) => Promise<void>) => void) =>
    and(/^the file "(.+)" is downloaded$/, async (filename: string) => {
      await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(1))
      expect(mockDownload.mock.calls[0][1]).toBe(filename)
    })

  test('Treasurer exports Sabbath cash statement', ({ given, and, then, when }) => {
    const ctx: Ctx = { requested: null }
    givenToday(given)
    onCard(and, ctx)
    then(/^the statement date defaults to Saturday (\S+)$/, (date: string) => {
      expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe(date)
    })
    generates(when)
    requested(then, ctx)
    downloaded(and)
  })

  test('Treasurer exports a month as Excel on A4', ({ given, and, when, then }) => {
    const ctx: Ctx = { requested: null }
    givenToday(given)
    onCard(and, ctx)
    when(/^the treasurer chooses the range (\S+) to (\S+)$/, (from: string, to: string) => {
      pick('Period', 'Date range')
      fireEvent.change(screen.getByLabelText('From'), { target: { value: from } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: to } })
    })
    generates(and)
    requested(then, ctx)
    downloaded(and)
  })

  test('A range longer than 366 days is refused before export', ({ given, and, when, then }) => {
    const ctx: Ctx = { requested: null }
    givenToday(given)
    onCard(and, ctx)
    when(/^the treasurer chooses the range (\S+) to (\S+)$/, (from: string, to: string) => {
      pick('Period', 'Date range')
      fireEvent.change(screen.getByLabelText('From'), { target: { value: from } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: to } })
    })
    then(/^the card shows "(.+)"$/, (message: string) => {
      expect(screen.getByRole('alert')).toHaveTextContent(message)
    })
    and('the statement cannot be generated', () => {
      expect(screen.getByRole('button', { name: /Generate Cash Statement/i })).toBeDisabled()
      expect(ctx.requested).toBeNull()
    })
  })
})
