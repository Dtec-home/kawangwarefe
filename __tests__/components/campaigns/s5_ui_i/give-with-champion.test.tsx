import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const push = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: { phoneNumber: '254798765432' } }) }))

import { CampaignGivePanel } from '@/components/campaigns/give/campaign-give-panel'
import { INITIATE_CAMPAIGN_CONTRIBUTION, PUBLIC_CAMPAIGN_FOR_GIVING } from '@/lib/graphql/fundraising/give'

const giving: MockedResponse = {
  request: { query: PUBLIC_CAMPAIGN_FOR_GIVING, variables: { slug: 'roof' } },
  result: {
    data: {
      publicCampaign: {
        __typename: 'PublicCampaignType',
        slug: 'roof',
        title: 'New Church Roof',
        summary: '',
        isAcceptingGifts: true,
        categoryId: '4',
        purposeId: null,
        campaignId: '42',
        paymentInstructions: {
          __typename: 'PaymentInstructionsType',
          paybillNumber: '247247',
          accountReference: 'ROOF',
          text: 'Pay Bill 247247, Account ROOF',
        },
        progress: {
          __typename: 'CampaignProgressType',
          target: '100000.00',
          raised: '24800.00',
          remaining: '75200.00',
          percent: 24.8,
          donorCount: 37,
          giftCount: 41,
          pledged: '0.00',
        },
      },
    },
  },
  maxUsageCount: 5,
}

const initiate = (variables: Record<string, unknown>): MockedResponse => ({
  request: { query: INITIATE_CAMPAIGN_CONTRIBUTION, variables },
  result: {
    data: {
      initiateContribution: {
        __typename: 'ContributionResponse',
        success: true,
        message: 'sent',
        checkoutRequestId: 'ws_1',
        contribution: { __typename: 'ContributionType', id: '77' },
      },
    },
  },
})

async function give(amount: string) {
  fireEvent.change(await screen.findByLabelText(/Amount/), { target: { value: amount } })
  const button = screen.getByRole('button', { name: /Send M-Pesa prompt/ })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
}

describe('CampaignGivePanel with a champion code', () => {
  it('sends the champion code and shows the champion account', async () => {
    push.mockReset()
    render(
      <MockedProvider
        mocks={[
          giving,
          initiate({ phoneNumber: '254798765432', amount: '500', categoryId: '4', campaignId: '42', championCode: 'JOHN' }),
        ]}
      >
        <CampaignGivePanel slug="roof" championCode="JOHN" />
      </MockedProvider>,
    )
    expect(await screen.findByTestId('paybill-account')).toHaveTextContent('ROOF JOHN')
    await give('500')
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringContaining('id=77')))
  })

  it("prefers the champion's own instructions from the server", async () => {
    render(
      <MockedProvider mocks={[giving]}>
        <CampaignGivePanel
          slug="roof"
          championCode="JOHN"
          paymentInstructions={{ paybillNumber: '247247', accountReference: 'ROOF-JOHN', text: '' }}
        />
      </MockedProvider>,
    )
    expect(await screen.findByTestId('paybill-account')).toHaveTextContent('ROOF-JOHN')
  })

  it('sends no champion code without one', async () => {
    push.mockReset()
    render(
      <MockedProvider
        mocks={[giving, initiate({ phoneNumber: '254798765432', amount: '300', categoryId: '4', campaignId: '42' })]}
      >
        <CampaignGivePanel slug="roof" />
      </MockedProvider>,
    )
    expect(await screen.findByTestId('paybill-account')).toHaveTextContent(/^ROOF$/)
    await give('300')
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringContaining('id=77')))
  })
})
