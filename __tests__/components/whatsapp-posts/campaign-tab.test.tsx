/** WA-3 / WA-2: a campaign's "WhatsApp posts" tab — inherit vs override, tagging switch, test post. */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'

const { toast, role } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  role: { isAdmin: false },
}))
vi.mock('sonner', () => ({ toast }))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => role }))

import { CampaignWhatsAppPostsTab } from '@/components/whatsapp-posts/campaign-post-settings-tab'
import { campaignToFormValues, toCampaignInput as toCampaignFormInput } from '@/components/campaigns/admin/form/campaign-form-schema'
import { GET_CAMPAIGN, UPDATE_CAMPAIGN } from '@/lib/graphql/fundraising/campaigns'
import {
  GET_CAMPAIGN_POST_SETTINGS,
  GET_WHATSAPP_POST_SETTINGS,
  PREVIEW_TOTALS_POST,
  SEND_TEST_TOTALS_POST,
  UPDATE_CAMPAIGN_POST_SETTINGS,
} from '@/lib/graphql/whatsapp-posts'
import { campaignDraft, toCampaignInput } from '@/lib/whatsapp-posts/inputs'
import type { CampaignPostSettingsInput } from '@/lib/whatsapp-posts/types'
import type { Campaign } from '@/lib/types/fundraising'

import { campaign as campaignFixture } from '../campaigns/s1_ui_a/fixtures'
import { PREVIEW_TEXT, campaignOverride, church } from '../../lib/whatsapp-posts/fixtures'

afterEach(() => {
  cleanup()
  toast.success.mockReset()
  toast.error.mockReset()
  role.isAdmin = false
})

const GROUP = '120363278722742692@g.us'
const theCampaign = (o: Record<string, unknown> = {}) =>
  campaignFixture({ status: 'ACTIVE', whatsappGroupId: GROUP, dailyTotalEnabled: true, dailyTotalPostWhenZero: false, whatsappMentionsEnabled: true, ...o })

const campaignMock = (c = theCampaign()): MockedResponse => ({
  request: { query: GET_CAMPAIGN, variables: { id: '9' } },
  result: { data: { campaign: c } },
  maxUsageCount: 5,
})
const overrideMock = (o = campaignOverride()): MockedResponse => ({
  request: { query: GET_CAMPAIGN_POST_SETTINGS, variables: { campaignId: '9' } },
  result: { data: { campaignPostSettings: o } },
  maxUsageCount: 5,
})
const previewMock = (input: CampaignPostSettingsInput, text = PREVIEW_TEXT): MockedResponse => ({
  request: { query: PREVIEW_TOTALS_POST, variables: { campaignId: '9', input } },
  result: { data: { previewTotalsPost: { __typename: 'TotalsPostPreview', text } } },
  maxUsageCount: 10,
})

function renderTab(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <CampaignWhatsAppPostsTab campaignId="9" previewDelayMs={10} />
    </MockedProvider>,
  )
}

describe('Campaign WhatsApp posts tab — inherit', () => {
  it('follows the church settings: switch on, summary, no editor', async () => {
    renderTab([campaignMock(), overrideMock(), previewMock({ useChurchDefault: true })])
    const follow = await screen.findByRole('switch', { name: 'Use the church settings' })
    expect(follow).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('church-schedule-summary')).toHaveTextContent('Hourly 08:00–20:00 when something changed, plus 23:50')
    expect(screen.queryByLabelText('Post every')).not.toBeInTheDocument()
    expect(await screen.findByTestId('totals-preview')).toHaveTextContent('Today: KES 5,000')
  })

  it('switching it off shows the editor with church hints', async () => {
    const draft = campaignDraft(campaignOverride())
    renderTab([campaignMock(), overrideMock(), previewMock({ useChurchDefault: true }), previewMock(toCampaignInput(draft, new Set(), false))])
    fireEvent.click(await screen.findByRole('switch', { name: 'Use the church settings' }))
    expect(screen.getByLabelText('Post every')).toHaveValue('60')
    expect(screen.getByText('Church: Hourly')).toBeInTheDocument()
    expect(screen.getByText('Church: 08:00')).toBeInTheDocument()
  })
})

