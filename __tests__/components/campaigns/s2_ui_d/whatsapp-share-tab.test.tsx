import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import {
  WhatsAppShareTab,
  contributorsLabel,
  mayBeTruncated,
  shareLink,
  SAFE_SHARE_URL_LENGTH,
} from '@/components/campaigns/admin/whatsapp-share/whatsapp-share-tab'
import { GET_WHATSAPP_CONTRIBUTOR_LIST, RECORD_WHATSAPP_SHARE } from '@/lib/graphql/fundraising/whatsapp'
import { whatsappList } from './fixtures'

const listRequest = { query: GET_WHATSAPP_CONTRIBUTOR_LIST, variables: { campaignId: '9' } }
const recordRequest = { query: RECORD_WHATSAPP_SHARE, variables: { campaignId: '9' } }

function listMock(overrides = {}): MockedResponse {
  return {
    request: listRequest,
    result: { data: { whatsappContributorList: { __typename: 'WhatsAppContributorListType', ...whatsappList(overrides) } } },
  }
}

function renderTab(mocks: MockedResponse[]) {
  render(
    <MockedProvider mocks={mocks}>
      <WhatsAppShareTab campaignId="9" />
    </MockedProvider>
  )
}

async function clickWhenEnabled(name: string) {
  await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name }))
}

beforeEach(() => {
  vi.stubGlobal('open', vi.fn(() => null))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('helpers', () => {
  it('uses the server share link, else builds one from the text', () => {
    expect(shareLink({ shareUrl: 'https://wa.me/?text=x', text: 'ignored' })).toBe('https://wa.me/?text=x')
    expect(shareLink({ shareUrl: '', text: 'Hi all' })).toBe('https://wa.me/?text=Hi%20all')
  })

  it('flags links past the safe length', () => {
    expect(mayBeTruncated({ shareUrl: 'x'.repeat(SAFE_SHARE_URL_LENGTH), text: '' })).toBe(false)
    expect(mayBeTruncated({ shareUrl: 'x'.repeat(SAFE_SHARE_URL_LENGTH + 1), text: '' })).toBe(true)
  })

  it('pluralises the contributor count', () => {
    expect(contributorsLabel(1)).toBe('1 contributor')
    expect(contributorsLabel(0)).toBe('0 contributors')
  })
})

describe('WhatsAppShareTab', () => {
  it('shows a skeleton while loading', () => {
    renderTab([listMock()])
    expect(screen.getByTestId('whatsapp-loading')).toBeInTheDocument()
  })

  it('shows an error when the list cannot load', async () => {
    renderTab([{ request: listRequest, error: new Error('Not allowed') }])
    expect(await screen.findByText(/Could not load the contributor list: Not allowed/)).toBeInTheDocument()
  })

  it('does not record a share when the copy fails', async () => {
    const record = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) },
      configurable: true,
    })
    renderTab([listMock(), { request: { ...recordRequest, variables: () => (record(), true) }, result: { data: null } }])
    await clickWhenEnabled('Copy text')
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(expect.stringMatching(/Could not copy the list/)))
    expect(record).not.toHaveBeenCalled()
  })

  it('tells staff when recording the share fails on the network', async () => {
    renderTab([listMock(), { request: recordRequest, error: new Error('Network down') }])
    await clickWhenEnabled('Share list to WhatsApp')
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Network down'))
    expect(window.open).toHaveBeenCalled()
  })
})
