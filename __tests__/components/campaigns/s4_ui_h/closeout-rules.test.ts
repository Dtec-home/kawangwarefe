import { describe, it, expect } from 'vitest'

import { isClosable } from '@/components/campaigns/admin/closeout/close-campaign-action'

describe('isClosable', () => {
  it('lets only active and paused campaigns be closed', () => {
    expect(isClosable('ACTIVE')).toBe(true)
    expect(isClosable('PAUSED')).toBe(true)
    expect(isClosable('DRAFT')).toBe(false)
    expect(isClosable('PENDING_APPROVAL')).toBe(false)
    expect(isClosable('CLOSED')).toBe(false)
  })
})
