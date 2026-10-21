import { describe, expect, it } from 'vitest'
import {
  championPath,
  championShareUrl,
  championVisibilityNotice,
  donorsLabel,
  firstName,
  initials,
  targetPercent,
} from '@/components/champions/public/champion-format'
import { championAccountReference, championPaymentInstructions } from '@/components/campaigns/give/champion-account'

describe('champion-format', () => {
  it('takes the first name and initials', () => {
    expect(firstName('  Mary  Wanjiku ')).toBe('Mary')
    expect(firstName('Cher')).toBe('Cher')
    expect(initials('Mary Akinyi Wanjiku')).toBe('MW')
    expect(initials('cher')).toBe('C')
    expect(initials('  ')).toBe('?')
  })

  it('counts donors', () => {
    expect(donorsLabel(1)).toBe('1 donor')
    expect(donorsLabel(0)).toBe('0 donors')
  })

  it('works out the personal-target percentage', () => {
    expect(targetPercent('12500.00', '50000.00')).toBe(25)
    expect(targetPercent('60000', '50000')).toBe(120)
    expect(targetPercent('100', null)).toBeNull()
    expect(targetPercent('100', '0')).toBeNull()
    expect(targetPercent('oops', '1000')).toBe(0)
  })

  it('builds the champion link, preferring the server address', () => {
    expect(championPath('new roof', 'MARY')).toBe('/campaigns/new%20roof/c/MARY')
    expect(championShareUrl({ slug: 'roof', code: 'MARY', publicUrl: 'https://x.example/campaigns/roof/c/MARY' })).toBe(
      'https://x.example/campaigns/roof/c/MARY',
    )
    expect(championShareUrl({ slug: 'roof', code: 'MARY', publicUrl: 'javascript:alert(1)' })).toMatch(
      /^https?:\/\/.+\/campaigns\/roof\/c\/MARY$/,
    )
  })

  it('tells donors the champion sees their name (decision 4)', () => {
    expect(championVisibilityNotice('Mary Wanjiku')).toBe('Mary can see your name and the amount you give.')
  })

  it('builds the champion Pay Bill account', () => {
    expect(championAccountReference('ROOF ', 'john')).toBe('ROOF JOHN')
    expect(
      championPaymentInstructions({ paybillNumber: '247247', accountReference: 'ROOF', text: 'x' }, 'john'),
    ).toEqual({ paybillNumber: '247247', accountReference: 'ROOF JOHN', text: 'Pay Bill 247247, Account ROOF JOHN' })
  })
})
