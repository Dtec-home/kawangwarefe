/**
 * One-SMS counting rules (mirror of church_BE notifications/services/sms_budget.py).
 */
import { describe, it, expect } from 'vitest'

import { countSms, hasNameTokens, nonGsmChars, worstCase } from '@/lib/notifications/sms-segments'

describe('countSms', () => {
  it('counts 160 plain characters as one GSM-7 segment and 161 as two', () => {
    expect(countSms('a'.repeat(160))).toMatchObject({ length: 160, limit: 160, encoding: 'GSM-7', segments: 1, fits: true })
    expect(countSms('a'.repeat(161))).toMatchObject({ segments: 2, fits: false })
    expect(countSms('a'.repeat(307)).segments).toBe(3)
  })

  it.each(['{', '}', '[', ']', '~', '\\', '|', '^', '€'])('counts the extension character %s as two', (ch) => {
    expect(countSms(ch).length).toBe(2)
    expect(countSms('a'.repeat(158) + ch).fits).toBe(true)
    expect(countSms('a'.repeat(159) + ch).fits).toBe(false)
  })

  it.each(['’', '“', '–', '…', 'é', '£', '`'])('switches to UCS-2 (70) for %s', (ch) => {
    const count = countSms('Thank you' + ch)
    expect(count).toMatchObject({ encoding: 'UCS-2', limit: 70, nonGsm: [ch] })
    expect(countSms('a'.repeat(69) + ch).fits).toBe(true)
    expect(countSms('a'.repeat(70) + ch).fits).toBe(false)
  })

  it('counts an emoji as two UTF-16 units', () => {
    expect(countSms('🙏'.repeat(35)).fits).toBe(true)
    expect(countSms('🙏'.repeat(36)).segments).toBe(2)
  })

  it('counts name tokens at their longest', () => {
    expect(worstCase('Hi {{first_name}} {{ last_name }} {{full_name}} {{unknown}}')).toBe(
      'Hi ' + 'x'.repeat(12) + ' ' + 'x'.repeat(15) + ' ' + 'x'.repeat(25) + ' {{unknown}}'
    )
    expect(countSms('Hi {{first_name}}').length).toBe(15)
    expect(hasNameTokens('Hi {{first_name}}')).toBe(true)
    expect(hasNameTokens('Hi {{nickname}}')).toBe(false)
  })

  it('lists each non-GSM character once', () => {
    expect(nonGsmChars('“God’s” ’')).toEqual(['“', '’', '”'])
  })
})
