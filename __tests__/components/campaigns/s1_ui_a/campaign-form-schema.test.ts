import { describe, it, expect } from 'vitest'

import {
  EMPTY_CAMPAIGN_FORM,
  campaignFormSchema,
  campaignToFormValues,
  normalisePaybillCode,
  toCampaignInput,
  type CampaignFormValues,
} from '@/components/campaigns/admin/form/campaign-form-schema'
import type { Campaign } from '@/lib/types/fundraising'
import { campaign } from './fixtures'

const valid: CampaignFormValues = {
  ...EMPTY_CAMPAIGN_FORM,
  title: 'Church Building',
  categoryId: '3',
  targetAmount: '1000000',
  paybillCode: 'BUILD',
}

function errorsFor(values: Partial<CampaignFormValues>) {
  const result = campaignFormSchema.safeParse({ ...valid, ...values })
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
}

describe('campaignFormSchema', () => {
  it('accepts a minimal campaign', () => {
    expect(errorsFor({})).toEqual([])
  })

  it.each(['B', 'build', 'BUILD-1', 'ABCDEFGHIJK'])('rejects Pay Bill code %s', (code) => {
    expect(errorsFor({ paybillCode: code })).toEqual([
      'paybillCode: Use 2 to 10 capital letters or digits, e.g. BUILD',
    ])
  })

  it.each(['0', '0.50', 'abc', '-5', '10.123', ''])('rejects target %s', (target) => {
    expect(errorsFor({ targetAmount: target })).toEqual(['targetAmount: Enter a target of at least KES 1'])
  })

  it('requires a department and a title', () => {
    expect(errorsFor({ categoryId: '', title: 'x' })).toHaveLength(2)
  })

  it('rejects an end date before the start date but allows the same day', () => {
    expect(errorsFor({ startDate: '2026-12-01', endDate: '2026-11-01' })).toEqual([
      'endDate: The end date cannot be before the start date',
    ])
    expect(errorsFor({ startDate: '2026-12-01', endDate: '2026-12-01' })).toEqual([])
    expect(errorsFor({ endDate: '2026-12-01' })).toEqual([])
  })

  it('checks the cover image and gallery links', () => {
    expect(errorsFor({ coverImageUrl: 'not a link' })).toHaveLength(1)
    expect(errorsFor({ gallery: [{ kind: 'image', url: 'ftp://x' }] })).toHaveLength(1)
    expect(errorsFor({ gallery: [{ kind: 'youtube', url: 'https://example.com/v' }] })).toEqual([
      'gallery.0.url: Enter a YouTube link (youtube.com or youtu.be)',
    ])
    expect(
      errorsFor({
        coverImageUrl: 'https://img.example/cover.jpg',
        gallery: [
          { kind: 'image', url: 'https://img.example/1.jpg' },
          { kind: 'youtube', url: 'https://youtu.be/abc' },
        ],
      })
    ).toEqual([])
  })

  it('checks the reminder numbers', () => {
    expect(
      errorsFor({ reminderPolicy: { frequency: 'weekly', daysBeforeDue: Number.NaN, overdueNotices: -1 } })
    ).toHaveLength(2)
  })
})

describe('mapping', () => {
  it('upper-cases the code and drops spaces', () => {
    expect(normalisePaybillCode(' bu ild ')).toBe('BUILD')
  })

  it('sends blanks as null and trims text', () => {
    expect(toCampaignInput({ ...valid, title: '  Church Building ', summary: ' hi ' })).toEqual({
      title: 'Church Building',
      categoryId: '3',
      purposeId: null,
      targetAmount: '1000000',
      paybillCode: 'BUILD',
      startDate: null,
      endDate: null,
      summary: 'hi',
      story: '',
      coverImageUrl: '',
      gallery: [],
      isPublic: true,
      allowPledges: true,
      allowChampions: false,
      reminderPolicy: { frequency: 'monthly', daysBeforeDue: 3, overdueNotices: 1 },
    })
  })

  it('pre-fills the form from a campaign and round-trips', () => {
    const c = campaign({
      purposeId: '7',
      startDate: null,
      gallery: [
        { kind: 'youtube', url: 'https://youtu.be/abc' },
        { kind: 'audio', url: 'https://x.example/a' },
      ],
      reminderPolicy: { frequency: 'daily', daysBeforeDue: 5, overdueNotices: 2 },
    }) as unknown as Campaign
    const values = campaignToFormValues(c)
    expect(values).toMatchObject({
      purposeId: '7',
      startDate: '',
      endDate: '2026-12-31',
      gallery: [
        { kind: 'youtube', url: 'https://youtu.be/abc' },
        { kind: 'image', url: 'https://x.example/a' },
      ],
      reminderPolicy: { frequency: 'monthly', daysBeforeDue: 5, overdueNotices: 2 },
    })
    expect(toCampaignInput(values)).toMatchObject({ purposeId: '7', startDate: null, paybillCode: 'BUILD' })
  })
})
