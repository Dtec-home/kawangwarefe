/**
 * Collection session helpers (T5.3)
 */
import { describe, it, expect } from 'vitest'
import {
  breakdownEntries,
  breakdownTotalCents,
  centsToAmount,
  checkCloseSession,
  isStaleSession,
  shiftWeeks,
  signedToCents,
  thisChurchWeek,
  toCents,
} from '@/lib/treasury/collection-sessions'

describe('money helpers', () => {
  it('parses amounts to cents', () => {
    expect(toCents('1500')).toBe(150000)
    expect(toCents('1,500.5')).toBe(150050)
    expect(toCents('0.05')).toBe(5)
    expect(toCents('')).toBeNull()
    expect(toCents('-5')).toBeNull()
    expect(toCents('1.234')).toBeNull()
    expect(toCents('abc')).toBeNull()
  })

  it('handles signed API decimals and formats cents', () => {
    expect(signedToCents('-200.00')).toBe(-20000)
    expect(signedToCents('50.00')).toBe(5000)
    expect(signedToCents(null)).toBeNull()
    expect(centsToAmount(150050)).toBe('1500.50')
    expect(centsToAmount(-5)).toBe('-0.05')
  })
})

describe('denomination breakdown', () => {
  it('keeps positive whole counts in denomination order and totals them', () => {
    const counts = { '1': '3', '1000': '2', '500': '0', '50': '', '200': '1' }
    expect(breakdownEntries(counts)).toEqual([
      { denomination: '1000', count: 2 },
      { denomination: '200', count: 1 },
      { denomination: '1', count: 3 },
    ])
    expect(breakdownTotalCents(counts)).toBe(220300)
  })
})

describe('checkCloseSession', () => {
  const base = { countedCash: '1500', counts: {}, varianceReason: '', recordedTotal: '1500.00' }

  it('accepts a balanced count without a reason', () => {
    const check = checkCloseSession(base)
    expect(check.errors).toEqual({})
    expect(check.varianceCents).toBe(0)
  })

  it('requires the counted cash', () => {
    expect(checkCloseSession({ ...base, countedCash: '' }).errors.countedCash).toMatch(/Enter the cash/)
    expect(checkCloseSession({ ...base, countedCash: '12.345' }).errors.countedCash).toMatch(/valid amount/)
  })

  it('requires a breakdown to add up to the counted cash', () => {
    const check = checkCloseSession({ ...base, counts: { '1000': '1', '200': '2' } })
    expect(check.errors.breakdown).toBe('The breakdown adds up to KES 1,400.00, not KES 1,500.00')
    expect(checkCloseSession({ ...base, counts: { '1000': '1', '500': '1' } }).errors.breakdown).toBeUndefined()
    expect(checkCloseSession({ ...base, counts: { '1000': '1.5' } }).errors.breakdown).toMatch(/whole numbers/)
  })

  it('requires a variance reason of at least 10 characters when counted differs', () => {
    const short = checkCloseSession({ ...base, countedCash: '1300', varianceReason: 'change' })
    expect(short.varianceCents).toBe(-20000)
    expect(short.errors.varianceReason).toMatch(/at least 10 characters/)
    const ok = checkCloseSession({ ...base, countedCash: '1300', varianceReason: 'Gave change to a visitor' })
    expect(ok.errors).toEqual({})
  })
})

describe('dates', () => {
  const now = new Date('2026-09-17T09:00:00Z') // Thu 17 Sep 2026 in Nairobi

  it('flags an open session from a previous day as stale', () => {
    expect(isStaleSession({ date: '2026-09-12', status: 'open' }, now)).toBe(true)
    expect(isStaleSession({ date: '2026-09-17', status: 'open' }, now)).toBe(false)
    expect(isStaleSession({ date: '2026-09-12', status: 'closed' }, now)).toBe(false)
  })

  it('uses the Sunday → Saturday church week and shifts by weeks', () => {
    expect(thisChurchWeek(now)).toEqual({ dateFrom: '2026-09-13', dateTo: '2026-09-19' })
    expect(thisChurchWeek(new Date('2026-09-19T22:00:00Z'))).toEqual({ dateFrom: '2026-09-20', dateTo: '2026-09-26' })
    expect(shiftWeeks({ dateFrom: '2026-09-13', dateTo: '2026-09-19' }, -1)).toEqual({
      dateFrom: '2026-09-06',
      dateTo: '2026-09-12',
    })
  })
})
