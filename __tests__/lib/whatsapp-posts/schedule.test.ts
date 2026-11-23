/** WA-3: the one-line schedule summary (E8 default reads as the plan says). */
import { describe, it, expect } from 'vitest'

import { daysSummary, intervalPhrase, scheduleSummary } from '@/lib/whatsapp-posts/schedule'

import { settings } from './fixtures'

describe('scheduleSummary', () => {
  it('reads the E8 default as the plan says', () => {
    expect(scheduleSummary(settings())).toBe('Hourly 08:00–20:00 when something changed, plus 23:50')
  })

  it('leaves out "when something changed" and the final post when they are off', () => {
    expect(scheduleSummary(settings({ onlyWhenChanged: false, finalPostTime: null }))).toBe('Hourly 08:00–20:00')
  })

  it('names other intervals in minutes or hours', () => {
    expect(scheduleSummary(settings({ intervalMinutes: 30, onlyWhenChanged: false, finalPostTime: null })))
      .toBe('Every 30 minutes 08:00–20:00')
    expect(scheduleSummary(settings({ intervalMinutes: 120, onlyWhenChanged: false, finalPostTime: null })))
      .toBe('Every 2 hours 08:00–20:00')
    expect(intervalPhrase(90)).toBe('Every 90 minutes')
  })

  it('lists fixed times in order', () => {
    expect(scheduleSummary(settings({ scheduleKind: 'fixed_times', fixedTimes: ['18:00', '12:00'] })))
      .toBe('At 12:00 and 18:00 when something changed, plus 23:50')
    expect(scheduleSummary(settings({ scheduleKind: 'fixed_times', fixedTimes: ['12:00', '15:00', '18:00'], finalPostTime: null, onlyWhenChanged: false })))
      .toBe('At 12:00, 15:00 and 18:00')
    expect(scheduleSummary(settings({ scheduleKind: 'fixed_times', fixedTimes: [] }))).toBe('No fixed times yet')
  })

  it('reads once a day as its one time', () => {
    expect(scheduleSummary(settings({ scheduleKind: 'daily', finalPostTime: '21:00' }))).toBe('Once a day at 21:00')
    expect(scheduleSummary(settings({ scheduleKind: 'daily', finalPostTime: null }))).toBe('Once a day (choose the time)')
  })

  it('adds the days when not every day', () => {
    expect(scheduleSummary(settings({ daysOfWeek: [0, 1, 2, 3, 4], finalPostTime: null })))
      .toBe('Hourly 08:00–20:00 when something changed, Monday to Friday')
    expect(scheduleSummary(settings({ scheduleKind: 'daily', daysOfWeek: [6] }))).toBe('Once a day at 23:50, on Sun')
  })
})

describe('daysSummary', () => {
  it('names common sets of days', () => {
    expect(daysSummary([0, 1, 2, 3, 4, 5, 6])).toBe('Every day')
    expect(daysSummary([0, 1, 2, 3, 4])).toBe('Monday to Friday')
    expect(daysSummary([5, 6])).toBe('Weekends')
    expect(daysSummary([4, 0, 2])).toBe('Mon, Wed, Fri')
    expect(daysSummary([])).toBe('No days')
  })
})
