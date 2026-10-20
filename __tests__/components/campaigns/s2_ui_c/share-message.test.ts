import { describe, expect, it } from 'vitest'
import { campaignShareMessage, campaignShareUrl } from '@/components/campaigns/public/share-message'

const pay = { paybillNumber: '247247', accountReference: 'BUILD', text: '' }

describe('campaignShareMessage', () => {
  it('names the campaign and how to give on M-Pesa', () => {
    expect(campaignShareMessage('New Church Roof', pay)).toBe(
      'Help us raise funds for New Church Roof. Give via M-Pesa Pay Bill 247247, account BUILD, or online:',
    )
  })
  it('leaves the Pay Bill out when it is unknown', () => {
    expect(campaignShareMessage('New Church Roof', null)).toBe('Help us raise funds for New Church Roof. Give online:')
    expect(campaignShareMessage('Roof', { ...pay, paybillNumber: '' })).toBe('Help us raise funds for Roof. Give online:')
  })
})

describe('campaignShareUrl', () => {
  it('uses the public link the server gives', () => {
    expect(campaignShareUrl({ slug: 'roof', publicUrl: 'https://church.example/campaigns/roof' })).toBe(
      'https://church.example/campaigns/roof',
    )
  })
  it('falls back to the site address', () => {
    expect(campaignShareUrl({ slug: 'new roof', publicUrl: '' })).toBe(
      'https://www.sdakawangware.org/campaigns/new%20roof',
    )
  })
})
