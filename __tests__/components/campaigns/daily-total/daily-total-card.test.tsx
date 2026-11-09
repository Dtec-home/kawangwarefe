/** DT-2: the Daily total card on the Share list tab (ADR-0015 D5). */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

import { DailyTotalCard, lastAutoPostLine, nairobiToday } from '@/components/campaigns/admin/whatsapp-share/daily-total-card'
import { CAMPAIGN_DAILY_TOTAL, POST_DAILY_TOTAL_NOW, RECORD_DAILY_TOTAL_SHARE } from '@/lib/graphql/fundraising/daily-total'

const TODAY = nairobiToday()
const total = (over: Record<string, unknown> = {}) => ({
  __typename: 'DailyTotalType', day: TODAY, text: '📢 *Shamba*\n*Today*\nKES 1,500 from 2 givers', shareUrl: 'https://wa.me/?text=x',
  amountToday: '1500.00', giversToday: 2, giftsToday: 2, lateRecordedToday: '0.00', raised: '9000.00', hasGroup: true,
  lastAutoPost: null, ...over,
})
const query = (over = {}, date = TODAY) => ({
  request: { query: CAMPAIGN_DAILY_TOTAL, variables: { campaignId: '5', date } },
  result: { data: { campaignDailyTotal: total(over) } },
  maxUsageCount: 5,
})
const result = (field: string, success: boolean, message: string) => ({ data: { [field]: { __typename: 'MutationResult', success, message } } })

beforeEach(() => { toast.success.mockClear(); toast.error.mockClear() })

describe('DailyTotalCard', () => {
  it("previews today's total", async () => {
    render(<MockedProvider mocks={[query()]}><DailyTotalCard campaignId="5" /></MockedProvider>)
    expect(await screen.findByTestId('daily-total-preview')).toHaveTextContent('KES 1,500 from 2 givers')
    expect(screen.getByTestId('daily-total-givers')).toHaveTextContent('2')
    expect(screen.getByLabelText('Day')).toHaveValue(TODAY)
  })

  it('posts to the group, then shows the wait message', async () => {
    const post = (success: boolean, message: string) => ({
      request: { query: POST_DAILY_TOTAL_NOW, variables: { campaignId: '5', date: TODAY } },
      result: result('postDailyTotalNow', success, message),
    })
    render(<MockedProvider mocks={[query(), post(true, 'Posted to the WhatsApp group.'), post(false, 'Please wait 10 minutes')]}>
      <DailyTotalCard campaignId="5" /></MockedProvider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Post to group now' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Posted to the WhatsApp group.'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Post to group now' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Post to group now' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please wait 10 minutes'))
  })

  it('hides Post to group now when the campaign has no group', async () => {
    render(<MockedProvider mocks={[query({ hasGroup: false })]}><DailyTotalCard campaignId="5" /></MockedProvider>)
    await screen.findByTestId('daily-total-preview')
    expect(screen.queryByRole('button', { name: 'Post to group now' })).not.toBeInTheDocument()
  })

  it('records a share when the text is copied', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    render(<MockedProvider mocks={[query(), { request: { query: RECORD_DAILY_TOTAL_SHARE, variables: { campaignId: '5' } },
      result: result('recordWhatsappShare', true, 'List share recorded.') }]}><DailyTotalCard campaignId="5" /></MockedProvider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Copy text' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Daily total copied. Paste it into the church group.'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(total().text)
  })

  it('a past day can be chosen', async () => {
    render(<MockedProvider mocks={[query(), query({ day: '2026-11-02', amountToday: '700.00' }, '2026-11-02')]}>
      <DailyTotalCard campaignId="5" /></MockedProvider>)
    await screen.findByTestId('daily-total-preview')
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2026-11-02' } })
    await waitFor(() => expect(screen.getByTestId('daily-total-amount')).toHaveTextContent('KES 700.00'))
  })
})

describe('lastAutoPostLine', () => {
  it.each([
    [null, 'Last daily total: none yet'],
    [{ status: 'skipped', day: '2026-11-02', sentAt: null, reason: 'no_gifts' }, 'Last daily total for Mon 2 Nov: not sent (no gifts that day)'],
    [{ status: 'failed', day: '2026-11-02', sentAt: null, reason: 'gave up after 8 attempts' }, 'Last daily total for Mon 2 Nov: failed (gave up after 8 attempts)'],
  ])('%j', (post, line) => {
    expect(lastAutoPostLine(post)).toBe(line)
  })

  it('a sent post says when', () => {
    expect(lastAutoPostLine({ status: 'sent', day: '2026-11-02', sentAt: '2026-11-02T20:50:00Z', reason: '' }))
      .toMatch(/^Last daily total for Mon 2 Nov: sent /)
  })
})
