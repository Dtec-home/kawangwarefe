/**
 * Binding for `fundraising/closeout_ui.feature` (Fundraising S4, lane S4-UI-H, ticket 4.9).
 *
 * Drives the real Close out tab through Apollo's MockedProvider with the app's
 * real GraphQL documents. The mocked server keeps the campaign in
 * `world.campaign`, so a close shows up on the refetch.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { GraphQLError } from 'graphql'
import React from 'react'
import { vi } from 'vitest'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import {
  CAMPAIGN_FINAL_STATEMENT,
  CLOSE_CAMPAIGN,
  CLOSEOUT_CAMPAIGN,
  type CloseoutCampaign,
} from '@/lib/graphql/fundraising/closeout'
import type { CampaignStatement, CampaignStatus } from '@/lib/types/fundraising'
import { formatNairobiDateTime } from '@/lib/receipts/format'
import { CloseoutTab } from '@/components/campaigns/admin/closeout/closeout-tab'

const feature = loadFeature('./closeout_ui.feature', { loadRelativePath: true })

interface World {
  campaign: CloseoutCampaign
  statement: Pick<CampaignStatement, 'campaignId' | 'totalIn' | 'totalOut' | 'balance'>
  statementRefusal: string | null
  refusal: string | null
  closeCalls: string[]
}

function campaign(overrides: Partial<CloseoutCampaign>): CloseoutCampaign {
  return {
    id: '9',
    title: 'Campaign',
    status: 'ACTIVE',
    categoryId: '4',
    categoryName: 'Building Fund',
    paybillCode: 'CODE',
    closedAt: null,
    ...overrides,
  }
}

const typed = (c: CloseoutCampaign) => ({ __typename: 'CampaignType', ...c })

function openTab(world: World) {
  const mocks: MockedResponse[] = [
    {
      request: { query: CLOSEOUT_CAMPAIGN, variables: { id: '9' } },
      result: () => ({ data: { campaign: typed(world.campaign) } }),
      maxUsageCount: 10,
    },
    {
      request: { query: CAMPAIGN_FINAL_STATEMENT, variables: { campaignId: '9' } },
      result: () =>
        world.statementRefusal
          ? { errors: [new GraphQLError(world.statementRefusal)] }
          : { data: { campaignStatement: { __typename: 'CampaignStatementType', ...world.statement } } },
      maxUsageCount: 10,
    },
    {
      request: {
        query: CLOSE_CAMPAIGN,
        variables: (vars: { id: string }) => {
          world.closeCalls.push(vars.id)
          return true
        },
      },
      result: () => {
        if (world.refusal) {
          return { data: { closeCampaign: { __typename: 'CampaignResponse', success: false, message: world.refusal, campaign: null } } }
        }
        world.campaign = { ...world.campaign, status: 'CLOSED', closedAt: '2026-10-21T10:00:00+03:00' }
        return {
          data: {
            closeCampaign: { __typename: 'CampaignResponse', success: true, message: 'Campaign closed', campaign: typed(world.campaign) },
          },
        }
      },
      maxUsageCount: 5,
    },
  ]
  render(
    <MockedProvider mocks={mocks}>
      <CloseoutTab campaignId="9" />
    </MockedProvider>
  )
}

async function clickWhenEnabled(name: string | RegExp, container: HTMLElement = document.body) {
  await waitFor(() => expect(within(container).getByRole('button', { name })).toBeEnabled())
  fireEvent.click(within(container).getByRole('button', { name }))
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    world = {
      campaign: campaign({}),
      statement: { campaignId: '9', totalIn: '0.00', totalOut: '0.00', balance: '0.00' },
      statementRefusal: null,
      refusal: null,
      closeCalls: [],
    }
  })

  type Step = (m: RegExp | string, fn: (...args: string[]) => unknown) => void

  const givenCampaign = (step: Step) =>
    step(/^an? (active|paused|draft) campaign "(.*)" with Pay Bill code "(.*)" in the "(.*)"$/, (status, title, code, fund) => {
      world.campaign = campaign({ status: status.toUpperCase() as CampaignStatus, title, paybillCode: code, categoryName: fund })
    })

  const givenClosed = (step: Step) =>
    step(/^a campaign "(.*)" in the "(.*)" closed on "(.*)"$/, (title, fund, on) => {
      world.campaign = campaign({ status: 'CLOSED', title, categoryName: fund, closedAt: `${on}T12:00:00+03:00` })
    })

  const givenStatement = (step: Step) =>
    step(/^the final statement will show (\S+) in, (\S+) out and (\S+) left$/, (totalIn, totalOut, balance) => {
      world.statement = { campaignId: '9', totalIn, totalOut, balance }
    })

  const whenOpen = (step: Step) => step('they open the close-out tab', () => openTab(world))

  const statusShows = (step: Step) =>
    step(/^the campaign status shows "(.*)"$/, async (label) => {
      await waitFor(() => expect(screen.getByTestId('closeout-status')).toHaveTextContent(label))
    })

  const chooseClose = (step: Step) =>
    step('they choose to close the campaign', () => clickWhenEnabled('Close campaign'))

  const confirmClose = (step: Step) =>
    step('they confirm closing the campaign', async () => {
      await clickWhenEnabled('Close campaign', await screen.findByRole('alertdialog'))
    })

  const cannotClose = (step: Step) =>
    step('they cannot close the campaign', async () => {
      await screen.findByTestId('closeout-status')
      expect(screen.queryByRole('button', { name: 'Close campaign' })).not.toBeInTheDocument()
    })

  const statementShows = (step: Step) =>
    step(/^the final statement shows "(.*)" in, "(.*)" out and "(.*)" left$/, async (moneyIn, moneyOut, left) => {
      const summary = await screen.findByRole('region', { name: 'Final statement' })
      await waitFor(() => expect(within(summary).getByTestId('statement-in')).toHaveTextContent(moneyIn))
      expect(within(summary).getByTestId('statement-out')).toHaveTextContent(moneyOut)
      expect(within(summary).getByTestId('statement-balance')).toHaveTextContent(left)
    })

  const seeMessage = (step: Step) =>
    step(/^they see the message "(.*)"$/, async (message) => {
      await waitFor(() => expect(screen.getAllByRole('alert').some((el) => el.textContent?.includes(message))).toBe(true))
    })

  const seeText = (step: Step) =>
    step(/^they see "(.*)"$/, async (text) => {
      expect(await screen.findByText(text)).toBeInTheDocument()
    })

  test('Staff close an active campaign after confirming', ({ given, and, when, then }) => {
    givenCampaign(given)
    givenStatement(and)
    whenOpen(when)
    statusShows(then)
    chooseClose(when)
    then(/^they are warned "(.*)"$/, async (text) => {
      expect(within(await screen.findByRole('alertdialog')).getByText(text)).toBeInTheDocument()
    })
    and(/^they are warned the campaign stops taking gifts and "(.*)" returns to normal department matching$/, (code) => {
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveTextContent(/stops taking gifts/)
      expect(dialog).toHaveTextContent(new RegExp(`${code}.*normal department matching`))
    })
    confirmClose(when)
    then('the campaign is closed', async () => {
      await waitFor(() => expect(world.closeCalls).toEqual(['9']))
    })
    and(/^they are told "(.*)"$/, async (message) => {
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(message))
    })
    statusShows(and)
    statementShows(and)
  })

  test('A paused campaign can be closed too', ({ given, when, then, and }) => {
    givenCampaign(given)
    whenOpen(when)
    statusShows(then)
    and('they can close the campaign', async () => {
      await waitFor(() => expect(screen.getByRole('button', { name: 'Close campaign' })).toBeEnabled())
    })
  })

  test('Staff change their mind', ({ given, when, and, then }) => {
    givenCampaign(given)
    whenOpen(when)
    chooseClose(and)
    and('they cancel', async () => {
      await clickWhenEnabled('Cancel', await screen.findByRole('alertdialog'))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    })
    then('the campaign is not closed', () => {
      expect(world.closeCalls).toEqual([])
    })
    statusShows(and)
  })

  test('The server refuses to close the campaign', ({ given, and, when, then }) => {
    givenCampaign(given)
    and(/^the server will refuse with "(.*)"$/, (message) => {
      world.refusal = message
    })
    whenOpen(when)
    chooseClose(and)
    confirmClose(and)
    seeMessage(then)
    statusShows(and)
  })

  test('A closed campaign shows when it closed and its final statement', ({ given, and, when, then }) => {
    givenClosed(given)
    givenStatement(and)
    whenOpen(when)
    statusShows(then)
    and(/^they see it was closed on "(.*)"$/, async (on) => {
      const expected = formatNairobiDateTime(`${on}T12:00:00+03:00`)
      expect(await screen.findByText(new RegExp(`Closed on ${expected}`))).toBeInTheDocument()
    })
    cannotClose(and)
    statementShows(and)
    seeText(and)
  })

  test('The final statement is refused', ({ given, and, when, then }) => {
    givenClosed(given)
    and(/^the statement will be refused with "(.*)"$/, (message) => {
      world.statementRefusal = message
    })
    whenOpen(when)
    seeMessage(then)
  })

  test('A draft campaign cannot be closed yet', ({ given, when, then, and }) => {
    givenCampaign(given)
    whenOpen(when)
    statusShows(then)
    cannotClose(and)
    seeText(and)
  })
})
