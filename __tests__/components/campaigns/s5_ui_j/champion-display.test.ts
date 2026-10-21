import {
  championCodeError,
  championPaybillText,
  championStatusLabel,
  championWhatsappMessage,
  normalizeChampionCode,
  personalTargetError,
  personalTargetProgress,
} from '@/components/champions/dashboard/champion-display'

const champion = {
  campaignTitle: 'New Church Roof',
  code: 'JANE',
  raised: '15000.00',
  donorCount: 2,
  personalTarget: '50000.00' as string | null,
  publicUrl: 'https://church.example/campaigns/new-church-roof/c/JANE',
  paymentInstructions: { paybillNumber: '4012345', accountReference: 'ROOF JANE', text: 'x' },
}

describe('champion display helpers', () => {
  it('labels statuses in plain words', () => {
    expect(championStatusLabel('PENDING')).toBe('Waiting for approval')
    expect(championStatusLabel('ACTIVE')).toBe('Active')
    expect(championStatusLabel('INACTIVE')).toBe('Inactive')
  })

  it('upper-cases codes and drops anything but letters and digits', () => {
    expect(normalizeChampionCode(' ja-ne 1')).toBe('JANE1')
  })

  it('accepts 2 to 9 capitals or digits only', () => {
    expect(championCodeError('JO')).toBeNull()
    expect(championCodeError('MAMA12345')).toBeNull()
    expect(championCodeError('J')).toMatch(/2 to 9/)
    expect(championCodeError('ABCDEFGHIJ')).toMatch(/2 to 9/)
    expect(championCodeError('')).toMatch(/2 to 9/)
  })

  it('allows an empty personal target but not one below KES 1', () => {
    expect(personalTargetError('')).toBeNull()
    expect(personalTargetError('20000')).toBeNull()
    expect(personalTargetError('0')).toMatch(/at least KES 1/)
    expect(personalTargetError('abc')).toMatch(/at least KES 1/)
  })

  it('writes the Pay Bill line', () => {
    expect(championPaybillText(champion.paymentInstructions)).toBe('Pay Bill 4012345, Account ROOF JANE')
  })

  it('writes a WhatsApp message with the link and the account', () => {
    const text = championWhatsappMessage(champion)
    expect(text).toContain('New Church Roof')
    expect(text).toContain(champion.publicUrl)
    expect(text).toContain('Pay Bill 4012345, Account ROOF JANE')
  })

  it('builds progress figures towards the personal target', () => {
    expect(personalTargetProgress(champion)).toEqual({
      target: '50000.00',
      raised: '15000.00',
      remaining: '35000.00',
      percent: 30,
      donorCount: 2,
      giftCount: 0,
      pledged: '0',
    })
    expect(personalTargetProgress({ ...champion, personalTarget: null })).toBeNull()
    expect(personalTargetProgress({ ...champion, raised: '60000', personalTarget: '50000' })?.remaining).toBe('0.00')
  })
})
