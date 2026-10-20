import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'

import { GET_CAMPAIGNS } from '@/lib/graphql/fundraising/campaigns'
import { CampaignList, campaignHref } from '@/components/campaigns/admin/list/campaign-list'
import {
  CampaignStatusBadge,
  campaignStatusLabel,
} from '@/components/campaigns/admin/list/campaign-status-badge'
import { listItem } from './fixtures'

const request = { query: GET_CAMPAIGNS, variables: { status: null, search: null } }

afterEach(cleanup)

describe('CampaignList', () => {
  it('shows skeletons while loading', () => {
    render(
      <MockedProvider mocks={[{ request, result: { data: { campaigns: [] } }, delay: 10_000 }]}>
        <CampaignList />
      </MockedProvider>
    )
    expect(screen.getByTestId('campaigns-loading')).toBeInTheDocument()
  })

  it('reports a load error', async () => {
    render(
      <MockedProvider mocks={[{ request, error: new Error('boom') }]}>
        <CampaignList />
      </MockedProvider>
    )
    expect(await screen.findByText(/Could not load campaigns/)).toBeInTheDocument()
  })

  it('says when a campaign has no end date', async () => {
    render(
      <MockedProvider mocks={[{ request, result: { data: { campaigns: [listItem({ endDate: null })] } } }]}>
        <CampaignList />
      </MockedProvider>
    )
    expect((await screen.findAllByText(/No end date/)).length).toBeGreaterThan(0)
  })
})

describe('campaign status', () => {
  it.each([
    ['DRAFT', 'Draft'],
    ['PENDING_APPROVAL', 'Awaiting approval'],
    ['ACTIVE', 'Active'],
    ['PAUSED', 'Paused'],
    ['CLOSED', 'Closed'],
  ] as const)('labels %s as %s', (status, label) => {
    expect(campaignStatusLabel(status)).toBe(label)
    render(<CampaignStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('builds the campaign page link', () => {
    expect(campaignHref('42')).toBe('/admin/campaigns/42')
  })
})
