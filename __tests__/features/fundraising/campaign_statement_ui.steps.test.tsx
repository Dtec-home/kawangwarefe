/**
 * Binding for `fundraising/campaign_statement_ui.feature` (Fundraising S4, lane S4-UI-G).
 *
 * Drives the real Statement tab through Apollo's MockedProvider with the
 * app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { toastMock, downloadMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
  downloadMock: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/download-base64-file', () => ({ downloadBase64File: downloadMock }))

import { GET_CAMPAIGN } from '@/lib/graphql/fundraising/campaigns'
import {
  EXPORT_CAMPAIGN_STATEMENT,
  GET_CAMPAIGN_STATEMENT,
  type CampaignStatementVars,
  type ExportCampaignStatementVars,
} from '@/lib/graphql/fundraising/statement'
import type { StatementRow } from '@/lib/types/fundraising'
import { StatementTab } from '@/components/campaigns/admin/statement/statement-tab'
import { campaign, progress } from '../../components/campaigns/s1_ui_a/fixtures'

const feature = loadFeature('./campaign_statement_ui.feature', { loadRelativePath: true })

interface World {
  campaign: ReturnType<typeof campaign>
  rows: StatementRow[]
  loadError: boolean
  exportRefusal: string | null
  asked: CampaignStatementVars[]
  exported: ExportCampaignStatementVars | null
}

type Table = Record<string, string>[]

function toRows(table: Table): StatementRow[] {
  return table.map((r) => ({
    on: r.on,
    description: r.description,
    channel: r.channel,
    moneyIn: r.in,
    moneyOut: r.out,
    balance: r.balance,
  }))
}

function statementFor(world: World, vars: CampaignStatementVars) {
  const totalIn = world.rows.reduce((s, r) => s + Number(r.moneyIn), 0)
  const totalOut = world.rows.reduce((s, r) => s + Number(r.moneyOut), 0)
  return {
    __typename: 'CampaignStatementType',
    campaignId: vars.campaignId,
    dateFrom: vars.dateFrom,
    dateTo: vars.dateTo,
    rows: world.rows.map((r) => ({ __typename: 'StatementRowType', ...r })),
    totalIn: totalIn.toFixed(2),
    totalOut: totalOut.toFixed(2),
    balance: (totalIn - totalOut).toFixed(2),
  }
}

function mocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: GET_CAMPAIGN, variables: { id: '9' } },
      result: () => ({ data: { campaign: world.campaign } }),
      maxUsageCount: 20,
    },
    world.loadError
      ? { request: { query: GET_CAMPAIGN_STATEMENT, variables: () => true }, error: new Error('Server unavailable') }
      : {
          request: {
            query: GET_CAMPAIGN_STATEMENT,
            variables: (vars: CampaignStatementVars) => {
              world.asked.push(vars)
              return vars.campaignId === '9'
            },
          },
          result: (vars: CampaignStatementVars) => ({ data: { campaignStatement: statementFor(world, vars) } }),
          maxUsageCount: 50,
        },
    {
      request: {
        query: EXPORT_CAMPAIGN_STATEMENT,
        variables: (vars: ExportCampaignStatementVars) => {
          world.exported = vars
          return true
        },
      },
      result: (vars: ExportCampaignStatementVars) => ({
        data: {
          exportCampaignStatement: world.exportRefusal
            ? {
                __typename: 'ReportResponse',
                success: false,
                message: world.exportRefusal,
                fileData: null,
                filename: null,
                contentType: null,
              }
            : {
                __typename: 'ReportResponse',
                success: true,
                message: 'Statement exported',
                fileData: 'UEsDBA==',
                filename: `church-building-statement.${vars.format === 'pdf' ? 'pdf' : 'xlsx'}`,
                contentType: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel',
              },
        },
      }),
      maxUsageCount: 5,
    },
  ]
}

function openTab(world: World) {
  render(
    <MockedProvider mocks={mocks(world)}>
      <StatementTab campaignId="9" />
    </MockedProvider>
  )
}

async function choose(name: string) {
  // A button can appear while the previous action is still settling (and so
  // disabled); a click on it then would be silently ignored.
  await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name }))
}

async function lineFor(description: string) {
  const table = await screen.findByTestId('statement-table')
  const cell = await within(table).findByText(description)
  return cell.closest('tr') as HTMLElement
}

async function toldThat(message: string) {
  await waitFor(() => {
    const toasted = [...toastMock.success.mock.calls, ...toastMock.error.mock.calls].flat()
    expect(toasted.includes(message) || screen.queryAllByText(message).length > 0).toBe(true)
  })
}

async function chooseRange(from: string, to: string) {
  await choose('Date range')
  fireEvent.change(await screen.findByLabelText('From'), { target: { value: from } })
  fireEvent.change(screen.getByLabelText('To'), { target: { value: to } })
}

function lastAsked(world: World) {
  return world.asked[world.asked.length - 1]
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    world = {
      campaign: campaign(),
      rows: [],
      loadError: false,
      exportRefusal: null,
      asked: [],
      exported: null,
    }
  })

  const background = (given: (m: RegExp, fn: (...args: string[]) => void) => void) => {
    given(/^the campaign "(.*)" has pledges of "(.*)" and has received "(.*)"$/, (title, pledged, raised) => {
      world.campaign = campaign({ title, progress: progress(raised, '1000000.00', pledged) })
    })
  }
  const givenLines = (given: (m: RegExp, fn: (table: Table) => void) => void) => {
    given(/^the statement has these lines$/, (table: Table) => {
      world.rows = toRows(table)
    })
  }
  const whenOpen = (when: (m: RegExp, fn: () => void) => void) => {
    when(/^they open the Statement tab$/, () => openTab(world))
  }

  test('Staff see money in, money out and the balance', ({ given, when, then, and }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    then(/^the summary shows "(.*)" in, "(.*)" out and a balance of "(.*)"$/, async (moneyIn, moneyOut, balance) => {
      const summary = await screen.findByTestId('statement-summary')
      expect(summary).toHaveTextContent(`Money in${moneyIn}`)
      expect(summary).toHaveTextContent(`Money out${moneyOut}`)
      expect(summary).toHaveTextContent(`Balance${balance}`)
    })
    and(/^the line "(.*)" shows "(.*)" with "(.*)" out and a balance of "(.*)"$/, async (desc, channel, out, balance) => {
      const cells = within(await lineFor(desc)).getAllByRole('cell').map((c) => c.textContent)
      expect(cells).toEqual(expect.arrayContaining([channel, '—', out, balance]))
      expect(cells[4]).toBe(out)
      expect(cells[5]).toBe(balance)
    })
    and(/^the line "(.*)" shows "(.*)" with "(.*)" in and a balance of "(.*)"$/, async (desc, channel, moneyIn, balance) => {
      const cells = within(await lineFor(desc)).getAllByRole('cell').map((c) => c.textContent)
      expect(cells[2]).toBe(channel)
      expect(cells[3]).toBe(moneyIn)
      expect(cells[5]).toBe(balance)
    })
    and(/^the totals row shows "(.*)" in, "(.*)" out and "(.*)"$/, (moneyIn, moneyOut, balance) => {
      const cells = within(screen.getByTestId('statement-totals')).getAllByRole('cell').map((c) => c.textContent)
      expect(cells).toEqual(['Totals', '', moneyIn, moneyOut, balance])
    })
    and(/^the statement covers "(.*)"$/, (label) => {
      expect(screen.getByTestId('statement-period')).toHaveTextContent(label)
      expect(lastAsked(world)).toEqual({ campaignId: '9', dateFrom: null, dateTo: null })
    })
  })

  test('Staff compare what was pledged with what was received', ({ given, when, then }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    then(/^they see "(.*)" pledged and "(.*)" received, "(.*)" of pledges$/, async (pledged, received, percent) => {
      const meter = await screen.findByTestId('statement-pledges')
      expect(meter).toHaveTextContent(`${received} received of ${pledged} pledged · ${percent} of pledges`)
      expect(within(meter).getByRole('progressbar')).toBeInTheDocument()
    })
  })

  test('The charts can also be read as tables', ({ given, when, then, and }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    then(/^there is a chart titled "(.*)"$/, async (title) => {
      expect(await screen.findByRole('figure', { name: title })).toBeInTheDocument()
    })
    and(/^there is a chart titled "(.*)"$/, async (title) => {
      expect(await screen.findByRole('figure', { name: title })).toBeInTheDocument()
    })
    when(/^they show the "(.*)" chart as a table$/, (title) => {
      const figure = screen.getByRole('figure', { name: title })
      fireEvent.click(within(figure).getByRole('button', { name: 'Show as table' }))
    })
    then(/^that table lists "(.*)" with "(.*)" and "(.*)" with "(.*)"$/, (a, aAmount, b, bAmount) => {
      const figure = screen.getByRole('figure', { name: 'Money in by channel' })
      const rows = within(figure)
        .getAllByRole('row')
        .slice(1)
        .map((r) => within(r).getAllByRole('cell').map((c) => c.textContent))
      expect(rows).toEqual([
        [a, aAmount],
        [b, bAmount],
      ])
    })
  })

  test('Staff narrow the statement to a period', ({ given, when, then }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    when(/^they choose a date range from "(.*)" to "(.*)"$/, async (from, to) => {
      await screen.findByTestId('statement-table')
      await chooseRange(from, to)
    })
    then(/^the statement is asked for "(.*)" to "(.*)"$/, async (from, to) => {
      await waitFor(() => expect(lastAsked(world)).toEqual({ campaignId: '9', dateFrom: from, dateTo: to }))
      expect(screen.getByTestId('statement-period')).toHaveTextContent('1 Nov 2026 – 30 Nov 2026')
    })
    when(/^they choose "(.*)"$/, (name) => choose(name))
    then(/^the statement is asked for all time$/, async () => {
      await waitFor(() => expect(screen.getByTestId('statement-period')).toHaveTextContent('All time'))
      expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
      // All time is served from the cache, so the table is the one asked for first.
      expect(world.asked[0]).toEqual({ campaignId: '9', dateFrom: null, dateTo: null })
      expect(await screen.findByTestId('statement-table')).toBeInTheDocument()
    })
  })

  test('A period that ends before it starts is refused', ({ given, when, then, and }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    when(/^they choose a date range from "(.*)" to "(.*)"$/, async (from, to) => {
      await screen.findByTestId('statement-table')
      await chooseRange(from, to)
    })
    then(/^they see "(.*)"$/, async (message) => {
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(world.asked.some((v) => v.dateFrom === '2026-11-30' && v.dateTo === '2026-11-01')).toBe(false)
    })
    and(/^the export buttons are disabled$/, () => {
      expect(screen.getByRole('button', { name: 'Export Excel' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled()
    })
  })

  test('A campaign with no money yet says so', ({ given, when, then }) => {
    background(given)
    given(/^the statement has no lines$/, () => {
      world.rows = []
    })
    whenOpen(when)
    then(/^they are told no money has come in or gone out yet$/, async () => {
      expect(await screen.findByText('No money yet')).toBeInTheDocument()
      expect(screen.getByText('Nothing has come in or gone out for this campaign yet.')).toBeInTheDocument()
      expect(screen.queryByTestId('statement-table')).not.toBeInTheDocument()
    })
  })

  test('The tab explains when the statement cannot load', ({ given, when, then }) => {
    background(given)
    given(/^the statement cannot be loaded$/, () => {
      world.loadError = true
    })
    whenOpen(when)
    then(/^they see "(.*)"$/, async (message) => {
      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })
  })

  test('Staff export the statement to Excel', ({ given, when, then, and }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    when(/^they choose "(.*)"$/, async (name) => {
      await screen.findByTestId('statement-table')
      await choose(name)
    })
    then(/^the file "(.*)" is downloaded$/, async (filename) => {
      await waitFor(() => expect(downloadMock).toHaveBeenCalledWith('UEsDBA==', filename, expect.any(String)))
    })
    and(/^the export was for "(.*)" over all time$/, (format) => {
      expect(world.exported).toEqual({ campaignId: '9', format, dateFrom: null, dateTo: null })
    })
    and(/^they are told "(.*)"$/, (message) => toldThat(message))
  })

  test('Staff export a period to PDF', ({ given, when, then, and }) => {
    background(given)
    givenLines(given)
    whenOpen(when)
    when(/^they choose a date range from "(.*)" to "(.*)"$/, async (from, to) => {
      await screen.findByTestId('statement-table')
      await chooseRange(from, to)
    })
    and(/^they choose "(.*)"$/, (name) => choose(name))
    then(/^the file "(.*)" is downloaded$/, async (filename) => {
      await waitFor(() => expect(downloadMock).toHaveBeenCalledWith('UEsDBA==', filename, 'application/pdf'))
    })
    and(/^the export was for "(.*)" from "(.*)" to "(.*)"$/, (format, from, to) => {
      expect(world.exported).toEqual({ campaignId: '9', format, dateFrom: from, dateTo: to })
    })
  })

  test('A refused export is explained', ({ given, when, then, and }) => {
    background(given)
    givenLines(given)
    and(/^exporting is refused with "(.*)"$/, (message) => {
      world.exportRefusal = message
    })
    whenOpen(when)
    when(/^they choose "(.*)"$/, async (name) => {
      await screen.findByTestId('statement-table')
      await choose(name)
    })
    then(/^they are told "(.*)"$/, async (message) => {
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(message))
    })
    and(/^no file is downloaded$/, () => {
      expect(downloadMock).not.toHaveBeenCalled()
    })
  })
})
