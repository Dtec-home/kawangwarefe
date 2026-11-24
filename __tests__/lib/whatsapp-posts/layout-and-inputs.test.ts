/** WA-3: layout helpers, WhatsApp formatting and what each screen sends. */
import { describe, it, expect } from 'vitest'

import {
  campaignBaseline,
  campaignDraft,
  describeField,
  overriddenFields,
  toCampaignInput,
  toChurchInput,
  toFullOverrideInput,
  toSettings,
} from '@/lib/whatsapp-posts/inputs'
import { completeLayout, layoutInput, moveBlock, sameLayout, toggleBlock } from '@/lib/whatsapp-posts/layout'
import { whatsappSegments } from '@/lib/whatsapp-posts/format'

import { available, blocks, campaignOverride, church, settings } from './fixtures'

const keys = (layout: { block: string }[]) => layout.map((b) => b.block)

describe('layout helpers', () => {
  it('moves a block up and down, and not past the ends', () => {
    const layout = blocks()
    expect(keys(moveBlock(layout, 1, 'up')).slice(0, 2)).toEqual(['intro', 'header'])
    expect(keys(moveBlock(layout, 0, 'down')).slice(0, 2)).toEqual(['intro', 'header'])
    expect(moveBlock(layout, 0, 'up')).toBe(layout)
    expect(moveBlock(layout, layout.length - 1, 'down')).toBe(layout)
  })

  it('switches one block on or off without touching the rest', () => {
    const next = toggleBlock(blocks(), 'thank_you')
    expect(next.find((b) => b.block === 'thank_you')?.enabled).toBe(true)
    expect(next.filter((b) => b.enabled)).toHaveLength(12)
    expect(toggleBlock(next, 'thank_you', false).find((b) => b.block === 'thank_you')?.enabled).toBe(false)
  })

  it('lists every available block, missing ones switched off at the end', () => {
    const partial = blocks().filter((b) => b.block !== 'pledged' && b.block !== 'closing')
    const full = completeLayout(partial, available())
    expect(full).toHaveLength(12)
    expect(keys(full).slice(-2)).toEqual(['pledged', 'closing'])
    expect(full.slice(-2).every((b) => !b.enabled)).toBe(true)
    // Unknown blocks are dropped.
    expect(completeLayout([{ block: 'nope', enabled: true, label: '', description: '' }], available())).toHaveLength(12)
  })

  it('sends only block and enabled, and compares layouts by them', () => {
    expect(layoutInput(blocks()).slice(0, 1)).toEqual([{ block: 'header', enabled: true }])
    expect(sameLayout(blocks(), blocks())).toBe(true)
    expect(sameLayout(blocks(), moveBlock(blocks(), 0, 'down'))).toBe(false)
  })
})

describe('whatsappSegments', () => {
  it('renders *bold* and _italic_ like WhatsApp', () => {
    expect(whatsappSegments('*📢 Building* today _soon_')).toEqual([
      { text: '📢 Building', bold: true, italic: false },
      { text: ' today ', bold: false, italic: false },
      { text: 'soon', bold: false, italic: true },
    ])
  })

  it('leaves lone stars alone', () => {
    expect(whatsappSegments('5 * 3')).toEqual([{ text: '5 * 3', bold: false, italic: false }])
  })
})

describe('church input', () => {
  it('sends every field, the layout as block and enabled, and the group', () => {
    const input = toChurchInput(settings({ finalPostTime: null }), ' 1203@g.us ')
    expect(input).toMatchObject({
      scheduleKind: 'interval',
      intervalMinutes: 60,
      windowStart: '08:00',
      windowEnd: '20:00',
      finalPostTime: null,
      churchWhatsappGroupId: '1203@g.us',
    })
    expect(input.layout?.[0]).toEqual({ block: 'header', enabled: true })
  })

  it('previews unsaved church settings as a full campaign override', () => {
    const input = toFullOverrideInput(settings({ finalPostTime: null, introText: 'Hi' }))
    expect(input).toMatchObject({ useChurchDefault: false, noFinalPost: true, finalPostTime: null, introText: 'Hi' })
    expect(toFullOverrideInput(settings()).noFinalPost).toBe(false)
  })

  it('reads a server answer into editor settings', () => {
    const s = toSettings(church({ scheduleKind: 'daily', layout: blocks().slice(0, 3) }))
    expect(s.scheduleKind).toBe('daily')
    expect(s.layout).toHaveLength(12)
  })
})

