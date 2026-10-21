import { toInviteChampionVars } from '@/components/campaigns/admin/champions/invite-champion-dialog'

describe('toInviteChampionVars', () => {
  it('normalises the phone and sends no target when it is blank', () => {
    expect(toInviteChampionVars('42', { phoneNumber: '712345678', code: 'JANE', personalTarget: ' ' })).toEqual({
      campaignId: '42',
      phoneNumber: '254712345678',
      code: 'JANE',
      personalTarget: null,
    })
  })

  it('keeps a personal target', () => {
    expect(toInviteChampionVars('42', { phoneNumber: '0112345678', code: 'MAMA1', personalTarget: '30000' })).toMatchObject({
      phoneNumber: '254112345678',
      personalTarget: '30000',
    })
  })
})
