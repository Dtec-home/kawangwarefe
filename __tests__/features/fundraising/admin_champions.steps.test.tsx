/**
 * Binding for `fundraising/admin_champions.feature` (S5-UI-J, ticket 5.10).
 *
 * Drives the real ChampionsTab through Apollo's MockedProvider with the app's
 * real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('sonner', () => ({ toast: toasts }))

import {
  APPROVE_CHAMPION,
  CAMPAIGN_CHAMPIONS,
  DEACTIVATE_CHAMPION,
  INVITE_CHAMPION,
} from '@/lib/graphql/fundraising/champions'
import { ChampionsTab } from '@/components/campaigns/admin/champions/champions-tab'

const feature = loadFeature('./admin_champions.feature', { loadRelativePath: true })

const CAMPAIGN_ID = '42'
let nextId = 100

function champion(name: string, code: string, over: Record<string, unknown> = {}) {
  return {
    __typename: 'ChampionType',
    id: String(nextId++),
    campaignId: CAMPAIGN_ID,
    campaignTitle: 'New Church Roof',
    campaignSlug: 'new-church-roof',
    memberName: name,
    code,
    personalTarget: null as string | null,
    status: 'ACTIVE',
    showOnLeaderboard: true,
    raised: '0.00',
    donorCount: 0,
    publicUrl: `https://church.example/campaigns/new-church-roof/c/${code}`,
    paymentInstructions: {
      __typename: 'PaymentInstructionsType',
      paybillNumber: '4012345',
      accountReference: `ROOF ${code}`,
      text: '',
    },
    ...over,
  }
}

type ChampionRow = ReturnType<typeof champion>

interface World {
  allowChampions: boolean
  champions: ChampionRow[]
  invited: Record<string, unknown>[]
  approved: string[]
  deactivated: string[]
}

function respond(world: World, id: string, status: string, field: string, message: string) {
  const row = world.champions.find((c) => c.id === id)!
  row.status = status
  return { data: { [field]: { __typename: 'ChampionResponse', success: true, message, champion: { ...row } } } }
}

function mocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: CAMPAIGN_CHAMPIONS, variables: { campaignId: CAMPAIGN_ID } },
      result: () => ({
        data: {
          campaign: {
            __typename: 'CampaignType',
            id: CAMPAIGN_ID,
            title: 'New Church Roof',
            status: 'ACTIVE',
            paybillCode: 'ROOF',
            allowChampions: world.allowChampions,
          },
          champions: world.champions.map((c) => ({ ...c })),
        },
      }),
      maxUsageCount: 10,
    },
    {
      request: { query: INVITE_CHAMPION, variables: () => true },
      result: (variables) => {
        world.invited.push(variables as Record<string, unknown>)
        const v = variables as { code: string }
        const row = champion('Mama Grace', v.code)
        world.champions.push(row)
        return { data: { inviteChampion: { __typename: 'ChampionResponse', success: true, message: 'Champion invited', champion: row } } }
      },
    },
    {
      request: { query: APPROVE_CHAMPION, variables: () => true },
      result: (variables) => {
        const id = (variables as { id: string }).id
        world.approved.push(id)
        return respond(world, id, 'ACTIVE', 'approveChampion', 'Champion approved')
      },
    },
    {
      request: { query: DEACTIVATE_CHAMPION, variables: () => true },
      result: (variables) => {
        const id = (variables as { id: string }).id
        world.deactivated.push(id)
        return respond(world, id, 'INACTIVE', 'deactivateChampion', 'Champion deactivated')
      },
    },
  ]
}

const row = (name: string) => screen.findByRole('row', { name })
const idOf = (world: World, name: string) => world.champions.find((c) => c.memberName === name)!.id

async function clickEnabled(name: string, root: HTMLElement | null = null) {
  const scope = root ? within(root) : screen
  await waitFor(() => expect(scope.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(scope.getByRole('button', { name }))
}

async function invite(phone: string, code: string, target: string | null) {
  await clickEnabled('Invite a champion')
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText(/Phone Number/), { target: { value: phone } })
  fireEvent.change(within(dialog).getByLabelText(/Champion code/), { target: { value: code } })
  if (target) fireEvent.change(within(dialog).getByLabelText(/Personal target/), { target: { value: target } })
  await clickEnabled('Invite', dialog)
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    toasts.success.mockReset()
    toasts.error.mockReset()
    world = { allowChampions: true, champions: [], invited: [], approved: [], deactivated: [] }
  })

  const open = () =>
    render(
      <MockedProvider mocks={mocks(world)}>
        <ChampionsTab campaignId={CAMPAIGN_ID} />
      </MockedProvider>
    )

  type Step = (m: RegExp | string, fn: (...a: string[]) => unknown) => void

  const givenTakes = (given: Step) => given(/^the campaign "(.*)" takes champions$/, () => {})
  const givenActive = (given: Step) =>
    given(
      /^"(.*)" is an active champion with code "(.*)" who raised "(.*)" from (\d+) donors towards "(.*)"$/,
      (name, code, raised, donors, target) => {
        world.champions.push(champion(name, code, { raised, donorCount: Number(donors), personalTarget: target }))
      }
    )
  const givenPending = (given: Step) =>
    given(/^"(.*)" is a pending champion with code "(.*)"$/, (name, code) => {
      world.champions.push(champion(name, code, { status: 'PENDING' }))
    })
  const whenOpen = (when: Step) => when('staff open the Champions tab', () => open())
  const thenRowShows = (then: Step) =>
    then(/^the row for "(.*)" shows "(.*)" and "(.*)"$/, async (name, code, status) => {
      await waitFor(async () => expect(within(await row(name)).getByTestId('champion-status')).toHaveTextContent(status))
      expect(within(await row(name)).getByText(code)).toBeInTheDocument()
    })

  test('Staff see the champions of a campaign', ({ given, and, when, then }) => {
    givenTakes(given)
    givenActive(and)
    givenPending(and)
    whenOpen(when)
    then(/^the row for "(.*)" shows "(.*)", "(.*)", "(.*)", "(.*)" and "(.*)"$/, async (name, code, status, raised, donors, target) => {
      const el = within(await row(name))
      expect(el.getByText(code)).toBeInTheDocument()
      expect(el.getByTestId('champion-status')).toHaveTextContent(status)
      expect(el.getByText(raised)).toBeInTheDocument()
      expect(el.getByText(donors)).toBeInTheDocument()
      expect(el.getByText(target)).toBeInTheDocument()
    })
    and(/^the row for "(.*)" links to "(.*)"$/, async (name, url) => {
      expect(within(await row(name)).getByRole('link', { name: `Open ${name}'s champion page` })).toHaveAttribute('href', url)
    })
    thenRowShows(and)
  })

  test('Staff invite a champion by phone', ({ given, when, and, then }) => {
    givenTakes(given)
    whenOpen(when)
    and(/^they invite "(.*)" with code "(.*)" and a personal target of "(.*)"$/, (phone, code, target) => invite(phone, code, target))
    then(
      /^a champion is invited to campaign "(.*)" with phone "(.*)", code "(.*)" and personal target "(.*)"$/,
      async (campaignId, phoneNumber, code, personalTarget) => {
        await waitFor(() => expect(world.invited).toHaveLength(1))
        expect(world.invited[0]).toEqual({ campaignId, phoneNumber, code, personalTarget })
      }
    )
    and(/^they are told "(.*)"$/, async (message) => {
      await waitFor(() => expect(toasts.success).toHaveBeenCalledWith(message))
      expect(await row('Mama Grace')).toBeInTheDocument()
    })
  })

  test('An invalid phone number is refused before sending', ({ given, when, and, then }) => {
    givenTakes(given)
    whenOpen(when)
    and(/^they invite "(.*)" with code "(.*)" and no personal target$/, (phone, code) => invite(phone, code, null))
    then(/^they see the message "(.*)"$/, async (message) => {
      expect(await within(await screen.findByRole('dialog')).findByText(message)).toBeInTheDocument()
    })
    and('no invitation is sent', () => {
      expect(world.invited).toHaveLength(0)
    })
  })

  test('Staff approve a pending champion', ({ given, and, when, then }) => {
    givenTakes(given)
    givenPending(and)
    whenOpen(when)
    and(/^they approve "(.*)"$/, async (name) => {
      await clickEnabled('Approve', await row(name))
    })
    then(/^champion "(.*)" is approved$/, async (name) => {
      await waitFor(() => expect(world.approved).toEqual([idOf(world, name)]))
      await waitFor(() => expect(toasts.success).toHaveBeenCalledWith('Champion approved'))
    })
    thenRowShows(and)
  })

  test('Staff deactivate an active champion after confirming', ({ given, and, when, then }) => {
    givenTakes(given)
    givenActive(and)
    whenOpen(when)
    and(/^they deactivate "(.*)" and confirm$/, async (name) => {
      await clickEnabled('Deactivate', await row(name))
      const dialog = await screen.findByRole('alertdialog')
      expect(world.deactivated).toHaveLength(0)
      await clickEnabled('Deactivate champion', dialog)
    })
    then(/^champion "(.*)" is deactivated$/, async (name) => {
      await waitFor(() => expect(world.deactivated).toEqual([idOf(world, name)]))
    })
    thenRowShows(and)
  })

  test('A campaign with no champions explains what champions are', ({ given, when, then }) => {
    givenTakes(given)
    whenOpen(when)
    then('they are told there are no champions yet', async () => {
      expect(await screen.findByText('No champions yet')).toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole('button', { name: 'Invite a champion' })).toBeEnabled())
    })
  })

  test('A campaign that does not take champions points to Edit on the Overview tab', ({ given, when, then, and }) => {
    given(/^the campaign "(.*)" does not take champions$/, () => {
      world.allowChampions = false
    })
    whenOpen(when)
    then('they are told the campaign does not take champions and to use Edit on the Overview tab', async () => {
      expect(await screen.findByText('Champions are turned off')).toBeInTheDocument()
      expect(screen.getByText(/use Edit on the Overview tab/)).toBeInTheDocument()
    })
    and('they cannot invite a champion', () => {
      expect(screen.getByRole('button', { name: 'Invite a champion' })).toBeDisabled()
    })
  })
})
