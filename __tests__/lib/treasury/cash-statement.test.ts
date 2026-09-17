import { describe, it, expect } from 'vitest'
import {
  inclusiveDayCount,
  mostRecentSaturday,
  statementRangeError,
} from '@/lib/treasury/cash-statement'

describe('mostRecentSaturday (Africa/Nairobi)', () => {
  it('returns the previous Saturday on a Wednesday', () => {
    // Wed 16 Sep 2026, 10:00 Nairobi
    expect(mostRecentSaturday(new Date('2026-09-16T07:00:00Z'))).toBe('2026-09-12')
  })

  it('returns today on a Saturday', () => {
    expect(mostRecentSaturday(new Date('2026-09-12T09:00:00Z'))).toBe('2026-09-12')
  })

  it('uses the Nairobi date, not UTC, near midnight', () => {
    // Fri 22:30 UTC = Sat 01:30 in Nairobi
    expect(mostRecentSaturday(new Date('2026-09-18T22:30:00Z'))).toBe('2026-09-19')
  })

  it('returns yesterday on a Sunday', () => {
    expect(mostRecentSaturday(new Date('2026-09-13T12:00:00Z'))).toBe('2026-09-12')
  })
})

describe('statement range validation', () => {
  it('counts days inclusively', () => {
    expect(inclusiveDayCount('2026-08-29', '2026-08-29')).toBe(1)
    expect(inclusiveDayCount('2026-08-01', '2026-08-31')).toBe(31)
  })

  it('accepts a valid range up to 366 days', () => {
    expect(statementRangeError('2026-08-01', '2026-08-31')).toBeNull()
    expect(statementRangeError('2024-01-01', '2024-12-31')).toBeNull() // leap year: 366 days
  })

  it('rejects missing dates, reversed ranges and ranges over 366 days', () => {
    expect(statementRangeError('', '2026-08-31')).toMatch(/both/)
    expect(statementRangeError('2026-09-01', '2026-08-31')).toMatch(/must not be before/)
    expect(statementRangeError('2025-01-01', '2026-01-02')).toMatch(/at most 366 days/)
  })
})