describe('campaign override', () => {
  it('knows which fields the campaign changed', () => {
    expect(overriddenFields(campaignOverride())).toEqual([])
    const o = campaignOverride({ useChurchDefault: false, intervalMinutes: 120, noFinalPost: true, introText: '' })
    expect(overriddenFields(o)).toEqual(['intervalMinutes', 'finalPostTime', 'introText'])
  })

  it('drafts the override over the church values', () => {
    const o = campaignOverride({
      useChurchDefault: false,
      intervalMinutes: 120,
      noFinalPost: true,
      effective: church({ intervalMinutes: 120, finalPostTime: null }),
    })
    const draft = campaignDraft(o)
    expect(draft.intervalMinutes).toBe(120)
    expect(draft.finalPostTime).toBeNull()
    expect(draft.windowStart).toBe('08:00')
  })

  it('knows the church values of the inherited fields only (all of them when following the church)', () => {
    const following = campaignBaseline(campaignOverride({ intervalMinutes: 120 }))
    expect(following.intervalMinutes).toBe(60)
    const o = campaignOverride({ useChurchDefault: false, intervalMinutes: 120, effective: church({ intervalMinutes: 120 }) })
    const base = campaignBaseline(o)
    expect(base.intervalMinutes).toBeUndefined()
    expect(base.windowStart).toBe('08:00')
    // An admin's church settings fill in the rest.
    expect(campaignBaseline(o, settings()).intervalMinutes).toBe(60)
  })

  it('follows the church wholesale with one flag', () => {
    expect(toCampaignInput(settings(), new Set(['intervalMinutes']), true)).toEqual({ useChurchDefault: true })
  })

  it('sends changed fields and null for inherited ones', () => {
    const input = toCampaignInput(settings({ intervalMinutes: 120, introText: 'Karibu' }), new Set(['intervalMinutes', 'introText']), false)
    expect(input).toEqual({
      useChurchDefault: false,
      scheduleKind: null,
      intervalMinutes: 120,
      windowStart: null,
      windowEnd: null,
      daysOfWeek: null,
      fixedTimes: null,
      finalPostTime: null,
      noFinalPost: false,
      onlyWhenChanged: null,
      postWhenZero: null,
      layout: null,
      introText: 'Karibu',
      closingText: null,
    })
  })

  it('turns the final post off with noFinalPost', () => {
    const off = toCampaignInput(settings({ finalPostTime: null }), new Set(['finalPostTime']), false)
    expect(off).toMatchObject({ finalPostTime: null, noFinalPost: true })
    const at = toCampaignInput(settings({ finalPostTime: '22:00' }), new Set(['finalPostTime']), false)
    expect(at).toMatchObject({ finalPostTime: '22:00', noFinalPost: false })
  })

  it('describes a church value in plain words', () => {
    const s = settings()
    expect(describeField('scheduleKind', s)).toBe('Every N minutes in a window')
    expect(describeField('intervalMinutes', s)).toBe('Hourly')
    expect(describeField('windowStart', s)).toBe('08:00')
    expect(describeField('daysOfWeek', s)).toBe('Every day')
    expect(describeField('fixedTimes', s)).toBe('none')
    expect(describeField('finalPostTime', s)).toBe('23:50')
    expect(describeField('finalPostTime', settings({ finalPostTime: null }))).toBe('no final post')
    expect(describeField('onlyWhenChanged', s)).toBe('on')
    expect(describeField('postWhenZero', s)).toBe('off')
    expect(describeField('layout', s)).toBe('11 of 12 blocks on')
    expect(describeField('introText', s)).toBe('none')
    expect(describeField('introText', settings({ introText: 'Karibu sana' }))).toBe('“Karibu sana”')
  })
})
