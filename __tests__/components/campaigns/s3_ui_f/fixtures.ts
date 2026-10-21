/**
 * Pledge fixtures for lane S3-UI-F tests, shaped like the GraphQL responses
 * (with __typename) so MockedProvider can write them to the cache.
 */

import type { Pledge } from '@/lib/types/fundraising'

export function pledge(o: Partial<Pledge> = {}): Pledge & { __typename: string } {
  return {
    __typename: 'PledgeType',
    id: '1',
    memberId: '11',
    memberName: 'Jane Wanjiku',
    campaignId: '9',
    campaignTitle: 'Church Building',
    campaignSlug: 'church-building',
    categoryId: '3',
    categoryName: 'Building Fund',
    amount: '50000.00',
    paid: '20000.00',
    balance: '30000.00',
    dueDate: '2026-12-31',
    status: 'OPEN',
    source: 'admin',
    createdAt: '2026-10-20T07:00:00Z',
    ...o,
  }
}

export function summary(pledged = '0.00', paid = '0.00', outstanding = '0.00', pledgeCount = 0) {
  return { __typename: 'PledgeSummaryType', pledged, paid, outstanding, pledgeCount }
}

export function pledgeResponse(success: boolean, message: string, p: Pledge | null = null) {
  return { __typename: 'PledgeResponse', success, message, pledge: p }
}
