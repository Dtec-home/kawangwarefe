import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import { UpdatesTab, newestFirst } from '@/components/campaigns/admin/updates/updates-tab'
import { bodyParagraphs } from '@/components/campaigns/admin/updates/update-item'
import { EMPTY_DRAFT, validateDraft } from '@/components/campaigns/admin/updates/update-form'
import {
  GET_CAMPAIGN_UPDATES,
  POST_CAMPAIGN_UPDATE,
  REMOVE_CAMPAIGN_UPDATE,
} from '@/lib/graphql/fundraising/updates'
import { campaignUpdate } from './fixtures'

const listRequest = { query: GET_CAMPAIGN_UPDATES, variables: { campaignId: '9' } }

function renderTab(mocks: MockedResponse[]) {
  render(
    <MockedProvider mocks={mocks}>
      <UpdatesTab campaignId="9" />
    </MockedProvider>
  )
}

function listMock(updates: unknown[]): MockedResponse {
  return { request: listRequest, result: { data: { campaignUpdates: updates } }, maxUsageCount: 5 }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('newestFirst', () => {
  it('orders by publishedAt descending with unpublished last', () => {
    const sorted = newestFirst([
      campaignUpdate({ id: 'a', publishedAt: '2026-10-01T10:00:00+03:00' }),
      campaignUpdate({ id: 'b', publishedAt: null }),
      campaignUpdate({ id: 'c', publishedAt: '2026-10-15T10:00:00+03:00' }),
    ])
    expect(sorted.map((u) => u.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('bodyParagraphs', () => {
  it('splits on blank lines and drops empties', () => {
    expect(bodyParagraphs('One\nline two\n\n\n  Two  \n \nThree')).toEqual(['One\nline two', 'Two', 'Three'])
  })
})

describe('validateDraft', () => {
  it('requires a title and a message', () => {
    expect(validateDraft(EMPTY_DRAFT)).toEqual({ title: 'Give the update a title.', body: 'Write the update.' })
  })

  it('accepts an empty image and refuses one that is not a web address', () => {
    const draft = { ...EMPTY_DRAFT, title: 'T', body: 'B' }
    expect(validateDraft(draft)).toEqual({})
    expect(validateDraft({ ...draft, imageUrl: 'https://x.org/a.jpg' })).toEqual({})
    expect(validateDraft({ ...draft, imageUrl: 'roof.jpg' })).toHaveProperty('imageUrl')
  })
})

describe('UpdatesTab', () => {
  it('shows a skeleton while loading', () => {
    renderTab([listMock([])])
    expect(screen.getByTestId('updates-loading')).toBeInTheDocument()
  })

  it('shows an error when the updates cannot load', async () => {
    renderTab([{ request: listRequest, error: new Error('Not allowed') }])
    expect(await screen.findByText(/Could not load the updates: Not allowed/)).toBeInTheDocument()
  })

  it('renders the image and body paragraphs of an update', async () => {
    renderTab([
      listMock([
        {
          __typename: 'CampaignUpdateType',
          ...campaignUpdate({ imageUrl: 'https://img.example/roof.jpg', body: 'First.\n\nSecond.' }),
        },
      ]),
    ])
    const article = (await screen.findByRole('heading', { name: 'Foundation poured' })).closest('article') as HTMLElement
    expect(article.querySelector('img')).toHaveAttribute('src', 'https://img.example/roof.jpg')
    expect(within(article).getByText('First.')).toBeInTheDocument()
    expect(within(article).getByText('Second.')).toBeInTheDocument()
  })

  it('shows field errors and does not post an empty update', async () => {
    const post = vi.fn()
    renderTab([
      listMock([]),
      { request: { query: POST_CAMPAIGN_UPDATE, variables: () => (post(), true) }, result: { data: null } },
    ])
    await screen.findByText('No updates yet')
    fireEvent.click(screen.getByRole('button', { name: 'Post update' }))
    expect(await screen.findByText('Give the update a title.')).toBeInTheDocument()
    expect(screen.getByText('Write the update.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('reports a network error when posting', async () => {
    renderTab([
      listMock([]),
      {
        request: { query: POST_CAMPAIGN_UPDATE, variables: () => true },
        error: new Error('Network down'),
      },
    ])
    await screen.findByText('No updates yet')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'T' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post update' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Network down'))
  })

  it('keeps the update when removal is cancelled or refused', async () => {
    renderTab([
      listMock([{ __typename: 'CampaignUpdateType', ...campaignUpdate({ smsSentAt: '2026-10-01T10:00:00+03:00' }) }]),
      {
        request: { query: REMOVE_CAMPAIGN_UPDATE, variables: { id: '1' } },
        result: { data: { removeCampaignUpdate: { __typename: 'MutationResult', success: false, message: 'Not yours' } } },
      },
    ])
    fireEvent.click(await screen.findByRole('button', { name: 'Remove "Foundation poured"' }))
    let dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/cannot be recalled/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Remove "Foundation poured"' }))
    dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove update' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Not yours'))
    // The dialog stays open on a refusal so staff can retry or cancel.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Foundation poured', hidden: true })).toBeInTheDocument()
  })
})
