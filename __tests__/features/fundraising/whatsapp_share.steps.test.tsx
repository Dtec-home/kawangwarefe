/**
 * Binding for `fundraising/whatsapp_share.feature` (Fundraising S2, lane S2-UI-D, ticket 2.13).
 *
 * Drives the real WhatsApp share tab through Apollo's MockedProvider with the
 * app's real GraphQL documents. `window.open` and the clipboard are stubbed.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import { GET_WHATSAPP_CONTRIBUTOR_LIST, RECORD_WHATSAPP_SHARE } from '@/lib/graphql/fundraising/whatsapp'
import type { WhatsAppContributorList } from '@/lib/types/fundraising'
import { WhatsAppShareTab } from '@/components/campaigns/admin/whatsapp-share/whatsapp-share-tab'
import { whatsappList } from '../../components/campaigns/s2_ui_d/fixtures'

const feature = loadFeature('./whatsapp_share.feature', { loadRelativePath: true })

interface World {
  list: WhatsAppContributorList
  recorded: number
  refusal: string | null
}

function openTab(world: World) {
  const mocks: MockedResponse[] = [
    {
      request: { query: GET_WHATSAPP_CONTRIBUTOR_LIST, variables: { campaignId: '9' } },
      result: () => ({ data: { whatsappContributorList: { __typename: 'WhatsAppContributorListType', ...world.list } } }),
      maxUsageCount: 10,
    },
    {
      request: { query: RECORD_WHATSAPP_SHARE, variables: { campaignId: '9' } },
      result: () => {
        if (!world.refusal) world.recorded += 1
        return {
          data: {
            recordWhatsappShare: {
              __typename: 'MutationResult',
              success: !world.refusal,
              message: world.refusal ?? 'Share recorded',
            },
          },
        }
      },
      maxUsageCount: 5,
    },
  ]
  render(
    <MockedProvider mocks={mocks}>
      <WhatsAppShareTab campaignId="9" />
    </MockedProvider>
  )
}

async function toldThat(message: string) {
  await waitFor(() => {
    const toasted = [...toastMock.success.mock.calls, ...toastMock.error.mock.calls].flat()
    expect(toasted.includes(message) || screen.queryAllByText(message).length > 0).toBe(true)
  })
}

defineFeature(feature, (test) => {
  let world: World
  let openSpy: ReturnType<typeof vi.fn>
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    world = { list: whatsappList(), recorded: 0, refusal: null }
    openSpy = vi.fn(() => null)
    vi.stubGlobal('open', openSpy)
    writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const givenList = (step: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    step(/^the campaign's list names (\d+) contributors who gave "(.*)" in total$/, (count, total) => {
      world.list = whatsappList({ contributorCount: Number(count), totalAmount: total })
    })

  const whenOpen = (when: (m: string, fn: () => void) => void) =>
    when('they open the share tab', () => openTab(world))

  const choose = (step: (m: RegExp, fn: (name: string) => Promise<void>) => void) =>
    step(/^they choose "(.*)"$/, async (name) => {
      // A button can appear while the list is still settling (and so
      // disabled); a click on it then would be silently ignored.
      await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled())
      fireEvent.click(screen.getByRole('button', { name }))
    })

  const told = (step: (m: RegExp, fn: (msg: string) => Promise<void>) => void) =>
    step(/^they are told "(.*)"$/, (msg) => toldThat(msg))

  const sees = (step: (m: RegExp, fn: (...args: string[]) => Promise<void>) => void) =>
    step(/^they see "(.*)" and "(.*)"$/, async (count, total) => {
      expect(await screen.findByText(count)).toBeInTheDocument()
      expect(screen.getByText(total)).toBeInTheDocument()
    })

  const recorded = (step: (m: string, fn: () => Promise<void>) => void) =>
    step('the share is recorded', async () => {
      await waitFor(() => expect(world.recorded).toBe(1))
    })

  test('Staff preview the list before sharing', ({ given, when, then, and }) => {
    givenList(given)
    whenOpen(when)
    then('they see the exact text that will be shared', async () => {
      const preview = await screen.findByTestId('whatsapp-preview')
      expect(preview.textContent).toBe(world.list.text)
    })
    sees(and)
    and('they see when the list was made', () => {
      expect(screen.getByText(/As at 20 Oct 2026, 09:00/)).toBeInTheDocument()
    })
    and(/^they are warned "(.*)"$/, (warning) => {
      expect(screen.getByText(warning)).toBeInTheDocument()
    })
  })

  test('Staff share the list to WhatsApp', ({ given, when, then, and }) => {
    givenList(given)
    whenOpen(when)
    choose(and)
    then('WhatsApp opens with the list ready to send', () => {
      expect(openSpy).toHaveBeenCalledWith(world.list.shareUrl, '_blank', 'noopener,noreferrer')
    })
    recorded(and)
    told(and)
  })

  test('Staff copy the list instead', ({ given, when, then, and }) => {
    givenList(given)
    whenOpen(when)
    choose(and)
    then('the list is copied', async () => {
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(world.list.text))
      expect(openSpy).not.toHaveBeenCalled()
    })
    recorded(and)
  })

  test('Recording the share is refused', ({ given, when, then, and }) => {
    givenList(given)
    and(/^the server will refuse to record the share with "(.*)"$/, (msg) => {
      world.refusal = msg
    })
    whenOpen(when)
    choose(and)
    told(then)
  })

  test('Nobody has given yet', ({ given, when, then, and }) => {
    given("the campaign's list has no contributors", () => {
      world.list = whatsappList({ contributorCount: 0, totalAmount: '0.00' })
    })
    whenOpen(when)
    then('they are told nobody has given yet', async () => {
      expect(await screen.findByText('Nobody has given yet')).toBeInTheDocument()
    })
    and('they cannot share the list', () => {
      expect(screen.getByRole('button', { name: 'Share list to WhatsApp' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Copy text' })).toBeDisabled()
    })
  })

  test('A very long list suggests copying instead', ({ given, when, then }) => {
    given("the campaign's list is very long", () => {
      const lines = Array.from({ length: 200 }, (_, i) => `${i + 1}. Contributor number ${i + 1}: KES 1,000`)
      world.list = whatsappList({ text: lines.join('\n'), contributorCount: 200, totalAmount: '200000.00' })
    })
    whenOpen(when)
    then('they are warned WhatsApp may cut the list short and to use Copy text', async () => {
      expect(await screen.findByText(/WhatsApp may cut it short/)).toBeInTheDocument()
      expect(screen.getByText(/WhatsApp may cut it short/).textContent).toMatch(/Copy text/)
    })
  })

  test('Staff refresh the list', ({ given, when, then, and }) => {
    givenList(given)
    whenOpen(when)
    and(/^someone else gives so the list names (\d+) contributors who gave "(.*)" in total$/, async (count, total) => {
      await screen.findByText('2 contributors')
      world.list = whatsappList({ contributorCount: Number(count), totalAmount: total })
    })
    choose(and)
    sees(then)
  })
})
