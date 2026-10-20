import { describe, it, expect } from 'vitest'
import { buildShareLinks, whatsappTextUrl } from '@/lib/fundraising/share-links'

describe('buildShareLinks', () => {
  const links = buildShareLinks({
    url: 'https://church.example/campaigns/building-fund',
    text: 'Help us finish the roof',
  })

  it('pre-fills WhatsApp with the text and the link', () => {
    expect(links.whatsapp).toBe(
      'https://wa.me/?text=Help%20us%20finish%20the%20roof%20https%3A%2F%2Fchurch.example%2Fcampaigns%2Fbuilding-fund',
    )
  })

  it('shares the link on Facebook and X', () => {
    expect(links.facebook).toBe(
      'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fchurch.example%2Fcampaigns%2Fbuilding-fund',
    )
    expect(links.x).toBe(
      'https://x.com/intent/post?text=Help%20us%20finish%20the%20roof&url=https%3A%2F%2Fchurch.example%2Fcampaigns%2Fbuilding-fund',
    )
  })

  it('opens an SMS draft with the text and link', () => {
    expect(links.sms).toBe(
      'sms:?&body=Help%20us%20finish%20the%20roof%20https%3A%2F%2Fchurch.example%2Fcampaigns%2Fbuilding-fund',
    )
  })
})

describe('whatsappTextUrl', () => {
  it('encodes multi-line messages such as the contributor list', () => {
    expect(whatsappTextUrl('*Building Fund*\n1. Mary – 20,000')).toBe(
      'https://wa.me/?text=*Building%20Fund*%0A1.%20Mary%20%E2%80%93%2020%2C000',
    )
  })
})
