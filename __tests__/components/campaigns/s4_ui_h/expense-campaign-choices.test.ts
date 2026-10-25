import { describe, it, expect } from 'vitest'

import { expenseCampaignChoices } from '@/components/campaigns/expense-select/expense-campaign-select'
import type { ExpenseCampaignOption } from '@/lib/graphql/fundraising/closeout'

const c = (id: string, categoryId: string, status: ExpenseCampaignOption['status'] = 'ACTIVE'): ExpenseCampaignOption => ({
  id,
  title: `Campaign ${id}`,
  status,
  categoryId,
  paybillCode: `C${id}`,
})

const ALL = [c('1', '4'), c('2', '5'), c('3', '4', 'CLOSED'), c('4', '4', 'PAUSED')]

describe('expenseCampaignChoices', () => {
  it('lists only the campaigns of the fund, keeping the server order', () => {
    expect(expenseCampaignChoices(ALL, '4', '').map((x) => x.campaign.id)).toEqual(['1', '3', '4'])
  })

  it('offers nothing until a fund is chosen', () => {
    expect(expenseCampaignChoices(ALL, '', '')).toEqual([])
    expect(expenseCampaignChoices(ALL, '', '1')).toEqual([])
  })

  it('offers nothing for a fund without campaigns', () => {
    expect(expenseCampaignChoices(ALL, '9', '')).toEqual([])
  })

  it('lets a closed campaign take a late bill', () => {
    const fresh = expenseCampaignChoices(ALL, '4', '')
    expect(fresh.find((x) => x.campaign.id === '3')?.disabled).toBe(false)
    expect(fresh.find((x) => x.campaign.id === '1')?.disabled).toBe(false)
  })

  it('disables a draft campaign unless the expense is already charged to it', () => {
    const draft = { ...ALL[0], id: '8', status: 'DRAFT' as const }
    expect(expenseCampaignChoices([...ALL, draft], '4', '').find((x) => x.campaign.id === '8')?.disabled).toBe(true)
    expect(expenseCampaignChoices([...ALL, draft], '4', '8').find((x) => x.campaign.id === '8')?.disabled).toBe(false)
  })

  it('keeps the currently selected campaign even when it is not one of the fund campaigns', () => {
    expect(expenseCampaignChoices(ALL, '4', '2').map((x) => x.campaign.id)).toEqual(['1', '3', '4', '2'])
    expect(expenseCampaignChoices(ALL, '9', '2').map((x) => x.campaign.id)).toEqual(['2'])
  })
})
