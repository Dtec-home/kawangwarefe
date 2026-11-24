/** WA-3: client checks mirror PostSettingsService (fundraising/services/post_settings.py). */
import { describe, it, expect } from 'vitest'

import { TEXT_MAX, isTime, validateSettings } from '@/lib/whatsapp-posts/validation'

import { settings } from './fixtures'

describe('isTime', () => {
  it('accepts HH:MM the way parse_hhmm does', () => {
    expect(isTime('08:00')).toBe(true)
    expect(isTime('8:30')).toBe(true)
    expect(isTime('23:59')).toBe(true)
    expect(isTime('24:00')).toBe(false)
    expect(isTime('12:60')).toBe(false)
    expect(isTime('12:5')).toBe(false)
    expect(isTime('')).toBe(false)
    expect(isTime(null)).toBe(false)
  })
})

describe('validateSettings', () => {
  it('passes the default', () => {
    expect(validateSettings(settings())).toEqual({})
  })

  it('refuses an interval under 30 minutes', () => {
    expect(validateSettings(settings({ intervalMinutes: 15 })).intervalMinutes)
      .toBe('Post at most every 30 minutes (WhatsApp may block a busy number).')
    expect(validateSettings(settings({ intervalMinutes: 30 })).intervalMinutes).toBeUndefined()
  })

  it('needs a window that starts before it ends (interval only)', () => {
    expect(validateSettings(settings({ windowStart: '20:00', windowEnd: '08:00' })).windowEnd)
      .toBe('The window must start before it ends.')
    expect(validateSettings(settings({ scheduleKind: 'daily', windowStart: '20:00', windowEnd: '08:00' })))
      .toEqual({})
  })

  it('needs times like 08:00', () => {
    expect(validateSettings(settings({ windowStart: 'soon' })).windowStart).toBe('The window start must be a time like 08:00.')
    expect(validateSettings(settings({ finalPostTime: '25:00' })).finalPostTime).toBe('The final post time must be a time like 08:00.')
    expect(validateSettings(settings({ scheduleKind: 'fixed_times', fixedTimes: ['12:00', 'x'] })).fixedTimes)
      .toBe('Each fixed time must be a time like 08:00.')
  })

  it('needs at least one day', () => {
    expect(validateSettings(settings({ daysOfWeek: [] })).daysOfWeek).toBe('Choose at least one day, Monday (0) to Sunday (6).')
  })

  it('needs a fixed time for fixed times and a time for once a day', () => {
    expect(validateSettings(settings({ scheduleKind: 'fixed_times', fixedTimes: [] })).fixedTimes).toBe('Add at least one fixed time.')
    expect(validateSettings(settings({ scheduleKind: 'daily', finalPostTime: null })).finalPostTime)
      .toBe('Once a day needs the time of that post.')
  })

  it('keeps the intro and closing under the limit', () => {
    const long = 'a'.repeat(TEXT_MAX + 1)
    expect(validateSettings(settings({ introText: long })).introText).toBe('Keep the intro and closing text under 1000 characters.')
    expect(validateSettings(settings({ closingText: `  ${'a'.repeat(TEXT_MAX)}  ` })).closingText).toBeUndefined()
  })
})
