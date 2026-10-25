/**
 * Binding for `fundraising/admin_updates.feature` (Fundraising S2, lane S2-UI-D, ticket 2.12).
 *
 * Drives the real Updates tab through Apollo's MockedProvider with the app's
 * real GraphQL documents. The mocked server keeps the campaign's updates in
 * `world.updates`, so a post or removal shows up on the refetch.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import {
  GET_CAMPAIGN_UPDATES,
  POST_CAMPAIGN_UPDATE,
  REMOVE_CAMPAIGN_UPDATE,
  type PostCampaignUpdateVars,
} from '@/lib/graphql/fundraising/updates'
import type { CampaignUpdate } from '@/lib/types/fundraising'
import { UpdatesTab } from '@/components/campaigns/admin/updates/updates-tab'
import { campaignUpdate } from '../../components/campaigns/s2_ui_d/fixtures'

const feature = loadFeature('./admin_updates.feature', { loadRelativePath: true })

interface World {
  updates: CampaignUpdate[]
  posted: PostCampaignUpdateVars | null
  refusal: string | null
}

function withTypename(update: CampaignUpdate) {
  return { __typename: 'CampaignUpdateType', ...update }
}

function openTab(world: World) {
  const mocks: MockedResponse[] = [
    {
      request: { query: GET_CAMPAIGN_UPDATES, variables: { campaignId: '9' } },
      result: () => ({ data: { campaignUpdates: world.updates.map(withTypename) } }),
      maxUsageCount: 10,
    },
    {
      request: {
        query: POST_CAMPAIGN_UPDATE,
        variables: (vars: PostCampaignUpdateVars) => {
          world.posted = vars
          return vars.campaignId === '9'
        },
      },
      result: () => {
        if (world.refusal) {
          return {
            data: {
              postCampaignUpdate: { __typename: 'CampaignUpdateResponse', success: false, message: world.refusal, update: null },
            },
          }
        }
        const sms = world.posted?.smsDonors ?? false
        const update = campaignUpdate({
          id: String(world.updates.length + 100),
          title: world.posted?.title,
          body: world.posted?.body,
          publishedAt: '2026-10-20T09:00:00+03:00',
          smsSentAt: sms ? '2026-10-20T09:00:00+03:00' : null,
        })
        world.updates = [...world.updates, update]
        return {
          data: {
            postCampaignUpdate: {
              __typename: 'CampaignUpdateResponse',
              success: true,
              message: sms ? 'Update posted and SMS queued' : 'Update posted',
              update: withTypename(update),
            },
          },
        }
      },
      maxUsageCount: 5,
    },
    {
      request: { query: REMOVE_CAMPAIGN_UPDATE, variables: (vars: { id: string }) => Boolean(vars.id) },
      result: (vars: { id: string }) => {
        world.updates = world.updates.filter((u) => u.id !== vars.id)
        return { data: { removeCampaignUpdate: { __typename: 'MutationResult', success: true, message: 'Update removed' } } }
      },
      maxUsageCount: 5,
    },
  ]
  render(
    <MockedProvider mocks={mocks}>
      <UpdatesTab campaignId="9" />
    </MockedProvider>
  )
}

async function toldThat(message: string) {
  await waitFor(() => {
    const toasted = [...toastMock.success.mock.calls, ...toastMock.error.mock.calls].flat()
    expect(toasted.includes(message) || screen.queryAllByText(message).length > 0).toBe(true)
  })
}

async function itemFor(title: string) {
  const heading = await screen.findByRole('heading', { name: title })
  return heading.closest('article') as HTMLElement
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
    world = { updates: [], posted: null, refusal: null }
  })

  const givenUpdate = (step: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    step(
      /^the campaign has an update "(.*)" posted by "(.*)" on "(.*)"( that was sent by SMS)?$/,
      (title, by, on, sms) => {
        const at = `${on}T10:00:00+03:00`
        world.updates.push(
          campaignUpdate({
            id: String(world.updates.length + 1),
            title,
            postedByName: by,
            publishedAt: at,
            smsSentAt: sms ? at : null,
          })
        )
      }
    )

  const givenNone = (given: (m: string, fn: () => void) => void) =>
    given('the campaign has no updates', () => {
      world.updates = []
    })

  const whenOpen = (when: (m: string, fn: () => void) => void) =>
    when('they open the updates tab', () => openTab(world))

  const listed = (step: (m: RegExp, fn: (titles: string) => Promise<void>) => void) =>
    step(/^the updates are listed as (.*)$/, async (titles) => {
      const expected = titles.split(',').map((t) => t.trim().replace(/^"|"$/g, ''))
      await waitFor(() => {
        const list = screen.getByRole('list', { name: 'Campaign updates' })
        const shown = within(list)
          .getAllByRole('heading')
          .map((h) => h.textContent)
        expect(shown).toEqual(expected)
      })
    })

  const noneYet = (step: (m: string, fn: () => Promise<void>) => void) =>
    step('they are told there are no updates yet', async () => {
      expect(await screen.findByText('No updates yet')).toBeInTheDocument()
    })

  const write = (step: (m: RegExp, fn: (...args: string[]) => Promise<void>) => void) =>
    step(/^they write an update titled "(.*)" saying "(.*)"$/, async (title, body) => {
      fireEvent.change(await screen.findByLabelText('Title'), { target: { value: title } })
      fireEvent.change(screen.getByLabelText('Message'), { target: { value: body } })
    })

  const post = (step: (m: string, fn: () => Promise<void>) => void) =>
    step('they post the update', () => clickWhenEnabled('Post update'))

  const told = (step: (m: RegExp, fn: (msg: string) => Promise<void>) => void) =>
    step(/^they are told "(.*)"$/, (msg) => toldThat(msg))

  test("Staff see the campaign's updates, newest first", ({ given, when, then, and }) => {
    givenUpdate(given)
    givenUpdate(and)
    whenOpen(when)
    listed(then)
    and(/^"(.*)" is marked as sent by SMS$/, async (title) => {
      expect(within(await itemFor(title)).getByText('SMS sent')).toBeInTheDocument()
    })
    and(/^"(.*)" is not marked as sent by SMS$/, async (title) => {
      expect(within(await itemFor(title)).queryByText('SMS sent')).not.toBeInTheDocument()
    })
    and(/^"(.*)" shows it was posted by "(.*)"$/, async (title, by) => {
      expect(within(await itemFor(title)).getByText(new RegExp(`Posted by ${by}`))).toBeInTheDocument()
    })
  })

  test('A campaign with no updates invites staff to post one', ({ given, when, then }) => {
    givenNone(given)
    whenOpen(when)
    noneYet(then)
  })

  test('Staff post an update without SMS', ({ given, when, then, and }) => {
    givenNone(given)
    whenOpen(when)
    write(and)
    post(and)
    then(/^the update is posted with title "(.*)" and no SMS$/, async (title) => {
      await waitFor(() => expect(world.posted).not.toBeNull())
      expect(world.posted).toEqual({
        campaignId: '9',
        title,
        body: 'Thank you all. The walls are finished.',
        imageUrl: '',
        smsDonors: false,
      })
    })
    told(and)
    listed(and)
  })

  test('Staff post an update and SMS everyone who has given', ({ given, when, then, and }) => {
    givenNone(given)
    whenOpen(when)
    write(and)
    and('they choose to also SMS everyone who has given', () => {
      fireEvent.click(screen.getByRole('checkbox', { name: /Also SMS everyone who has given/ }))
    })
    post(and)
    then(/^the update is posted with title "(.*)" and an SMS to donors$/, async (title) => {
      await waitFor(() => expect(world.posted).not.toBeNull())
      expect(world.posted).toMatchObject({ title, smsDonors: true })
    })
    told(and)
  })

  test('The server refuses an update', ({ given, when, then, and }) => {
    givenNone(given)
    and(/^the server will refuse with "(.*)"$/, (msg) => {
      world.refusal = msg
    })
    whenOpen(when)
    write(and)
    post(and)
    told(then)
  })

  test('Staff remove an update after confirming', ({ given, when, then, and }) => {
    givenUpdate(given)
    whenOpen(when)
    and(/^they remove "(.*)"$/, async (title) => {
      await clickWhenEnabled(/^Remove/, await itemFor(title))
    })
    and('they confirm the removal', async () => {
      const dialog = await screen.findByRole('alertdialog')
      await clickWhenEnabled('Remove update', dialog)
    })
    told(then)
    noneYet(and)
  })
})
