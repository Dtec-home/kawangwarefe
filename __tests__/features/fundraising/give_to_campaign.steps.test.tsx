/**
 * Binding for `fundraising/give_to_campaign.feature` (S1-UI-B, ticket 1.12).
 *
 * Drives the real `CampaignGiveSlot` (as hosted by /contribute) through
 * Apollo's MockedProvider with the lane's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const nav = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/contribute',
  useSearchParams: () => nav.params,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null }) }))

import {
  INITIATE_CAMPAIGN_CONTRIBUTION,
  PUBLIC_CAMPAIGN_FOR_GIVING,
} from '@/lib/graphql/fundraising/give'
import { CampaignGiveSlot } from '@/components/campaigns/give/campaign-give-slot'

const feature = loadFeature('./give_to_campaign.feature', { loadRelativePath: true })

function publicCampaign(slug: string, title: string, accepting: boolean) {
  return {
    __typename: 'PublicCampaignType',
    slug,
    title,
    summary: 'Replace the leaking iron sheets before the long rains.',
    isAcceptingGifts: accepting,
    categoryId: '4',
    campaignId: '42',
    paymentInstructions: {
      __typename: 'PaymentInstructionsType',
      paybillNumber: '247247',
      accountReference: 'BUILD',
      text: 'Pay Bill 247247, Account BUILD',
    },
    progress: {
      __typename: 'CampaignProgressType',
      target: '100000.00',
      raised: '24800.00',
      remaining: '75200.00',
      percent: 24.8,
      donorCount: 37,
      giftCount: 41,
      pledged: '0.00',
    },
  }
}

interface World {
  mocks: MockedResponse[]
  initiated: Record<string, unknown>[]
  refusal: string | null
}

function campaignMock(slug: string, campaign: unknown): MockedResponse {
  return {
    request: { query: PUBLIC_CAMPAIGN_FOR_GIVING, variables: { slug } },
    result: { data: { publicCampaign: campaign } },
    maxUsageCount: 5,
  }
}

function initiateMock(world: World): MockedResponse {
  return {
    request: { query: INITIATE_CAMPAIGN_CONTRIBUTION, variables: () => true },
    result: (variables) => {
      world.initiated.push(variables as Record<string, unknown>)
      const refused = world.refusal
      return {
        data: {
          initiateContribution: {
            __typename: 'ContributionResponse',
            success: !refused,
            message: refused ?? 'STK push sent',
            checkoutRequestId: refused ? null : 'ws_CO_123',
            contribution: refused ? null : { __typename: 'ContributionType', id: '9001' },
          },
        },
      }
    },
  }
}

function openContribute(world: World, slug: string | null) {
  nav.params = new URLSearchParams(slug ? { campaign: slug } : {})
  render(
    <MockedProvider mocks={[...world.mocks, initiateMock(world)]}>
      <CampaignGiveSlot>
        <p>General contribution form</p>
      </CampaignGiveSlot>
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    nav.push.mockReset()
    world = { mocks: [], initiated: [], refusal: null }
  })

  const givenAccepting = (given: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    given(/^the campaign "(.*)" "(.*)" is accepting gifts$/, (slug: string, title: string) => {
      world.mocks.push(campaignMock(slug, publicCampaign(slug, title, true)))
    })

  const whenOpen = (when: (m: RegExp, fn: (...a: string[]) => void) => void) =>
    when(/^a giver opens the contribute page for campaign "(.*)"$/, (slug: string) => {
      openContribute(world, slug)
    })

  const give = async (amount: string, phone: string) => {
    fireEvent.change(await screen.findByLabelText(/Phone Number/), { target: { value: phone } })
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: amount } })
    fireEvent.click(screen.getByRole('button', { name: /Send M-Pesa prompt/ }))
  }

  const linkBack = (and: (m: string, fn: () => void) => void) =>
    and('they are offered a link back to the general giving page', () => {
      expect(screen.getByRole('link', { name: /Give to a department instead/ })).toHaveAttribute('href', '/contribute')
    })

  test('A giver sends an M-Pesa prompt for a campaign', ({ given, when, then, and }) => {
    givenAccepting(given)
    whenOpen(when)
    then(/^they see the campaign "(.*)" with "(.*)" raised$/, async (title: string, raised: string) => {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByText(raised)).toBeInTheDocument()
      expect(screen.queryByText('General contribution form')).not.toBeInTheDocument()
    })
    and(/^they see the Pay Bill account "(.*)"$/, (account: string) => {
      expect(screen.getByTestId('paybill-account')).toHaveTextContent(account)
      expect(screen.getByTestId('paybill-number')).toHaveTextContent('247247')
    })
    when(/^they give "(.*)" from phone "(.*)"$/, give)
    then(/^the M-Pesa prompt is sent for "(.*)" to the campaign's department tagged with the campaign$/, async (amount: string) => {
      await waitFor(() =>
        expect(world.initiated).toContainEqual({
          phoneNumber: '254712345678',
          amount,
          categoryId: '4',
          campaignId: '42',
        })
      )
    })
    and(/^they are taken to the confirmation page for campaign "(.*)"$/, async (slug: string) => {
      await waitFor(() =>
        expect(nav.push).toHaveBeenCalledWith(`/confirmation?id=9001&checkoutRequestId=ws_CO_123&campaign=${slug}`)
      )
    })
  })

  test('The server refuses the prompt', ({ given, and, when, then }) => {
    givenAccepting(given)
    and(/^the server will refuse the prompt with "(.*)"$/, (message: string) => {
      world.refusal = message
    })
    whenOpen(when)
    and(/^they give "(.*)" from phone "(.*)"$/, give)
    then(/^they are told "(.*)"$/, async (message: string) => {
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
    })
    and('they stay on the campaign page', () => {
      expect(nav.push).not.toHaveBeenCalled()
    })
  })

  test('A paused campaign does not take gifts', ({ given, when, then, and }) => {
    given(/^the campaign "(.*)" "(.*)" is not accepting gifts$/, (slug: string, title: string) => {
      world.mocks.push(campaignMock(slug, publicCampaign(slug, title, false)))
    })
    whenOpen(when)
    then('they are told the campaign is not accepting gifts', async () => {
      expect(await screen.findByText(/not accepting gifts right now/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Send M-Pesa prompt/ })).not.toBeInTheDocument()
    })
    linkBack(and)
  })

  test('An unknown campaign link', ({ given, when, then, and }) => {
    given(/^there is no public campaign "(.*)"$/, (slug: string) => {
      world.mocks.push(campaignMock(slug, null))
    })
    whenOpen(when)
    then('they are told the campaign could not be found', async () => {
      expect(await screen.findByText(/couldn.t find that campaign/)).toBeInTheDocument()
    })
    linkBack(and)
  })

  test('Without a campaign the general form is shown', ({ when, then }) => {
    when('a giver opens the contribute page without a campaign', () => {
      openContribute(world, null)
    })
    then('they see the general contribution form', () => {
      expect(screen.getByText('General contribution form')).toBeInTheDocument()
    })
  })
})
