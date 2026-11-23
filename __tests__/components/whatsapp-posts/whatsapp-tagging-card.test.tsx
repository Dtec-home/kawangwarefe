/** WA-2 (US-21): the member's "Tag me in WhatsApp group thank-yous" switch. */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast }))

import { WhatsAppTaggingCard } from '@/components/whatsapp-posts/whatsapp-tagging-card'
import { GET_MY_WHATSAPP_TAGGING, SET_WHATSAPP_TAGGING } from '@/lib/graphql/whatsapp-posts'

afterEach(() => {
  cleanup()
  toast.success.mockReset()
  toast.error.mockReset()
})

const me = (whatsappTagging: boolean): MockedResponse => ({
  request: { query: GET_MY_WHATSAPP_TAGGING },
  result: { data: { me: { __typename: 'MemberType', id: '1', whatsappTagging } } },
})
const setTo = (enabled: boolean, success = true, message = 'You will no longer be tagged in WhatsApp posts.'): MockedResponse => ({
  request: { query: SET_WHATSAPP_TAGGING, variables: { enabled } },
  result: { data: { setWhatsappTagging: { __typename: 'MutationResult', success, message } } },
})

describe('WhatsAppTaggingCard', () => {
  it('shows the switch on by default and says what tagging means', async () => {
    render(<MockedProvider mocks={[me(true)]}><WhatsAppTaggingCard /></MockedProvider>)
    const toggle = await screen.findByRole('switch', { name: 'Tag me in WhatsApp group thank-yous' })
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(screen.getByText(/@your name/)).toBeInTheDocument()
  })

  it('switches tagging off and says so', async () => {
    render(<MockedProvider mocks={[me(true), setTo(false)]}><WhatsAppTaggingCard /></MockedProvider>)
    const toggle = await screen.findByRole('switch', { name: 'Tag me in WhatsApp group thank-yous' })
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    fireEvent.click(toggle)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('You will no longer be tagged in WhatsApp posts.'))
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('puts the switch back when the server refuses', async () => {
    render(<MockedProvider mocks={[me(false), setTo(true, false, 'No member record for this account.')]}><WhatsAppTaggingCard /></MockedProvider>)
    const toggle = await screen.findByRole('switch', { name: 'Tag me in WhatsApp group thank-yous' })
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    fireEvent.click(toggle)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No member record for this account.'))
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('shows nothing without a member record', async () => {
    const { container } = render(
      <MockedProvider mocks={[{ request: { query: GET_MY_WHATSAPP_TAGGING }, result: { data: { me: null } } }]}>
        <WhatsAppTaggingCard />
      </MockedProvider>,
    )
    await waitFor(() => expect(container.querySelector('[data-testid="whatsapp-tagging-card"]')).toBeNull())
  })
})
