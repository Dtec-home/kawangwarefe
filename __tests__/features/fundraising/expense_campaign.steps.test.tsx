/**
 * Binding for `fundraising/expense_campaign.feature` (Fundraising S4, lane S4-UI-H, ticket 4.8).
 *
 * Drives the real ExpenseCampaignSelect (as the expense dialogs host it: the
 * host keeps the campaign id, "" for none) through Apollo's MockedProvider with
 * the app's real GraphQL document. Radix Select is swapped for a native select
 * so options can be read and chosen in jsdom.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { GraphQLError } from 'graphql'
import React, { useState } from 'react'
import { vi } from 'vitest'

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select aria-label="Charge to campaign" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, disabled, children }: { value: string; disabled?: boolean; children: React.ReactNode }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}))

import { EXPENSE_CAMPAIGN_OPTIONS, type ExpenseCampaignOption } from '@/lib/graphql/fundraising/closeout'
import type { CampaignStatus } from '@/lib/types/fundraising'
import { ExpenseCampaignSelect } from '@/components/campaigns/expense-select/expense-campaign-select'

const feature = loadFeature('./expense_campaign.feature', { loadRelativePath: true })

const FUNDS: Record<string, string> = { 'Building Fund': '4', 'Youth Fund': '5', 'Welfare Fund': '6' }

interface World {
  campaigns: ExpenseCampaignOption[]
  refused: boolean
  chosen: string | undefined
}

function addCampaign(world: World, fund: string, title: string, status: string) {
  world.campaigns.push({
    id: String(world.campaigns.length + 40),
    title,
    status: status.toUpperCase() as CampaignStatus,
    categoryId: FUNDS[fund],
    paybillCode: title.replace(/\W/g, '').slice(0, 6).toUpperCase(),
  })
}

function Host({ categoryId, initial, onChosen }: { categoryId: string; initial: string; onChosen: (id: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <ExpenseCampaignSelect
      categoryId={categoryId}
      value={value}
      onChange={(id) => {
        setValue(id)
        onChosen(id)
      }}
    />
  )
}

function mount(world: World, categoryId: string, initial = '') {
  const mocks: MockedResponse[] = [
    {
      request: { query: EXPENSE_CAMPAIGN_OPTIONS },
      result: () =>
        world.refused
          ? { errors: [new GraphQLError('You do not have permission to view campaigns')] }
          : { data: { campaigns: world.campaigns.map((c) => ({ __typename: 'CampaignType', ...c })) } },
      maxUsageCount: 5,
    },
  ]
  render(
    <MockedProvider mocks={mocks}>
      <Host categoryId={categoryId} initial={initial} onChosen={(id) => (world.chosen = id)} />
    </MockedProvider>
  )
}

function campaignId(world: World, title: string): string {
  return world.campaigns.find((c) => c.title === title)!.id
}

async function select(): Promise<HTMLSelectElement> {
  return (await screen.findByRole('combobox', { name: 'Charge to campaign' })) as HTMLSelectElement
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    world = { campaigns: [], refused: false, chosen: undefined }
  })

  type Step = (m: RegExp | string, fn: (...args: string[]) => unknown) => void

  const givenTwo = (step: Step) =>
    step(/^the "(.*)" has campaigns "(.*)" \((\w+)\) and "(.*)" \((\w+)\)$/, (fund, a, sa, b, sb) => {
      addCampaign(world, fund, a, sa)
      addCampaign(world, fund, b, sb)
    })

  const givenOne = (step: Step) =>
    step(/^the "(.*)" has a campaign "(.*)" \((\w+)\)$/, (fund, title, status) => addCampaign(world, fund, title, status))

  const chooseFund = (step: Step) =>
    step(/^staff choose the "(.*)" for the expense$/, (fund) => mount(world, FUNDS[fund]))

  const editCharged = (step: Step) =>
    step(/^staff edit a "(.*)" expense charged to "(.*)"$/, (fund, title) =>
      mount(world, FUNDS[fund], campaignId(world, title))
    )

  const chargeTo = (step: Step) =>
    step(/^they charge it to "(.*)"$/, async (label) => {
      const el = await select()
      await waitFor(() => expect(screen.getByRole('option', { name: label })).toBeInTheDocument())
      const option = screen.getByRole('option', { name: label }) as HTMLOptionElement
      fireEvent.change(el, { target: { value: option.value } })
    })

  const nothingShown = (step: Step) =>
    step('no campaign choice is shown', async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      expect(screen.queryByText('Charge to campaign')).not.toBeInTheDocument()
    })

  test('Staff see the campaigns of the chosen fund with their status', ({ given, and, when, then }) => {
    givenTwo(given)
    givenOne(and)
    chooseFund(when)
    then(/^they can charge it to (.*)$/, async (labels) => {
      const expected = labels.split(',').map((t) => t.trim().replace(/^"|"$/g, ''))
      const el = await select()
      await waitFor(() => expect(Array.from(el.options).map((o) => o.textContent)).toEqual(expected))
    })
  })

  test('Staff charge the expense to a campaign', ({ given, when, and, then }) => {
    givenTwo(given)
    chooseFund(when)
    chargeTo(and)
    then(/^the expense is charged to campaign "(.*)"$/, (title) => {
      expect(world.chosen).toBe(campaignId(world, title))
    })
  })

  test('Staff take the expense off a campaign', ({ given, when, and, then }) => {
    givenTwo(given)
    editCharged(when)
    chargeTo(and)
    then('the expense is charged to no campaign', () => {
      expect(world.chosen).toBe('')
    })
  })

  test('A closed campaign the expense is already charged to still shows', ({ given, when, then }) => {
    givenTwo(given)
    editCharged(when)
    then(/^the campaign shown is "(.*)"$/, async (label) => {
      const el = await select()
      await waitFor(() => expect(el.selectedOptions[0]?.textContent).toBe(label))
    })
  })

  test('Nothing to choose before a fund is picked', ({ given, when, then }) => {
    givenTwo(given)
    when('staff have not chosen a fund yet', () => mount(world, ''))
    nothingShown(then)
  })

  test('A fund with no campaigns shows no campaign choice', ({ given, when, then }) => {
    givenOne(given)
    chooseFund(when)
    nothingShown(then)
  })

  test('Viewers who may not list campaigns see no campaign choice', ({ given, when, then }) => {
    given('listing campaigns is refused', () => {
      world.refused = true
    })
    chooseFund(when)
    nothingShown(then)
  })
})
