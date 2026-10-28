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

export function campaign(o: Record<string, unknown> = {}) {
  return {
    __typename: 'CampaignType',
    id: '9',
    title: 'Church Building',
    slug: 'church-building',
    summary: 'A new sanctuary for Kawangware.',
    story: 'We have outgrown the old hall.',
    coverImageUrl: '',
    gallery: [],
    categoryId: '3',
    categoryName: 'Building Fund',
    purposeId: null,
    purposeName: null,
    targetAmount: '1000000.00',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    paybillCode: 'BUILD',
    whatsappGroupId: '',
    status: 'DRAFT',
    isPublic: true,
    allowPledges: true,
    allowChampions: false,
    reminderPolicy: { __typename: 'ReminderPolicyType', frequency: 'monthly', daysBeforeDue: 3, overdueNotices: 1 },
    createdByName: 'Grace Admin',
    approvedByName: null,
    approvedAt: null,
    closedAt: null,
    createdAt: '2026-10-20T07:00:00Z',
    publicUrl: 'https://church.example/campaigns/church-building',
    paymentInstructions: {
      __typename: 'PaymentInstructionsType',
      paybillNumber: '247247',
      accountReference: 'BUILD',
      text: 'Pay Bill 247247, Account BUILD',
    },
    progress: progress('250000.00', '1000000.00', '100000.00'),
    canApprove: false,
    countingMode: 'TAGGED',
    requestedCountingMode: null,
    countingModeRequestedBy: null,
    canApproveCountingMode: false,
    lastLeaderboardPost: null,
    ...o,
  }
}

export function category(id: string, name: string, code: string) {
  return {
    __typename: 'ContributionCategoryType',
    id,
    name,
    code,
    description: '',
    isActive: true,
    routingMode: 'direct',
    fallbackIfNoGroup: false,
    audience: 'all',
    hasAutoSplit: false,
    tracksMemberIdentifier: false,
    identifierLabel: '',
    identifierFormat: '',
    allowedGroups: [],
  }
}

export function role(o: { isStaff?: boolean; isCategoryAdmin?: boolean; adminCategoryIds?: string[] } = {}) {
  return {
    __typename: 'UserRoleInfo',
    isAuthenticated: true,
    isStaff: o.isStaff ?? true,
    isCategoryAdmin: o.isCategoryAdmin ?? false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: true,
    isRecorder: false,
    canVoidReceipts: false,
    isAdmin: o.isStaff ?? true,
    isTreasurer: false,
    adminCategoryIds: o.adminCategoryIds ?? [],
    adminGroupNames: [],
    adminCategories: [],
  }
}
