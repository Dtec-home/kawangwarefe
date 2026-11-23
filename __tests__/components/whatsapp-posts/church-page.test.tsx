/** WA-3: the church default screen (/admin/whatsapp-posts), admins only. */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React, { type ReactNode } from 'react'

const { toast, role } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  role: { isAdmin: true, loading: false },
}))
vi.mock('sonner', () => ({ toast }))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => role }))

import WhatsAppPostsPage from '@/app/(dashboard)/admin/whatsapp-posts/page'
import { GET_CAMPAIGNS } from '@/lib/graphql/fundraising/campaigns'
import {
  GET_WHATSAPP_GROUPS,
  GET_WHATSAPP_POST_SETTINGS,
  PREVIEW_TOTALS_POST,
  UPDATE_WHATSAPP_POST_SETTINGS,
} from '@/lib/graphql/whatsapp-posts'
import { toChurchInput, toFullOverrideInput, toSettings } from '@/lib/whatsapp-posts/inputs'

import { listItem } from '../campaigns/s1_ui_a/fixtures'
import { PREVIEW_TEXT, church } from '../../lib/whatsapp-posts/fixtures'

afterEach(() => {
  cleanup()
  toast.success.mockReset()
  toast.error.mockReset()
  role.isAdmin = true
})

const GROUPS = [
  { __typename: 'WhatsAppGroupType', id: '120363001@g.us', name: 'Kawangware Church' },
  { __typename: 'WhatsAppGroupType', id: '120363002@g.us', name: 'Building Committee' },
]

const settingsMock = (saved = church()): MockedResponse => ({
  request: { query: GET_WHATSAPP_POST_SETTINGS },
  result: { data: { whatsappPostSettings: saved } },
  maxUsageCount: 5,
})
const campaignsMock = (items = [listItem({ id: '9', title: 'Church Building' })]): MockedResponse => ({
  request: { query: GET_CAMPAIGNS, variables: { status: null, search: null } },
  result: { data: { campaigns: items } },
  maxUsageCount: 5,
})
const groupsOk: MockedResponse = { request: { query: GET_WHATSAPP_GROUPS }, result: { data: { whatsappGroups: GROUPS } } }
const groupsDown: MockedResponse = {
  request: { query: GET_WHATSAPP_GROUPS },
  result: { errors: [{ message: 'The WhatsApp gateway did not answer: timeout' }] } as never,
}
const previewMock = (input = toFullOverrideInput(toSettings(church()))): MockedResponse => ({
  request: { query: PREVIEW_TOTALS_POST, variables: { campaignId: '9', input } },
  result: { data: { previewTotalsPost: { __typename: 'TotalsPostPreview', text: PREVIEW_TEXT } } },
  maxUsageCount: 10,
})

function renderPage(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <WhatsAppPostsPage />
    </MockedProvider>,
  )
}

describe('Church WhatsApp posts page', () => {
  it('shows the church settings, the groups and a preview with a campaign', async () => {
    renderPage([settingsMock(church({ churchWhatsappGroupId: '120363001@g.us' })), campaignsMock(), groupsOk, previewMock()])
    expect(await screen.findByRole('heading', { name: 'WhatsApp posts' })).toBeInTheDocument()
    expect(await screen.findByTestId('schedule-summary')).toHaveTextContent('Hourly 08:00–20:00 when something changed, plus 23:50')
    const select = await screen.findByLabelText('Church WhatsApp group')
    await waitFor(() => expect(select).toHaveValue('120363001@g.us'))
    expect(screen.getByRole('option', { name: 'Building Committee' })).toBeInTheDocument()
    expect(screen.getByLabelText('Preview with')).toHaveValue('9')
    expect(await screen.findByTestId('totals-preview')).toHaveTextContent('Today: KES 5,000 from 3 givers')
    expect(screen.queryByRole('button', { name: 'Send a test to the group now' })).not.toBeInTheDocument()
  })

  it('says when the gateway is down and retries', async () => {
    renderPage([settingsMock(), campaignsMock(), groupsDown, groupsOk, previewMock()])
    expect(await screen.findByText(/The WhatsApp gateway did not answer: timeout/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('option', { name: 'Kawangware Church' })).toBeInTheDocument()
  })

  it('keeps a saved group the gateway does not list', async () => {
    renderPage([settingsMock(church({ churchWhatsappGroupId: '999@g.us' })), campaignsMock(), groupsDown, previewMock()])
    const select = await screen.findByLabelText('Church WhatsApp group')
    await waitFor(() => expect(select).toHaveValue('999@g.us'))
  })

  it('saves every setting with the chosen group', async () => {
    const draft = toSettings(church())
    const input = toChurchInput({ ...draft, introText: 'Karibu' }, '120363002@g.us')
    const saved = church({ introText: 'Karibu', churchWhatsappGroupId: '120363002@g.us' })
    const save: MockedResponse = {
      request: { query: UPDATE_WHATSAPP_POST_SETTINGS, variables: { input } },
      result: { data: { updateWhatsappPostSettings: { __typename: 'WhatsAppPostSettingsResult', success: true, message: 'WhatsApp post settings saved.', settings: saved } } },
    }
    renderPage([settingsMock(), campaignsMock(), groupsOk, previewMock(), previewMock(toFullOverrideInput({ ...draft, introText: 'Karibu' })), save])
    await screen.findByRole('option', { name: 'Building Committee' })
    fireEvent.change(screen.getByLabelText('Church WhatsApp group'), { target: { value: '120363002@g.us' } })
    fireEvent.change(screen.getByLabelText('Intro text'), { target: { value: 'Karibu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('WhatsApp post settings saved.'))
  })

  it('shows the server refusal', async () => {
    const input = toChurchInput(toSettings(church()), '')
    const save: MockedResponse = {
      request: { query: UPDATE_WHATSAPP_POST_SETTINGS, variables: { input } },
      result: { data: { updateWhatsappPostSettings: { __typename: 'WhatsAppPostSettingsResult', success: false, message: 'The window must start before it ends.', settings: null } } },
    }
    renderPage([settingsMock(), campaignsMock(), groupsOk, previewMock(), save])
    await screen.findByTestId('schedule-summary')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The window must start before it ends.')
  })

  it('explains the preview needs a campaign', async () => {
    renderPage([settingsMock(), campaignsMock([]), groupsOk])
    expect(await screen.findByText(/Create a campaign to see a preview/)).toBeInTheDocument()
  })

  it('is for admins only', async () => {
    role.isAdmin = false
    renderPage([])
    expect(await screen.findByText('Only admins change the WhatsApp posts')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})
