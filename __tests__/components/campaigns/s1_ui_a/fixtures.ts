/**
 * Campaign fixtures for lane S1-UI-A tests, shaped like the GraphQL responses
 * (with __typename) so MockedProvider can write them to the cache.
 */

import type { Campaign } from '@/lib/types/fundraising'

interface ListItemOverrides {
  id?: string
  title?: string
  paybillCode?: string
  categoryId?: string
  categoryName?: string
  status?: Campaign['status']
  endDate?: string | null
  raised?: string
  target?: string
}

export function progress(raised = '0.00', target = '100000.00', pledged = '0.00') {
  const percent = Number(target) > 0 ? (Number(raised) / Number(target)) * 100 : 0
  return {
    __typename: 'CampaignProgressType',
    target,
    raised,
    remaining: String(Math.max(Number(target) - Number(raised), 0).toFixed(2)),
    percent,
    donorCount: 12,
    giftCount: 15,
    pledged,
  }
}

export function listItem(o: ListItemOverrides = {}) {
  return {
    __typename: 'CampaignType',
    id: o.id ?? '1',
    title: o.title ?? 'Church Building',
    paybillCode: o.paybillCode ?? 'BUILD',
    categoryId: o.categoryId ?? '3',
    categoryName: o.categoryName ?? 'Building Fund',
    status: o.status ?? 'ACTIVE',
    endDate: o.endDate === undefined ? '2026-12-31' : o.endDate,
    progress: progress(o.raised, o.target),
  }
}
