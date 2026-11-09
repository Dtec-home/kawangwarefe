import { describe, it, expect } from 'vitest'

import { channelLabel } from '@/lib/contributions/channel'

describe('channelLabel (W4, F6)', () => {
  it.each([
    ['paybill', 'Pay Bill'],
    ['web', 'Website'],
    ['app', 'Mobile app'],
    ['ussd', 'USSD'],
    ['desk', 'Desk'],
    ['stk', 'App or website'],
  ])('%s -> %s', (channel, label) => {
    expect(channelLabel(channel)).toBe(label)
  })

  it('unknown or missing reads as a dash', () => {
    expect(channelLabel('')).toBe('—')
    expect(channelLabel(undefined)).toBe('—')
    expect(channelLabel('fax')).toBe('—')
  })
})
