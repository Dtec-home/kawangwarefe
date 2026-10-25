import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))
const push = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: { phoneNumber: '254798765432' } }) }))

import { PaybillInstructions } from '@/components/campaigns/give/paybill-instructions'
import { CampaignStkForm } from '@/components/campaigns/give/campaign-stk-form'
import { INITIATE_CAMPAIGN_CONTRIBUTION } from '@/lib/graphql/fundraising/give'

const instructions = { paybillNumber: '247247', accountReference: 'BUILD', text: 'Pay Bill 247247, Account BUILD' }

describe('PaybillInstructions', () => {
  beforeEach(() => {
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('copies the account reference', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<PaybillInstructions instructions={instructions} />)
    fireEvent.click(screen.getByRole('button', { name: /Copy account/ }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('BUILD'))
    expect(toast.success).toHaveBeenCalled()
  })

  it('reports a failed copy', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } })
    render(<PaybillInstructions instructions={instructions} />)
    fireEvent.click(screen.getByRole('button', { name: /Copy account/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('CampaignStkForm', () => {
  const renderForm = () =>
    render(
      <MockedProvider mocks={[]}>
        <CampaignStkForm slug="roof" categoryId="4" campaignId="42" />
      </MockedProvider>
    )

  it("prefills the signed-in giver's phone", () => {
    renderForm()
    expect(screen.getByLabelText(/Phone Number/)).toHaveValue('798765432')
  })

  it('rejects an invalid phone and an amount below KES 1', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: '0.5' } })
    fireEvent.click(screen.getByRole('button', { name: /Send M-Pesa prompt/ }))
    expect(await screen.findByText(/valid Safaricom or Airtel number/)).toBeInTheDocument()
    expect(screen.getByText(/at least KES 1/)).toBeInTheDocument()
  })

  it("sends the campaign's purpose so an auto-split department never splits the gift", async () => {
    const mock = {
      request: {
        query: INITIATE_CAMPAIGN_CONTRIBUTION,
        variables: { phoneNumber: '254798765432', amount: '500', categoryId: '4', purposeId: '9', campaignId: '42' },
      },
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
    }
    render(
      <MockedProvider mocks={[mock]}>
        <CampaignStkForm slug="roof" categoryId="4" purposeId="9" campaignId="42" />
      </MockedProvider>
    )
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: /Send M-Pesa prompt/ }))
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringContaining('id=77')))
  })
})
