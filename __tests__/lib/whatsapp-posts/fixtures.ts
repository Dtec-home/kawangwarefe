/** Shared WhatsApp-post fixtures (WA-3), shaped like the GraphQL answers. */

import type { ChurchPostSettings, CampaignPostSettings, PostBlock, PostSettings } from '@/lib/whatsapp-posts/types'

const BLOCK_SPECS: Array<[string, string, string]> = [
  ['header', 'Campaign name', '📢 and the campaign title'],
  ['intro', 'Intro text', 'Your own opening words'],
  ['date_line', 'Date and time', "Today's date and the time of the post"],
  ['today_amount', "Today's total", 'Money given today and by how many givers'],
  ['late_recorded', 'Recorded late', 'Money recorded today for earlier days'],
  ['raised_so_far', 'Raised so far', 'The campaign total and % of the target'],
  ['pledged', 'Pledged', 'Money pledged'],
  ['given_today', 'Who gave today', 'Each giver today and how much'],
  ['given_earlier_days', 'Recorded for earlier days', 'Givers recorded today for earlier days'],
  ['thank_you', 'Thank-you line', "🙏 Thank you, tagging today's givers"],
  ['closing', 'Closing text', 'Your own closing words'],
  ['give_footer', 'How to give', 'Pay Bill, account and the campaign page'],
]

export function blocks(enabledAll = false): PostBlock[] {
  return BLOCK_SPECS.map(([block, label, description]) => ({
    __typename: 'WhatsAppPostBlock',
    block,
    label,
    description,
    enabled: enabledAll || block !== 'thank_you',
  })) as PostBlock[]
}

export function available(): PostBlock[] {
  return blocks().map((b) => ({ ...b, enabled: false }))
}

export function settings(o: Partial<PostSettings> = {}): PostSettings {
  return {
    scheduleKind: 'interval',
    intervalMinutes: 60,
    windowStart: '08:00',
    windowEnd: '20:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    fixedTimes: [],
    finalPostTime: '23:50',
    onlyWhenChanged: true,
    postWhenZero: false,
    layout: blocks(),
    introText: '',
    closingText: '',
    ...o,
  }
}

export function church(o: Partial<ChurchPostSettings> = {}): ChurchPostSettings {
  return {
    __typename: 'WhatsAppPostSettingsType',
    ...settings(),
    churchWhatsappGroupId: '',
    availableBlocks: available(),
    ...o,
  } as ChurchPostSettings
}

export function campaignOverride(o: Partial<CampaignPostSettings> = {}): CampaignPostSettings {
  return {
    __typename: 'CampaignPostSettingsType',
    campaignId: '9',
    useChurchDefault: true,
    scheduleKind: null,
    intervalMinutes: null,
    windowStart: null,
    windowEnd: null,
    daysOfWeek: null,
    fixedTimes: null,
    finalPostTime: null,
    noFinalPost: false,
    onlyWhenChanged: null,
    postWhenZero: null,
    layout: null,
    introText: null,
    closingText: null,
    effective: church(),
    ...o,
  } as CampaignPostSettings
}

export const PREVIEW_TEXT =
  '*📢 Church Building*\nMon 23 Nov 2026, 10:00\nToday: KES 5,000 from 3 givers\n\n1. Kamau N. – KES 2,000'
