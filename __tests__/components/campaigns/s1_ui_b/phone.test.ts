import { describe, it, expect } from 'vitest'
import { toKenyanMsisdn } from '@/components/campaigns/give/phone'

describe('toKenyanMsisdn', () => {
  it.each([
    ['0712345678', '254712345678'],
    ['712345678', '254712345678'],
    ['254712345678', '254712345678'],
    ['+254 712 345 678', '254712345678'],
    ['0112345678', '254112345678'],
  ])('normalises %s', (input, expected) => {
    expect(toKenyanMsisdn(input)).toBe(expected)
  })

  it.each(['', '12345', '0812345678', '07123456789', 'abc'])('rejects %s', (input) => {
    expect(toKenyanMsisdn(input)).toBeNull()
  })
})
