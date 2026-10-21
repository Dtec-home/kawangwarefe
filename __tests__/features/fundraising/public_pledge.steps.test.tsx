/**
 * Binding for `fundraising/public_pledge.feature` (S3-UI-E, tickets 3.9, 3.10).
 *
 * Drives the real `PublicPledgeSlot` (as hosted by the public campaign page)
 * through Apollo's MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

import { CONFIRM_GUEST_PLEDGE, START_GUEST_PLEDGE } from '@/lib/graphql/fundraising/member-pledges'
import { PublicPledgeSlot, type PublicPledgeSlotProps } from '@/components/pledges/public/public-pledge-slot'

const feature = loadFeature('./public_pledge.feature', { loadRelativePath: true })

type Campaign = PublicPledgeSlotProps['campaign']

function campaign(slug: string, title: string, over: Partial<Campaign> = {}): Campaign {
  return {
    slug,
    title,
    allowPledges: true,
    isAcceptingGifts: true,
    progress: {
      target: '100000.00',
      raised: '24800.00',
      remaining: '75200.00',
      percent: 24.8,
      donorCount: 37,
      giftCount: 41,
      pledged: '61500.00',
    },
    ...over,
  }
}

interface World {
  campaign: Campaign | null
  started: Record<string, unknown>[]
  confirmed: Record<string, unknown>[]
  startRefusal: string | null
  codeRefusal: string | null
}

function mocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: START_GUEST_PLEDGE, variables: () => true },
      result: (variables) => {
        world.started.push(variables as Record<string, unknown>)
        const refused = world.startRefusal
        return {
          data: {
            startGuestPledge: {
              __typename: 'GuestPledgeStartResponse',
              success: !refused,
              message: refused ?? 'We sent a code to 0712 345 678.',
              pledgeId: refused ? null : `p-${world.started.length}`,
            },
          },
        }
      },
      maxUsageCount: 5,
    },
    {
      request: { query: CONFIRM_GUEST_PLEDGE, variables: () => true },
      result: (variables) => {
        world.confirmed.push(variables as Record<string, unknown>)
        const refused = world.codeRefusal
        return {
          data: {
            confirmGuestPledge: {
              __typename: 'PledgeResponse',
              success: !refused,
              message: refused ?? 'Pledge confirmed',
              pledge: refused
                ? null
                : { __typename: 'PledgeType', id: (variables as { pledgeId: string }).pledgeId, amount: '5000.00', dueDate: null, status: 'OPEN' },
            },
          },
        }
      },
      maxUsageCount: 5,
    },
  ]
}

async function clickEnabled(name: string | RegExp) {
  await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name }))
}

async function pledge(amount: string, name: string, phone: string, due: string | null) {
  fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: name } })
  fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: phone } })
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: amount } })
  if (due) fireEvent.change(screen.getByLabelText(/Give by/), { target: { value: due } })
  await clickEnabled('Send me a code')
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-21T09:00:00+03:00'))
    world = { campaign: null, started: [], confirmed: [], startRefusal: null, codeRefusal: null }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  type Step = (m: RegExp | string, fn: (...a: string[]) => unknown) => void

  const givenTakesPledges = (given: Step) =>
    given(/^the public campaign "(.*)" "(.*)" takes pledges$/, (slug, title) => {
      world.campaign = campaign(slug, title)
    })
  const whenOpen = (when: Step) =>
    when('a visitor opens the pledge card', () => {
      render(
        <MockedProvider mocks={mocks(world)}>
          <div data-testid="host">
            <PublicPledgeSlot campaign={world.campaign!} />
          </div>
        </MockedProvider>
      )
    })
  const whenPledgeDue = (when: Step) =>
    when(/^they pledge "(.*)" as "(.*)" from phone "(.*)" due "(.*)"$/, (amount, name, phone, due) =>
      pledge(amount, name, phone, due)
    )
  const whenPledgeNoDue = (when: Step) =>
    when(/^they pledge "(.*)" as "(.*)" from phone "([^"]*)"$/, (amount, name, phone) => pledge(amount, name, phone, null))
  const whenEnterCode = (when: Step) =>
    when(/^they enter the code "(.*)"$/, async (code) => {
      fireEvent.change(await screen.findByLabelText('6-digit code'), { target: { value: code } })
      await clickEnabled('Confirm pledge')
    })
  const thenAskedForCode = (then: Step) =>
    then(/^they are (?:still )?asked for the 6-digit code$/, async () => {
      expect(await screen.findByLabelText('6-digit code')).toBeInTheDocument()
    })
  const thenConfirmed = (then: Step) =>
    then(/^the pledge "(.*)" is confirmed with the code "(.*)"$/, async (pledgeId, code) => {
      await waitFor(() => expect(world.confirmed).toHaveLength(1))
      expect(world.confirmed[0]).toEqual({ pledgeId, code })
    })
  const thenMessage = (then: Step) =>
    then(/^they see the message "(.*)"$/, async (message) => {
      expect(await screen.findByText(message)).toBeInTheDocument()
    })
  const thenNoCard = (then: Step) =>
    then('there is no pledge card', () => {
      expect(screen.getByTestId('host')).toBeEmptyDOMElement()
    })

  test('A guest pledges and confirms with the SMS code', ({ given, when, and, then }) => {
    givenTakesPledges(given)
    whenOpen(when)
    whenPledgeDue(and)
    then(/^a code is requested for "(.*)" on "(.*)" for "(.*)" due "(.*)" on "(.*)"$/, async (name, phone, amount, due, slug) => {
      await waitFor(() => expect(world.started).toHaveLength(1))
      expect(world.started[0]).toEqual({ slug, name, phoneNumber: phone, amount, dueDate: due })
    })
    thenAskedForCode(and)
    whenEnterCode(when)
    thenConfirmed(then)
    and('they are told the pledge is confirmed and they will be reminded by SMS', async () => {
      expect(await screen.findByText('Thank you, Jane! Your pledge is confirmed.')).toBeInTheDocument()
      expect(screen.getByText(/KES 5,000.00 to New Church Roof, by Thu, 31 Dec 2026/)).toBeInTheDocument()
      expect(screen.getByText(/remind you by SMS.*3 days before your due date.*between 8am and 8pm/)).toBeInTheDocument()
    })
  })

  test('A guest pledges without a due date', ({ given, when, and, then }) => {
    givenTakesPledges(given)
    whenOpen(when)
    whenPledgeNoDue(and)
    then('a code is requested with no due date', async () => {
      await waitFor(() => expect(world.started).toHaveLength(1))
      expect(world.started[0]).toMatchObject({ amount: '2000', dueDate: null })
    })
  })

  test('A wrong code is refused', ({ given, and, when, then }) => {
    givenTakesPledges(given)
    and(/^the server will refuse the code with "(.*)"$/, (message) => {
      world.codeRefusal = message
    })
    whenOpen(when)
    whenPledgeDue(and)
    whenEnterCode(and)
    thenMessage(then)
    thenAskedForCode(and)
  })

  test('Too many code requests are refused', ({ given, and, when, then }) => {
    givenTakesPledges(given)
    and(/^the server will refuse to send a code with "(.*)"$/, (message) => {
      world.startRefusal = message
    })
    whenOpen(when)
    whenPledgeDue(and)
    thenMessage(then)
    and('they are not asked for a code', () => {
      expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
    })
  })

  test('Asking for a new code starts the pledge again', ({ given, when, and, then }) => {
    givenTakesPledges(given)
    whenOpen(when)
    whenPledgeDue(and)
    and('they ask for a new code', async () => {
      await screen.findByLabelText('6-digit code')
      await clickEnabled('Send a new code')
    })
    then(/^a code has been requested (\d+) times$/, async (times) => {
      await waitFor(() => expect(world.started).toHaveLength(Number(times)))
      expect(world.started[1]).toEqual(world.started[0])
    })
    whenEnterCode(when)
    thenConfirmed(then)
  })

  test('An invalid phone number is caught before sending', ({ given, when, and, then }) => {
    givenTakesPledges(given)
    whenOpen(when)
    whenPledgeNoDue(and)
    then('they are told to enter a valid phone number', async () => {
      expect(await screen.findByText('Enter a valid Safaricom or Airtel number')).toBeInTheDocument()
    })
    and('no code is requested', () => {
      expect(world.started).toHaveLength(0)
    })
  })

  test('A campaign that does not take pledges shows no pledge card', ({ given, when, then }) => {
    given(/^the public campaign "(.*)" "(.*)" does not take pledges$/, (slug, title) => {
      world.campaign = campaign(slug, title, { allowPledges: false })
    })
    whenOpen(when)
    thenNoCard(then)
  })

  test('A paused campaign shows no pledge card', ({ given, when, then }) => {
    given(/^the public campaign "(.*)" "(.*)" takes pledges but is not accepting gifts$/, (slug, title) => {
      world.campaign = campaign(slug, title, { isAcceptingGifts: false })
    })
    whenOpen(when)
    thenNoCard(then)
  })
})
