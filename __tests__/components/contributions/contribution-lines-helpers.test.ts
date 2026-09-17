import { describe, it, expect } from 'vitest'
import {
  contributionLinesTotal,
  toManualCategoryInputs,
  validateContributionLines,
} from '@/components/contributions/contribution-lines-form'
import {
  effectiveRecordFor,
  transactionDateVariables,
} from '@/components/contributions/recording-for-field'

describe('contribution line helpers', () => {
  it('drops blank lines and requires a department and amount', () => {
    expect(validateContributionLines([{ categoryId: '', amount: '' }])).toEqual({
      ok: false,
      error: 'Add at least one department and amount',
    })
    expect(validateContributionLines([{ categoryId: '', amount: '50' }])).toMatchObject({ ok: false })
    expect(validateContributionLines([{ categoryId: '1', amount: '0.5' }])).toMatchObject({ ok: false })
    expect(
      validateContributionLines([
        { categoryId: '1', amount: '500' },
        { categoryId: '', amount: '' },
      ])
    ).toEqual({ ok: true, lines: [{ categoryId: '1', amount: '500' }] })
  })

  it('maps lines to mutation input and sums the total', () => {
    const lines = [
      { categoryId: '1', amount: '500', purposeId: '' },
      { categoryId: '2', amount: '250.50', purposeId: '7', memberIdentifier: 'W-12' },
      { categoryId: '', amount: 'abc' },
    ]
    expect(toManualCategoryInputs(lines.slice(0, 2))).toEqual([
      { categoryId: '1', amount: '500', purposeId: null, memberIdentifier: null },
      { categoryId: '2', amount: '250.50', purposeId: '7', memberIdentifier: 'W-12' },
    ])
    expect(contributionLinesTotal(lines)).toBe(750.5)
  })

  it('only sends a transaction date for a still-open catch-up date', () => {
    expect(effectiveRecordFor('2026-08-29', ['2026-08-29'])).toBe('2026-08-29')
    expect(effectiveRecordFor('2026-08-29', [])).toBe('today')
    expect(transactionDateVariables('today')).toEqual({})
    expect(transactionDateVariables('2026-08-29')).toEqual({ transactionDate: '2026-08-29' })
  })
})
