/**
 * Lane S4-UI-G: pure helpers behind the campaign Statement tab.
 */

import {
  ALL_TIME,
  compactKes,
  describePeriod,
  moneyInByChannel,
  moneyInOverTime,
  periodError,
  pledgeCoverage,
  statementChannelLabel,
} from '@/components/campaigns/admin/statement/statement-model'
import type { StatementRow } from '@/lib/types/fundraising'

function row(on: string, channel: string, moneyIn: string, moneyOut = '0.00'): StatementRow {
  return { on, description: `${channel} on ${on}`, channel, moneyIn, moneyOut, balance: '0.00' }
}

describe('statementChannelLabel', () => {
  it('names every statement channel in plain words', () => {
    expect(statementChannelLabel('mpesa')).toBe('M-Pesa')
    expect(statementChannelLabel('manual')).toBe('Manual')
    expect(statementChannelLabel('cash')).toBe('Local Evangelism/Loose Money')
    expect(statementChannelLabel('envelope')).toBe('Envelope')
    expect(statementChannelLabel('expense')).toBe('Expense')
    expect(statementChannelLabel('payout')).toBe('Payout')
  })

  it('falls back to the receipt labels, then to the raw value', () => {
    expect(statementChannelLabel('mpesa_c2b')).toBe('M-Pesa Pay Bill')
    expect(statementChannelLabel('cheque')).toBe('cheque')
  })
})

describe('periodError', () => {
  it('accepts all time, open-ended and ordered periods', () => {
    expect(periodError(ALL_TIME)).toBeNull()
    expect(periodError({ dateFrom: '2026-11-01', dateTo: null })).toBeNull()
    expect(periodError({ dateFrom: null, dateTo: '2026-11-01' })).toBeNull()
    expect(periodError({ dateFrom: '2026-11-01', dateTo: '2026-11-01' })).toBeNull()
  })

  it('refuses a period that ends before it starts', () => {
    expect(periodError({ dateFrom: '2026-11-30', dateTo: '2026-11-01' })).toBe(
      'The end date must not be before the start date'
    )
  })
})

describe('moneyInOverTime', () => {
  it('adds up money in per day and keeps a cumulative total, ignoring money out', () => {
    const rows = [
      row('2026-11-02', 'mpesa', '100.00'),
      row('2026-11-02', 'cash', '50.00'),
      row('2026-11-05', 'expense', '0.00', '70.00'),
      row('2026-11-09', 'envelope', '25.50'),
    ]
    expect(moneyInOverTime(rows)).toEqual([
      { on: '2026-11-02', amount: 150, cumulative: 150 },
      { on: '2026-11-09', amount: 25.5, cumulative: 175.5 },
    ])
  })

  it('is empty when nothing came in', () => {
    expect(moneyInOverTime([row('2026-11-05', 'expense', '0.00', '70.00')])).toEqual([])
  })
})

describe('moneyInByChannel', () => {
  it('totals money in per channel, largest first, with a label', () => {
    const rows = [
      row('2026-11-02', 'envelope', '25.00'),
      row('2026-11-02', 'mpesa', '100.00'),
      row('2026-11-03', 'mpesa', '20.00'),
      row('2026-11-05', 'expense', '0.00', '70.00'),
    ]
    expect(moneyInByChannel(rows)).toEqual([
      { channel: 'mpesa', label: 'M-Pesa', amount: 120 },
      { channel: 'envelope', label: 'Envelope', amount: 25 },
    ])
  })
})

describe('pledgeCoverage', () => {
  it('compares received with pledged, rounding the percent', () => {
    expect(pledgeCoverage({ pledged: '300000.00', raised: '125000.00' })).toEqual({
      pledged: 300000,
      received: 125000,
      percent: 42,
    })
  })

  it('is null when nothing is pledged', () => {
    expect(pledgeCoverage({ pledged: '0.00', raised: '125000.00' })).toBeNull()
    expect(pledgeCoverage(null)).toBeNull()
  })
})

describe('compactKes', () => {
  it('shortens axis amounts', () => {
    expect(compactKes(0)).toBe('0')
    expect(compactKes(950)).toBe('950')
    expect(compactKes(12500)).toBe('12.5K')
    expect(compactKes(1_200_000)).toBe('1.2M')
  })
})

describe('describePeriod', () => {
  it('names the period in words', () => {
    expect(describePeriod(ALL_TIME)).toBe('All time')
    expect(describePeriod({ dateFrom: '2026-11-01', dateTo: null })).toBe('From 1 Nov 2026')
    expect(describePeriod({ dateFrom: null, dateTo: '2026-11-30' })).toBe('Up to 30 Nov 2026')
    expect(describePeriod({ dateFrom: '2026-11-01', dateTo: '2026-11-30' })).toBe('1 Nov 2026 – 30 Nov 2026')
  })
})
