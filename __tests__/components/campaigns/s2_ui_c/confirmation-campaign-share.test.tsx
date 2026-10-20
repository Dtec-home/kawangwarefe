import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }))
vi.mock('next/navigation', () => ({ useSearchParams: () => nav.params }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { PUBLIC_CAMPAIGN_SHARE } from '@/lib/graphql/fundraising/public'
import { ConfirmationCampaignShare } from '@/components/campaigns/public/confirmation-campaign-share'

describe('ConfirmationCampaignShare', () => {
  afterEach(cleanup)

  it('renders nothing for an unknown campaign', async () => {
    nav.params = new URLSearchParams('campaign=gone')
    const query = vi.fn(() => ({ data: { publicCampaign: null } }))
    const { container } = render(
      <MockedProvider mocks={[{ request: { query: PUBLIC_CAMPAIGN_SHARE, variables: { slug: 'gone' } }, result: query }]}>
        <ConfirmationCampaignShare />
      </MockedProvider>,
    )
    await waitFor(() => expect(query).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 20))
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when the campaign cannot be loaded', async () => {
    nav.params = new URLSearchParams('campaign=roof')
    const { container } = render(
      <MockedProvider
        mocks={[{ request: { query: PUBLIC_CAMPAIGN_SHARE, variables: { slug: 'roof' } }, error: new Error('down') }]}
      >
        <ConfirmationCampaignShare />
      </MockedProvider>,
    )
    await new Promise((r) => setTimeout(r, 30))
    expect(container.innerHTML).toBe('')
  })

  it('ignores a blank campaign parameter', () => {
    nav.params = new URLSearchParams('campaign=%20%20')
    const { container } = render(
      <MockedProvider mocks={[]}>
        <ConfirmationCampaignShare />
      </MockedProvider>,
    )
    expect(container.innerHTML).toBe('')
  })
})
