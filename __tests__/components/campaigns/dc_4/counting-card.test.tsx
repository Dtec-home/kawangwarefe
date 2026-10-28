/**
 * DC-4.2: asking for, approving, turning down and withdrawing a counting change.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))

import { CampaignCountingCard } from '@/components/campaigns/admin/counting/campaign-counting-card'
import {
  APPROVE_CAMPAIGN_COUNTING_MODE,
  REJECT_CAMPAIGN_COUNTING_MODE,
  REQUEST_CAMPAIGN_COUNTING_MODE,
} from '@/lib/graphql/fundraising/campaigns'
import { campaign } from '../s1_ui_a/fixtures'

type Overrides = Record<string, unknown>
const shamba = (o: Overrides = {}) =>
  campaign({ id: '9', title: 'Shamba', categoryName: 'Land Purchase', status: 'ACTIVE', ...o })

function response(field: string, success: boolean, message: string, o: Overrides = {}) {
  return { data: { [field]: { __typename: 'CampaignResponse', success, message, campaign: shamba(o) } } }
}

function renderCard(o: Overrides, mocks: unknown[] = []) {
  const onChanged = vi.fn()
  const c = shamba(o)
  render(
    <MockedProvider mocks={mocks as never}>
      <CampaignCountingCard campaign={c as never} onChanged={onChanged} />
    </MockedProvider>,
  )
  return { onChanged }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CampaignCountingCard', () => {
  it('on a draft, explains the choice is on the form and offers no request', () => {
    renderCard({ status: 'DRAFT' })
    expect(screen.getByText('Gifts to this campaign only')).toBeInTheDocument()
    expect(screen.getByText(/Set on the campaign form/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ask to count/ })).not.toBeInTheDocument()
  })

  it('asks for department counting after explaining the effect', async () => {
    const { onChanged } = renderCard({}, [
      {
        request: { query: REQUEST_CAMPAIGN_COUNTING_MODE, variables: { id: '9', mode: 'DEPARTMENT' } },
        result: response('requestCampaignCountingMode', true, 'Change sent for approval.', {
          requestedCountingMode: 'DEPARTMENT',
        }),
      },
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Ask to count all Land Purchase giving' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/every past and future Land Purchase gift is counted/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Another admin or pastor must approve it/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send for approval' }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Change sent for approval.'))
    expect(onChanged).toHaveBeenCalled()
  })

  it('shows a waiting request; the requester can only withdraw it, with a reason', async () => {
    const { onChanged } = renderCard(
      { requestedCountingMode: 'DEPARTMENT', countingModeRequestedBy: 'Grace Admin', canApproveCountingMode: false },
      [
        {
          request: { query: REJECT_CAMPAIGN_COUNTING_MODE, variables: { id: '9', reason: 'Asked by mistake' } },
          result: response('rejectCampaignCountingMode', true, 'Change turned down.'),
        },
      ],
    )
    expect(screen.getByText('Waiting for a second approver')).toBeInTheDocument()
    expect(screen.getByText(/asked by Grace Admin/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve change' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw request' }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Withdraw request' })
    expect(confirm).toBeDisabled()
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'Asked by mistake' } })
    fireEvent.click(confirm)
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
  })

  it('lets a second approver approve', async () => {
    const { onChanged } = renderCard(
      { requestedCountingMode: 'DEPARTMENT', countingModeRequestedBy: 'Grace Admin', canApproveCountingMode: true },
      [
        {
          request: { query: APPROVE_CAMPAIGN_COUNTING_MODE, variables: { id: '9' } },
          result: response('approveCampaignCountingMode', true, 'Change approved.', { countingMode: 'DEPARTMENT' }),
        },
      ],
    )
    fireEvent.click(screen.getByRole('button', { name: 'Approve change' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve change' }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Change approved.'))
    expect(onChanged).toHaveBeenCalled()
  })

  it("shows the server's refusal and keeps the dialog open", async () => {
    const { onChanged } = renderCard(
      { requestedCountingMode: 'DEPARTMENT', canApproveCountingMode: true },
      [
        {
          request: { query: APPROVE_CAMPAIGN_COUNTING_MODE, variables: { id: '9' } },
          result: response(
            'approveCampaignCountingMode',
            false,
            'Old Shamba already counts all Land Purchase giving. Switch it to its own gifts first.',
          ),
        },
      ],
    )
    fireEvent.click(screen.getByRole('button', { name: 'Approve change' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve change' }))
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        'Old Shamba already counts all Land Purchase giving. Switch it to its own gifts first.',
      ),
    )
    expect(onChanged).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('offers switching back to gifts-only on a department-backed campaign', () => {
    renderCard({ countingMode: 'DEPARTMENT' })
    expect(screen.getByText('All Land Purchase giving')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask to count gifts to this campaign only' })).toBeInTheDocument()
  })

  it('offers no change on a closed campaign', () => {
    renderCard({ status: 'CLOSED' })
    expect(screen.queryByRole('button', { name: /Ask to count/ })).not.toBeInTheDocument()
  })
})

describe('CampaignOverview with department counting', () => {
  it('shows the department badge, the counting card and the WhatsApp card', async () => {
    const { CampaignOverview } = await import('@/components/campaigns/admin/campaign-overview')
    const { GET_CAMPAIGN } = await import('@/lib/graphql/fundraising/campaigns')
    const data = shamba({
      countingMode: 'DEPARTMENT',
      whatsappGroupId: '120363278722742692@g.us',
      lastLeaderboardPost: {
        __typename: 'LeaderboardPostType', status: 'sent', attempts: 1, lastError: '',
        sentAt: '2026-10-28T07:05:00Z', createdAt: '2026-10-28T07:04:00Z',
      },
    })
    render(
      <MockedProvider mocks={[{ request: { query: GET_CAMPAIGN, variables: { id: '9' } }, result: { data: { campaign: data } } }]}>
        <CampaignOverview campaignId="9" />
      </MockedProvider>,
    )
    expect(await screen.findByTestId('campaign-department-backed')).toHaveTextContent('Counts all Land Purchase giving')
    expect(screen.getByTestId('campaign-counting')).toBeInTheDocument()
    expect(within(screen.getByTestId('leaderboard-delivery')).getByText('Sent')).toBeInTheDocument()
  })
})
