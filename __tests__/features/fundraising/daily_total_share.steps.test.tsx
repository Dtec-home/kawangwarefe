/** Web binding for `fundraising/daily_total_share.feature` (@web, DT-2). */
import { defineFeature, loadFeature } from 'jest-cucumber'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { vi } from 'vitest'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

import { DailyTotalCard, nairobiToday } from '@/components/campaigns/admin/whatsapp-share/daily-total-card'
import { CAMPAIGN_DAILY_TOTAL, POST_DAILY_TOTAL_NOW } from '@/lib/graphql/fundraising/daily-total'

const feature = loadFeature('./daily_total_share.feature', { loadRelativePath: true })
const TODAY = nairobiToday()

defineFeature(feature, (test) => {
  test('A treasurer posts the daily total to the group', ({ given, when, then }) => {
    let mocks: unknown[] = []
    given(/^the daily total for Shamba today is (.*) from (\d+) givers$/, (amount: string, givers: string) => {
      const post = (success: boolean, message: string) => ({
        request: { query: POST_DAILY_TOTAL_NOW, variables: { campaignId: '5', date: TODAY } },
        result: { data: { postDailyTotalNow: { __typename: 'MutationResult', success, message } } },
      })
      mocks = [
        { request: { query: CAMPAIGN_DAILY_TOTAL, variables: { campaignId: '5', date: TODAY } }, maxUsageCount: 5,
          result: { data: { campaignDailyTotal: {
            __typename: 'DailyTotalType', day: TODAY, text: `📢 *Shamba*\n${amount} from ${givers} givers`, shareUrl: '',
            amountToday: '1500.00', giversToday: Number(givers), giftsToday: 2, lateRecordedToday: '0.00',
            raised: '1500.00', hasGroup: true, lastAutoPost: null } } } },
        post(true, 'Posted to the WhatsApp group.'),
        post(false, 'The daily total was posted a few minutes ago. Please wait 10 minutes before posting again.'),
      ]
    })
    when('the treasurer opens the daily total card', () => {
      render(<MockedProvider mocks={mocks as never}><DailyTotalCard campaignId="5" /></MockedProvider>)
    })
    then(/^the preview says "(.*)"$/, async (text: string) => {
      expect(await screen.findByTestId('daily-total-preview')).toHaveTextContent(text)
    })
    when(/^the treasurer taps "(.*)"$/, (name: string) => {
      fireEvent.click(screen.getByRole('button', { name }))
    })
    then(/^they are told "(.*)"$/, async (message: string) => {
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(message))
    })
    when(/^the treasurer taps "(.*)" again$/, async (name: string) => {
      await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled())
      fireEvent.click(screen.getByRole('button', { name }))
    })
    then('they are told to wait', async () => {
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Please wait')))
    })
  })
})