describe('Campaign WhatsApp posts tab — override', () => {
  it('saves only the fields the campaign changed', async () => {
    const draft = campaignDraft(campaignOverride())
    const changed = { ...draft, intervalMinutes: 120 }
    const input = toCampaignInput(changed, new Set(['intervalMinutes']), false)
    const savedOverride = campaignOverride({ useChurchDefault: false, intervalMinutes: 120, effective: church({ intervalMinutes: 120 }) })
    const save: MockedResponse = {
      request: { query: UPDATE_CAMPAIGN_POST_SETTINGS, variables: { campaignId: '9', input } },
      result: { data: { updateCampaignPostSettings: { __typename: 'CampaignPostSettingsResult', success: true, message: 'WhatsApp post settings saved.', settings: savedOverride } } },
    }
    renderTab([
      campaignMock(), overrideMock(), previewMock({ useChurchDefault: true }),
      previewMock(toCampaignInput(draft, new Set(), false)), previewMock(input), save,
    ])
    fireEvent.click(await screen.findByRole('switch', { name: 'Use the church settings' }))
    fireEvent.change(screen.getByLabelText('Post every'), { target: { value: '120' } })
    expect(screen.getByText('Changed for this campaign')).toBeInTheDocument()
    expect(screen.getByTestId('schedule-summary')).toHaveTextContent('Every 2 hours 08:00–20:00')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('WhatsApp post settings saved.'))
  })

  it('shows a saved override and goes back to the church value', async () => {
    const o = campaignOverride({ useChurchDefault: false, intervalMinutes: 120, effective: church({ intervalMinutes: 120 }) })
    role.isAdmin = true
    const churchMock: MockedResponse = { request: { query: GET_WHATSAPP_POST_SETTINGS }, result: { data: { whatsappPostSettings: church() } } }
    renderTab([
      campaignMock(), overrideMock(o), churchMock,
      previewMock(toCampaignInput(campaignDraft(o), new Set(['intervalMinutes']), false)),
      previewMock(toCampaignInput({ ...campaignDraft(o), intervalMinutes: 60 }, new Set(), false)),
    ])
    expect(await screen.findByText('Changed for this campaign')).toBeInTheDocument()
    expect(screen.getByLabelText('Post every')).toHaveValue('120')
    fireEvent.click(await screen.findByRole('button', { name: 'Use the church value for Post every' }))
    await waitFor(() => expect(screen.getByLabelText('Post every')).toHaveValue('60'))
    expect(screen.getByText('Church: Hourly')).toBeInTheDocument()
  })

  it('without the church values, says the church value applies after saving', async () => {
    const o = campaignOverride({ useChurchDefault: false, intervalMinutes: 120, effective: church({ intervalMinutes: 120 }) })
    renderTab([campaignMock(), overrideMock(o), previewMock(toCampaignInput(campaignDraft(o), new Set(['intervalMinutes']), false))])
    fireEvent.click(await screen.findByRole('button', { name: 'Use the church value for Post every' }))
    expect(screen.getByText('Uses the church value once saved')).toBeInTheDocument()
  })
})

describe('Campaign WhatsApp posts tab — tagging and test post', () => {
  it('switches tagging off through updateCampaign, keeping everything else', async () => {
    const c = theCampaign()
    const input = { ...toCampaignFormInput(campaignToFormValues(c as unknown as Campaign), { countingEditable: false }), whatsappMentionsEnabled: false }
    const update: MockedResponse = {
      request: { query: UPDATE_CAMPAIGN, variables: { id: '9', input } },
      result: { data: { updateCampaign: { __typename: 'CampaignResponse', success: true, message: 'Campaign updated', campaign: { ...c, whatsappMentionsEnabled: false } } } },
    }
    renderTab([campaignMock(c), overrideMock(), previewMock({ useChurchDefault: true }), update])
    const tag = await screen.findByRole('switch', { name: 'Tag givers in group posts' })
    await waitFor(() => expect(tag).toHaveAttribute('aria-checked', 'true'))
    fireEvent.click(tag)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Givers will not be tagged in this campaign’s posts.'))
  })

  it('sends a test to the group', async () => {
    const test: MockedResponse = {
      request: { query: SEND_TEST_TOTALS_POST, variables: { campaignId: '9' } },
      result: { data: { sendTestTotalsPost: { __typename: 'MutationResult', success: true, message: 'Test post sent to the WhatsApp group.' } } },
    }
    renderTab([campaignMock(), overrideMock(), previewMock({ useChurchDefault: true }), test])
    const button = await screen.findByRole('button', { name: 'Send a test to the group now' })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Test post sent to the WhatsApp group.'))
  })

  it('cannot test without a group and says scheduled posts are off', async () => {
    renderTab([campaignMock(theCampaign({ whatsappGroupId: '', dailyTotalEnabled: false })), overrideMock(), previewMock({ useChurchDefault: true })])
    expect(await screen.findByText(/Add the campaign’s WhatsApp group on the campaign form first/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send a test to the group now' })).toBeDisabled()
    expect(screen.getByText(/Totals posts are off for this campaign/)).toBeInTheDocument()
  })

})
