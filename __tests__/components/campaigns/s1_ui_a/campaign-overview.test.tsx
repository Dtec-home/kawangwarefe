import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import { CampaignOverview, statusActionsFor } from '@/components/campaigns/admin/campaign-overview'
import { GET_CAMPAIGN } from '@/lib/graphql/fundraising/campaigns'
import { campaign } from './fixtures'

const request = { query: GET_CAMPAIGN, variables: { id: '9' } }

function renderWith(result: unknown) {
  render(
    <MockedProvider mocks={[{ request, result: { data: { campaign: result } } }]}>
      <CampaignOverview campaignId="9" />
    </MockedProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('statusActionsFor', () => {
  it.each([
    ['DRAFT', false, ['Submit for approval']],
    ['PENDING_APPROVAL', true, ['Approve']],
    ['PENDING_APPROVAL', false, []],
    ['ACTIVE', false, ['Pause']],
    ['PAUSED', false, ['Resume']],
    ['CLOSED', true, []],
  ] as const)('%s (canApprove %s) offers %j', (status, canApprove, labels) => {
    expect(statusActionsFor({ status, canApprove }).map((a) => a.label)).toEqual(labels)
  })
})

describe('CampaignOverview', () => {
  it('shows a skeleton while loading', () => {
    renderWith(campaign())
    expect(screen.getByTestId('campaign-loading')).toBeInTheDocument()
  })

  it('says when the campaign is not found', async () => {
    renderWith(null)
    expect(await screen.findByText('Campaign not found')).toBeInTheDocument()
  })

  it('offers neither edit nor status actions on a closed campaign', async () => {
    renderWith(campaign({ status: 'CLOSED', approvedAt: '2026-10-21T07:00:00Z', approvedByName: 'Pastor John' }))
    expect(await screen.findByText(/Pastor John/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pause|Resume|Approve|Submit/ })).not.toBeInTheDocument()
  })

  it('requires a reason to return a campaign to draft', async () => {
    renderWith(campaign({ status: 'PENDING_APPROVAL', canApprove: true }))
    fireEvent.click(await screen.findByRole('button', { name: 'Return to draft' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'no' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Return to draft' }))
    expect(await within(dialog).findByText(/at least 5 characters/)).toBeInTheDocument()
  })

  it('reports a failed copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    renderWith(campaign())
    fireEvent.click(await screen.findByRole('button', { name: /Copy link/ }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Could not copy the link'))
  })
})
