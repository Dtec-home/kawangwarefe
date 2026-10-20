/** Test data for lane S2-UI-D (campaign updates and the WhatsApp contributor list). */

import type { CampaignUpdate, WhatsAppContributorList } from '@/lib/types/fundraising'

export function campaignUpdate(overrides: Partial<CampaignUpdate> = {}): CampaignUpdate {
  return {
    id: '1',
    title: 'Foundation poured',
    body: 'The foundation is done.\n\nThank you for giving.',
    imageUrl: '',
    publishedAt: '2026-10-01T10:00:00+03:00',
    smsSentAt: null,
    postedByName: 'Jane Wanjiku',
    ...overrides,
  }
}

export const LIST_TEXT = [
  '*Church Building* contributors',
  '1. Jane Wanjiku: KES 50,000',
  '2. Peter Otieno: KES 25,000',
  '_List as at 20 Oct 2026 9:00am_',
].join('\n')

export function whatsappList(overrides: Partial<WhatsAppContributorList> = {}): WhatsAppContributorList {
  const text = overrides.text ?? LIST_TEXT
  return {
    text,
    contributorCount: 2,
    totalAmount: '75000.00',
    asAt: '2026-10-20T09:00:00+03:00',
    shareUrl: `https://wa.me/?text=${encodeURIComponent(text)}`,
    ...overrides,
  }
}
